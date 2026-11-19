import type {
    BindingPipe,
    ParseSourceSpan,
    TmplAstBoundAttribute,
    TmplAstBoundEvent,
    TmplAstReference
} from "@angular/compiler";
import {
    BindingType,
    CombinedRecursiveAstVisitor,
    createCssSelectorFromNode,
    CssSelector,
    DomElementSchemaRegistry,
    ParsedEventType,
    parseTemplate,
    SelectorMatcher,
    splitNsName,
    TmplAstElement,
    TmplAstTemplate,
    TmplAstTextAttribute
} from "@angular/compiler";
import { allMembers, bindingName } from "./api-render.js";
import type { ApiMember, ApiSymbol, ExportedSymbol } from "./docs-data.js";

/*
 * Checks a template against the API reference, the way the Angular compiler would match it, for the mistakes an agent
 * makes with a library it half knows: an element or directive that doesn't exist, an input or output it made up, a
 * missing required input, a two-way binding on a plain input. It knows Mona UI and the DOM, not the app's own
 * directives, so a binding it can't place on an element that also has unknown attributes is only a warning.
 */

export interface TemplateProblem {
    /** 1-based. */
    readonly column: number;
    /** 1-based. */
    readonly line: number;
    readonly message: string;
    readonly severity: "error" | "warning";
}

export interface TemplateCheck {
    /** The Mona UI exports the template uses, by entry point, for the component's `imports`. */
    readonly imports: ReadonlyMap<string, readonly string[]>;
    readonly problems: readonly TemplateProblem[];
}

interface Directive {
    readonly entryPoint: string;
    /** By the name a template binds: the alias when there is one. */
    readonly inputs: ReadonlyMap<string, ApiMember>;
    readonly outputs: ReadonlySet<string>;
    readonly selectorAttributes: ReadonlySet<string>;
    readonly symbol: ApiSymbol;
}

interface Location {
    /** 0-based. */
    readonly col: number;
    /** 0-based. */
    readonly line: number;
}

type Reporter = (severity: TemplateProblem["severity"], location: Location, message: string) => void;

/** What a node binds, the same way for an element and an `<ng-template>`. */
interface NodeBindings {
    readonly events: readonly TmplAstBoundEvent[];
    readonly properties: readonly TmplAstBoundAttribute[];
    readonly references: readonly TmplAstReference[];
    readonly start: ParseSourceSpan;
    readonly tag: string;
    readonly textAttributes: readonly TmplAstTextAttribute[];
}

/** Inputs of directives from Angular and its common libraries, which an element may carry next to Mona UI's. */
const FOREIGN_NAME = /^(?:cdk|form|mat|ng|router)[A-Z]/;
/** Attributes every element takes, which the DOM schema doesn't list as properties under these names. */
const GLOBAL_ATTRIBUTE = new RegExp(
    "^(?:aria-.+|data-.+|animate\\..+|i18n(?:-.+)?|accesskey|autocapitalize|class|contenteditable|enterkeyhint|" +
        "exportparts|inputmode|is|nonce|ngNonBindable|ngProjectAs|part|popover|role|slot|style)$"
);
const MONA_NAME = /^mona[A-Z0-9]/;

export class TemplateChecker {
    readonly #directives: readonly Directive[];
    readonly #elements = new Map<string, Directive[]>();
    readonly #matcher = new SelectorMatcher<Directive>();
    readonly #monaAttributes = new Map<string, Directive[]>();
    readonly #pipes = new Map<string, ExportedSymbol>();
    readonly #schema = new DomElementSchemaRegistry();

    public constructor(symbols: readonly ExportedSymbol[]) {
        const directives: Directive[] = [];
        for (const { entryPoint, symbol } of symbols) {
            if (symbol.pipeName) {
                this.#pipes.set(symbol.pipeName, { entryPoint, symbol });
            }
            if (!symbol.selector) {
                continue;
            }
            const selectors = CssSelector.parse(symbol.selector);
            const inputs = new Map(allMembers(symbol, "inputs").map(([member]) => [bindingName(member), member]));
            const outputs = new Set(allMembers(symbol, "outputs").map(([member]) => bindingName(member)));
            for (const member of inputs.values()) {
                if (member.twoWay) {
                    outputs.add(`${bindingName(member)}Change`);
                }
            }
            const selectorAttributes = new Set(
                selectors.flatMap(selector => selector.attrs.filter((_name, index) => index % 2 === 0))
            );
            const directive: Directive = { entryPoint, inputs, outputs, selectorAttributes, symbol };
            directives.push(directive);
            this.#matcher.addSelectables(selectors, directive);
            for (const selector of selectors) {
                if (selector.element) {
                    pushTo(this.#elements, selector.element, directive);
                }
            }
            for (const attribute of selectorAttributes) {
                if (MONA_NAME.test(attribute)) {
                    pushTo(this.#monaAttributes, attribute, directive);
                }
            }
        }
        this.#directives = directives;
    }

    public check(template: string): TemplateCheck {
        const problems: TemplateProblem[] = [];
        const used = new Map<string, string[]>();
        const report: Reporter = (severity, location, message) => {
            problems.push({ column: location.col + 1, line: location.line + 1, message, severity });
        };
        const parsed = parseTemplate(template, "template.html", { preserveWhitespaces: false });
        for (const error of parsed.errors ?? []) {
            report("error", error.span.start, error.msg);
        }

        const visitor = new TemplateVisitor(
            node => {
                for (const directive of this.#checkNode(node, report)) {
                    pushTo(used, directive.entryPoint, directive.symbol.name);
                }
            },
            pipe => {
                const known = this.#pipes.get(pipe.name);
                if (known) {
                    pushTo(used, known.entryPoint, known.symbol.name);
                } else if (/^mona/i.test(pipe.name)) {
                    const suggestion = suggest(pipe.name, [...this.#pipes.keys()]);
                    report(
                        "error",
                        locationAt(template, pipe.nameSpan.start),
                        `No Mona UI pipe is called \`${pipe.name}\`.${suggestion}`
                    );
                }
            }
        );
        for (const node of parsed.nodes) {
            visitor.visit(node);
        }

        problems.sort((first, second) => first.line - second.line || first.column - second.column);
        const imports = new Map(
            [...used]
                .sort(([first], [second]) => first.localeCompare(second))
                .map(([entryPoint, names]) => [entryPoint, [...names].sort()])
        );
        return { imports, problems };
    }

    /** Checks one element or `<ng-template>`, and returns the Mona UI directives that match it. */
    #checkNode(node: TmplAstElement | TmplAstTemplate, report: Reporter): Directive[] {
        const bindings = nodeBindings(node);
        const matched: Directive[] = [];
        this.#matcher.match(createCssSelectorFromNode(node), (_selector, directive) => {
            if (!matched.includes(directive)) {
                matched.push(directive);
            }
        });
        // SVG elements are named with their namespace, such as `:svg:svg`, which the DOM schema wants and people don't.
        const shown = splitNsName(bindings.tag)[1];
        const isMonaElement = shown.startsWith("mona-");
        const names = [
            ...bindings.textAttributes.map(attribute => attribute.name),
            ...bindings.properties.map(property => property.name),
            ...bindings.events.map(event => event.name)
        ];
        if (matched.length === 0 && !isMonaElement && !names.some(name => MONA_NAME.test(name))) {
            return matched;
        }

        if (isMonaElement && !matched.some(directive => this.#elements.get(bindings.tag)?.includes(directive))) {
            const candidates = this.#elements.get(bindings.tag);
            const message = candidates
                ? `<${shown}> only matches \`${candidates.map(directive => directive.symbol.selector).join("`, `")}\`.`
                : `Unknown element <${shown}>.${suggest(
                      shown,
                      [...this.#elements.keys()].filter(name => name.startsWith("mona-")),
                      "<",
                      ">"
                  )}`;
            report("error", bindings.start.start, message);
        }

        const explainedByMona = (name: string): boolean =>
            matched.some(
                directive =>
                    directive.selectorAttributes.has(name) || directive.inputs.has(name) || directive.outputs.has(name)
            );
        const explained = (name: string): boolean =>
            explainedByMona(name) ||
            GLOBAL_ATTRIBUTE.test(name) ||
            this.#schema.hasProperty(bindings.tag, this.#schema.getMappedPropName(name), []);
        // An attribute nothing here knows may be another directive's selector, which may declare the binding in turn. On
        // a plain element, such as an <svg> with an icon directive, that's likely enough to leave its bindings alone.
        const mayHaveOtherDirectives =
            bindings.textAttributes.some(
                attribute => !explained(attribute.name) && !FOREIGN_NAME.test(attribute.name)
            ) || names.some(name => FOREIGN_NAME.test(name));
        const describeMatched = matched
            .map(directive => `${directive.symbol.name} (\`${directive.symbol.selector}\`)`)
            .join(", ");
        const matchedInputs = matched.flatMap(directive => [...directive.inputs.keys()]);

        for (const name of new Set(names)) {
            if (MONA_NAME.test(name) && !explainedByMona(name)) {
                const span = this.#spanOf(bindings, name);
                const owners = this.#monaAttributes.get(name);
                const message = owners
                    ? `\`${name}\` applies to \`${owners.map(directive => directive.symbol.selector).join("`, `")}\`, not <${shown}>.`
                    : `No Mona UI directive or input is called \`${name}\`.${suggest(name, [...this.#monaAttributes.keys(), ...matchedInputs])}`;
                report("error", span.start, message);
            }
        }

        for (const property of bindings.properties) {
            if (property.type !== BindingType.Property && property.type !== BindingType.TwoWay) {
                continue;
            }
            const name = property.name;
            const owner = matched.find(directive => directive.inputs.has(name));
            if (owner) {
                const input = owner.inputs.get(name);
                if (property.type === BindingType.TwoWay && !input?.twoWay && !owner.outputs.has(`${name}Change`)) {
                    report(
                        "error",
                        (property.keySpan ?? property.sourceSpan).start,
                        `\`[(${name})]\` needs a model, but ${owner.symbol.name}'s \`${name}\` is a one-way input. Bind \`[${name}]\` and update it from an output.`
                    );
                }
                continue;
            }
            if (
                MONA_NAME.test(name) ||
                FOREIGN_NAME.test(name) ||
                matched.length === 0 ||
                (mayHaveOtherDirectives && !isMonaElement)
            ) {
                continue;
            }
            if (
                property.type === BindingType.Property &&
                this.#schema.hasProperty(bindings.tag, this.#schema.getMappedPropName(name), [])
            ) {
                continue;
            }
            report(
                mayHaveOtherDirectives ? "warning" : "error",
                (property.keySpan ?? property.sourceSpan).start,
                `\`[${name}]\` isn't an input of ${describeMatched}${isMonaElement ? "" : ` or a property of <${shown}>`}.` +
                    suggest(name, matchedInputs, "[", "]") +
                    (mayHaveOtherDirectives
                        ? " That's fine only if another directive on this element declares it."
                        : "")
            );
        }

        for (const event of bindings.events) {
            if (
                event.type !== ParsedEventType.Regular ||
                event.target ||
                matched.length === 0 ||
                (mayHaveOtherDirectives && !isMonaElement)
            ) {
                continue;
            }
            const name = event.name;
            if (explainedByMona(name) || FOREIGN_NAME.test(name) || MONA_NAME.test(name) || !/[A-Z]/.test(name)) {
                continue;
            }
            const outputs = matched.flatMap(directive => [...directive.outputs]);
            report(
                mayHaveOtherDirectives ? "warning" : "error",
                (event.keySpan ?? event.sourceSpan).start,
                `\`(${name})\` isn't an output of ${describeMatched}, so the handler never runs.${suggest(name, outputs, "(", ")")}`
            );
        }

        for (const attribute of bindings.textAttributes) {
            const name = attribute.name;
            const location = (attribute.keySpan ?? attribute.sourceSpan).start;
            const input = matched.map(directive => directive.inputs.get(name)).find(Boolean);
            if (input && takesNoString(input.type)) {
                report(
                    "warning",
                    location,
                    `\`${name}="${attribute.value}"\` passes a string, but the input takes \`${input.type}\`. Bind \`[${name}]="${attribute.value}"\` instead.`
                );
            } else if (
                !input &&
                // A Mona UI element has no attributes of its own beyond the global ones, so these were meant as inputs.
                isMonaElement &&
                matched.length > 0 &&
                !explained(name) &&
                !FOREIGN_NAME.test(name) &&
                !MONA_NAME.test(name)
            ) {
                report(
                    "warning",
                    location,
                    `\`${name}\` isn't an input of ${describeMatched}, so it only sets an HTML attribute.` +
                        `${suggest(name, matchedInputs)} That's fine if it's another directive's selector.`
                );
            }
        }

        const bound = new Set([
            ...bindings.textAttributes.map(attribute => attribute.name),
            ...bindings.properties
                .filter(property => property.type === BindingType.Property || property.type === BindingType.TwoWay)
                .map(property => property.name)
        ]);
        for (const directive of matched) {
            for (const [name, input] of directive.inputs) {
                if (input.required && !bound.has(name)) {
                    report(
                        "error",
                        bindings.start.start,
                        `<${shown}> needs \`[${name}]\`: it's a required input of ${directive.symbol.name}.`
                    );
                }
            }
        }

        for (const reference of bindings.references) {
            if (!reference.value || !/^mona/i.test(reference.value)) {
                continue;
            }
            if (!matched.some(directive => directive.symbol.exportAs === reference.value)) {
                const owner = this.#directives.find(directive => directive.symbol.exportAs === reference.value);
                const message = owner
                    ? `\`#${reference.name}="${reference.value}"\` needs ${owner.symbol.name} (\`${owner.symbol.selector}\`) on this element.`
                    : `No Mona UI directive is exported as \`${reference.value}\`.${suggest(
                          reference.value,
                          this.#directives
                              .map(directive => directive.symbol.exportAs)
                              .filter((name): name is string => !!name)
                      )}`;
                report("error", (reference.keySpan ?? reference.sourceSpan).start, message);
            }
        }
        return matched;
    }

    #spanOf(bindings: NodeBindings, name: string): ParseSourceSpan {
        const attribute = [...bindings.textAttributes, ...bindings.properties, ...bindings.events].find(
            entry => entry.name === name
        );
        return attribute?.keySpan ?? attribute?.sourceSpan ?? bindings.start;
    }
}

class TemplateVisitor extends CombinedRecursiveAstVisitor {
    readonly #onNode: (node: TmplAstElement | TmplAstTemplate) => void;
    readonly #onPipe: (pipe: BindingPipe) => void;

    public constructor(onNode: (node: TmplAstElement | TmplAstTemplate) => void, onPipe: (pipe: BindingPipe) => void) {
        super();
        this.#onNode = onNode;
        this.#onPipe = onPipe;
    }

    public override visitElement(element: TmplAstElement): void {
        this.#onNode(element);
        super.visitElement(element);
    }

    public override visitPipe(ast: BindingPipe, context: unknown): unknown {
        this.#onPipe(ast);
        return super.visitPipe(ast, context);
    }

    public override visitTemplate(template: TmplAstTemplate): void {
        this.#onNode(template);
        super.visitTemplate(template);
    }
}

/**
 * The bindings directives on a node can take. A `*directive` shorthand's template only has its template attributes:
 * the element under it keeps the rest, and is checked on its own.
 */
function nodeBindings(node: TmplAstElement | TmplAstTemplate): NodeBindings {
    if (node instanceof TmplAstTemplate && node.tagName !== "ng-template") {
        return {
            events: [],
            properties: node.templateAttrs.filter(
                (attribute): attribute is TmplAstBoundAttribute => !(attribute instanceof TmplAstTextAttribute)
            ),
            references: [],
            start: node.startSourceSpan,
            tag: "ng-template",
            textAttributes: node.templateAttrs.filter(
                (attribute): attribute is TmplAstTextAttribute => attribute instanceof TmplAstTextAttribute
            )
        };
    }
    return {
        events: node.outputs,
        properties: node.inputs,
        references: node.references,
        start: node.startSourceSpan,
        tag: node instanceof TmplAstElement ? node.name : "ng-template",
        textAttributes: node.attributes
    };
}

/** An input whose type a static attribute's string can't be: numbers, dates, arrays and the like. */
function takesNoString(type: string): boolean {
    const parts = type
        .split("|")
        .map(part => part.trim())
        .filter(part => part !== "null" && part !== "undefined");
    return (
        parts.length > 0 &&
        parts.every(
            part =>
                part === "number" ||
                part === "Date" ||
                part.endsWith("[]") ||
                /^(?:readonly\s|Readonly)?Array</.test(part) ||
                part.startsWith("readonly ")
        )
    );
}

function pushTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const existing = map.get(key);
    if (!existing) {
        map.set(key, [value]);
    } else if (!existing.includes(value)) {
        existing.push(value);
    }
}

/** The 0-based line and column of an offset, for expression nodes, which only know their offsets. */
function locationAt(template: string, offset: number): Location {
    const before = template.slice(0, offset).split("\n");
    return { col: before[before.length - 1].length, line: before.length - 1 };
}

/** Up to three close names, as a sentence: " Did you mean `x` or `y`?" */
export function suggest(name: string, candidates: readonly string[], before = "`", after = "`"): string {
    const wanted = name.toLowerCase();
    const limit = Math.max(2, Math.floor(name.length / 3));
    const close = [...new Set(candidates)]
        .map(candidate => ({ candidate, distance: editDistance(wanted, candidate.toLowerCase()) }))
        .filter(
            entry =>
                entry.distance <= limit ||
                (wanted.length >= 4 &&
                    (entry.candidate.toLowerCase().includes(wanted) || wanted.includes(entry.candidate.toLowerCase())))
        )
        .sort((first, second) => first.distance - second.distance)
        .slice(0, 3)
        .map(entry => `${before}${entry.candidate}${after}`);
    return close.length === 0 ? "" : ` Did you mean ${close.join(" or ")}?`;
}

function editDistance(first: string, second: string): number {
    let previous = Array.from({ length: second.length + 1 }, (_value, index) => index);
    for (let row = 1; row <= first.length; row++) {
        const current = [row];
        for (let column = 1; column <= second.length; column++) {
            const cost = first[row - 1] === second[column - 1] ? 0 : 1;
            current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + cost);
        }
        previous = current;
    }
    return previous[second.length];
}
