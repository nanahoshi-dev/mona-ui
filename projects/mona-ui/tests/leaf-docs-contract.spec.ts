import { beforeAll, describe, expect, it, vi } from "vitest";
import type * as Ts from "typescript";

interface DirectoryEntry {
    isDirectory(): boolean;
    name: string;
}

interface FsModule {
    existsSync(path: string): boolean;
    readFileSync(path: string, encoding: string): string;
    readdirSync(path: string, options: { withFileTypes: true }): DirectoryEntry[];
}

interface PathModule {
    dirname(path: string): string;
    resolve(...paths: string[]): string;
}

interface ProcessModule {
    cwd(): string;
}

interface SourceMember {
    readonly defaultText?: string;
    readonly isModel: boolean;
    readonly isOutput: boolean;
    readonly name: string;
    readonly required: boolean;
}

interface SourceClass {
    readonly baseClass?: string;
    readonly className: string;
    readonly members: readonly SourceMember[];
    readonly selector: string;
}

interface EntryPoint {
    readonly classes: readonly SourceClass[];
    readonly docs: readonly string[];
    readonly exports: ReadonlySet<string>;
    readonly name: string;
}

interface DocumentedRow {
    readonly defaultCell: string;
    readonly description: string;
    readonly isOutputTable: boolean;
    readonly name: string;
    /** The name column, where the generated tables say a member is required or two-way. */
    readonly nameCell: string;
    readonly typeCell: string;
}

const docsRoot = "projects/mona-ui-tester/src/assets/docs";

/** Each entry point this module covers, and the tester folders that document it. */
const coveredEntryPoints: readonly (readonly [entry: string, docs: readonly string[]])[] = [
    ["avatar", ["avatar"]],
    ["breadcrumb", ["breadcrumb"]],
    ["button-group", ["button-group"]],
    ["card", ["card"]],
    ["check-box", ["checkbox"]],
    ["chip", ["chip"]],
    ["circular-progress-bar", ["circular-progress-bar"]],
    ["collapsible", ["collapsible"]],
    ["color-gradient", ["color-gradient"]],
    ["color-palette", ["color-palette"]],
    ["color-picker", ["color-picker"]],
    ["expansion-panel", ["expansion-panel"]],
    ["fieldset", ["fieldset"]],
    ["label", ["label"]],
    ["otp-input", ["otp-input"]],
    ["placeholder", ["placeholder"]],
    ["progress-bar", ["progress-bar"]],
    ["radio-button", ["radio-button"]],
    ["rating", ["rating"]],
    ["scroll-view", ["scroll-view"]],
    ["segmented", ["segmented"]],
    ["sidebar", ["sidebar"]],
    ["skeleton", ["skeleton"]],
    ["slider", ["slider", "range-slider"]],
    ["spinner", ["spinner"]],
    ["splitter", ["splitter"]],
    ["stepper", ["stepper"]],
    ["switch", ["switch"]],
    ["tabs", ["tabs"]],
    ["text-area", ["textarea"]],
    ["theme", ["theme"]]
];

/** Bindings any element takes, so an example using one says nothing about the component. */
const elementBindings =
    /^(?:aria-.*|attr\..*|class|class\..*|data-.*|dir|formField|hidden|id|lang|ngModel|ngModelChange|role|routerLink|style|style\..*|tabindex|title|(?:blur|change|click|focus|focusin|focusout|input|keydown|keyup|pointerdown)|(?:keydown|keyup)\..*)$/;

/**
 * Comparing `'after'` with `"after"`: the tables use both, and neither is wrong.
 */
function normalizeLiteral(text: string): string {
    return text
        .replace(/^`|`$/g, "")
        .replace(/^'([^']*)'$/, '"$1"')
        .trim();
}

function isLiteralDefault(text: string): boolean {
    return /^(?:"[^"]*"|'[^']*'|`[^`]*`|-?\d+(?:\.\d+)?|true|false|null|undefined|\[\])$/.test(text);
}

/** The text under each heading that names a class or a selector, up to the next heading of that level or above. */
function readClassSection(markdown: string, source: SourceClass): string | undefined {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const selectors = source.selector.split(",").map(selector => selector.trim());
    let fence = false;
    let startLevel = 0;
    const collected: string[] = [];
    for (const line of lines) {
        if (line.startsWith("```")) {
            fence = !fence;
        }
        const heading = fence ? undefined : /^(#{1,6}) (.*)$/.exec(line);
        if (heading) {
            const level = heading[1].length;
            if (startLevel > 0 && level <= startLevel) {
                break;
            }
            const named = [...heading[2].matchAll(/`([^`]+)`/g)].map(match => match[1].replace(/^<|>$/g, ""));
            if (startLevel === 0 && (named.includes(source.className) || named.some(n => selectors.includes(n)))) {
                startLevel = level;
                continue;
            }
        }
        if (startLevel > 0) {
            collected.push(line);
        }
    }
    return startLevel > 0 ? collected.join("\n") : undefined;
}

/** The rows of every inputs or outputs table in a section. Methods and ARIA tables are about something else. */
function readRows(section: string): DocumentedRow[] {
    const rows: DocumentedRow[] = [];
    let columns: string[] | undefined;
    let subheading = "";
    for (const line of section.split("\n")) {
        const heading = /^#{1,6} (.*)$/.exec(line);
        if (heading) {
            subheading = heading[1];
        }
        if (!line.trim().startsWith("|")) {
            columns = undefined;
            continue;
        }
        const cells = line
            .trim()
            .replace(/^\||\|$/g, "")
            .split(/(?<!\\)\|/)
            .map(cell => cell.trim());
        if (!columns) {
            columns = cells.map(cell => cell.toLowerCase());
            continue;
        }
        if (cells.every(cell => /^:?-+:?$/.test(cell))) {
            continue;
        }
        const nameColumn = columns[0];
        const isMemberTable = /^(?:name|input|inputs|output|outputs)$/.test(nameColumn);
        if (!isMemberTable || !/inputs|outputs|^$/i.test(subheading.replace(/`[^`]*`/g, ""))) {
            continue;
        }
        const name = /^`\[{0,2}\(?([\w-]+)\)?\]{0,2}`/.exec(cells[0])?.[1];
        if (name) {
            const at = (column: string): string => cells[columns?.indexOf(column) ?? -1] ?? "";
            rows.push({
                defaultCell: at("default"),
                description: at("description"),
                isOutputTable: /output/i.test(nameColumn) || /outputs/i.test(subheading),
                name,
                nameCell: cells[0],
                typeCell: at("type")
            });
        }
    }
    return rows;
}

describe("Leaf component documentation", () => {
    const entryPoints = new Map<string, EntryPoint>();
    const documents = new Map<string, string>();
    const selectorMembers = new Map<string, SourceClass>();
    let themeGuide = "";

    function documentsOf(entry: EntryPoint): [string, string][] {
        return [...documents].filter(([name]) => entry.docs.some(doc => name.startsWith(`${doc}/`)));
    }

    beforeAll(async () => {
        const fs = await vi.importActual<FsModule>("node:fs");
        const path = await vi.importActual<PathModule>("node:path");
        const nodeProcess = await vi.importActual<ProcessModule>("node:process");
        const ts = await vi.importActual<typeof Ts>("typescript");
        const root = nodeProcess.cwd();
        const library = path.resolve(root, "projects/mona-ui");

        const parse = (file: string): Ts.SourceFile =>
            ts.createSourceFile(file, fs.readFileSync(file, "utf-8"), ts.ScriptTarget.Latest, true);

        const readClass = (node: Ts.ClassDeclaration): SourceClass | undefined => {
            const decorator = (ts.getDecorators(node) ?? []).find(candidate =>
                /^(?:Component|Directive)\(/.test(candidate.expression.getText())
            );
            if (!node.name || !decorator || !ts.isCallExpression(decorator.expression)) {
                return undefined;
            }
            const metadata = decorator.expression.arguments[0];
            if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
                return undefined;
            }
            return { ...readMembers(node, node.name.text), selector: readSelector(metadata) };
        };

        const readSelector = (metadata: Ts.ObjectLiteralExpression): string => {
            const selectorProperty = metadata.properties.find(property => property.name?.getText() === "selector");
            return selectorProperty && ts.isPropertyAssignment(selectorProperty)
                ? selectorProperty.initializer.getText().replace(/^["'`]|["'`]$/g, "")
                : "";
        };

        const readMembers = (node: Ts.ClassDeclaration, className: string): Omit<SourceClass, "selector"> => {
            const members: SourceMember[] = [];
            for (const member of node.members) {
                if (!ts.isPropertyDeclaration(member) || !member.initializer) {
                    continue;
                }
                if (!ts.isCallExpression(member.initializer)) {
                    continue;
                }
                const call = member.initializer.expression.getText();
                if (!/^(?:input|input\.required|model|model\.required|output|outputFromObservable)$/.test(call)) {
                    continue;
                }
                const required = call.endsWith(".required");
                const isOutput = call.startsWith("output");
                const args = member.initializer.arguments;
                const options = call === "outputFromObservable" ? args[1] : isOutput || required ? args[0] : args[1];
                const aliasProperty =
                    options && ts.isObjectLiteralExpression(options)
                        ? options.properties.find(property => property.name?.getText() === "alias")
                        : undefined;
                const alias =
                    aliasProperty && ts.isPropertyAssignment(aliasProperty)
                        ? aliasProperty.initializer.getText().replace(/^["']|["']$/g, "")
                        : undefined;
                members.push({
                    defaultText: !isOutput && !required && args[0] ? args[0].getText() : undefined,
                    isModel: call.startsWith("model"),
                    isOutput,
                    name: alias ?? member.name.getText(),
                    required
                });
            }
            const baseClass = node.heritageClauses
                ?.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)
                ?.types[0]?.expression.getText();
            return { baseClass, className, members };
        };

        /** Every class in the library by name, so a component's table can be checked against what it inherits. */
        const allClasses = new Map<string, Omit<SourceClass, "selector">>();
        const walk = (directory: string): void => {
            for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
                const entryPath = path.resolve(directory, entry.name);
                if (entry.isDirectory()) {
                    walk(entryPath);
                } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".spec.ts")) {
                    parse(entryPath).forEachChild(node => {
                        if (ts.isClassDeclaration(node) && node.name) {
                            allClasses.set(node.name.text, readMembers(node, node.name.text));
                        }
                    });
                }
            }
        };
        walk(library);

        const withInherited = (source: SourceClass): SourceClass => {
            const members = [...source.members];
            let base = source.baseClass ? allClasses.get(source.baseClass) : undefined;
            while (base) {
                for (const member of base.members) {
                    if (!members.some(candidate => candidate.name === member.name)) {
                        members.push(member);
                    }
                }
                base = base.baseClass ? allClasses.get(base.baseClass) : undefined;
            }
            return { ...source, members };
        };

        /** Everything a `public-api.ts` reaches, following `export *` and named re-exports. */
        const readPublicApi = (entryFile: string): { classes: SourceClass[]; exports: Set<string> } => {
            const seen = new Set<string>();
            const classes: SourceClass[] = [];
            const exports = new Set<string>();
            const visit = (file: string): void => {
                if (seen.has(file)) {
                    return;
                }
                seen.add(file);
                const source = parse(file);
                source.forEachChild(node => {
                    if (ts.isExportDeclaration(node)) {
                        const target = node.moduleSpecifier?.getText().replace(/^["']|["']$/g, "");
                        const resolved = target?.startsWith(".")
                            ? [`${target}.ts`, `${target}/index.ts`]
                                  .map(candidate => path.resolve(path.dirname(file), candidate))
                                  .find(candidate => fs.existsSync(candidate))
                            : undefined;
                        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
                            for (const element of node.exportClause.elements) {
                                exports.add(element.name.text);
                            }
                            if (resolved) {
                                const wanted = new Set(
                                    node.exportClause.elements.map(
                                        element => element.propertyName?.text ?? element.name.text
                                    )
                                );
                                parse(resolved).forEachChild(child => {
                                    if (ts.isClassDeclaration(child) && child.name && wanted.has(child.name.text)) {
                                        const found = readClass(child);
                                        if (found) {
                                            classes.push(found);
                                        }
                                    }
                                });
                            }
                        } else if (resolved) {
                            visit(resolved);
                        }
                        return;
                    }
                    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
                    if (!modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
                        return;
                    }
                    if (ts.isVariableStatement(node)) {
                        for (const declaration of node.declarationList.declarations) {
                            exports.add(declaration.name.getText());
                        }
                    } else if (
                        (ts.isClassDeclaration(node) ||
                            ts.isFunctionDeclaration(node) ||
                            ts.isInterfaceDeclaration(node) ||
                            ts.isTypeAliasDeclaration(node) ||
                            ts.isEnumDeclaration(node)) &&
                        node.name
                    ) {
                        exports.add(node.name.text);
                        if (ts.isClassDeclaration(node)) {
                            const found = readClass(node);
                            if (found) {
                                classes.push(found);
                            }
                        }
                    }
                });
            };
            visit(entryFile);
            return { classes, exports };
        };

        const docsByEntry = new Map(coveredEntryPoints);
        for (const directory of fs.readdirSync(library, { withFileTypes: true })) {
            const entryFile = path.resolve(library, directory.name, "public-api.ts");
            if (directory.isDirectory() && fs.existsSync(entryFile)) {
                const { exports, ...read } = readPublicApi(entryFile);
                const classes = read.classes.map(withInherited);
                entryPoints.set(directory.name, {
                    classes,
                    docs: docsByEntry.get(directory.name) ?? [],
                    exports,
                    name: directory.name
                });
                for (const found of classes) {
                    for (const selector of found.selector.split(",").map(text => text.trim())) {
                        selectorMembers.set(selector, found);
                    }
                }
            }
        }

        for (const [, docs] of coveredEntryPoints) {
            for (const doc of docs) {
                for (const name of ["api.md", "guide.md", "intro.md"]) {
                    const file = path.resolve(root, docsRoot, doc, name);
                    if (fs.existsSync(file)) {
                        documents.set(`${doc}/${name}`, fs.readFileSync(file, "utf-8").replace(/\r\n/g, "\n"));
                    }
                }
            }
        }
        for (const guide of ["forms", "theming"]) {
            const file = path.resolve(root, "docs", `${guide}.md`);
            if (fs.existsSync(file)) {
                documents.set(`guides/${guide}.md`, fs.readFileSync(file, "utf-8").replace(/\r\n/g, "\n"));
            }
        }
        themeGuide = documents.get("guides/theming.md") ?? "";
        // Loading TypeScript and parsing the source took 7s on CI against the default 10s, and the time follows the runner.
    }, 60_000);

    describe("pages", () => {
        it("has an intro and an API page for every covered entry point", () => {
            for (const [entry, docs] of coveredEntryPoints) {
                for (const doc of docs) {
                    // The theming guide is the theme page's introduction.
                    if (doc !== "theme") {
                        expect(documents.has(`${doc}/intro.md`), `${entry} has no ${doc}/intro.md`).toBe(true);
                    }
                    expect(documents.has(`${doc}/api.md`), `${entry} has no ${doc}/api.md`).toBe(true);
                }
            }
        });

        it("has the forms and theming guides", () => {
            expect(documents.has("guides/forms.md")).toBe(true);
            expect(documents.has("guides/theming.md")).toBe(true);
        });
    });

    describe("tables", () => {
        it("gives every exported component and directive with members a section listing all of them", () => {
            const problems: string[] = [];
            for (const [entryName] of coveredEntryPoints) {
                const entry = entryPoints.get(entryName) as EntryPoint;
                const pages = documentsOf(entry);
                for (const source of entry.classes.filter(candidate => candidate.selector)) {
                    const sections = pages.flatMap(([, markdown]) => readClassSection(markdown, source) ?? []);
                    if (sections.length === 0) {
                        if (source.members.length > 0 || !pages.some(([, text]) => mentions(text, source))) {
                            problems.push(`${entryName}: no section for ${source.className}`);
                        }
                        continue;
                    }
                    const rows = sections.flatMap(readRows);
                    for (const member of source.members) {
                        const row = rows.find(candidate => candidate.name === member.name);
                        if (!row) {
                            problems.push(`${entryName}: ${source.className} omits ${member.name}`);
                        } else {
                            checkRow(entryName, source, member, row, problems);
                        }
                    }
                    for (const row of rows) {
                        const named = source.members.some(
                            member => member.name === row.name || `${member.name}Change` === row.name
                        );
                        if (!named) {
                            problems.push(`${entryName}: ${source.className} lists ${row.name}, which doesn't exist`);
                        }
                    }
                }
            }
            expect(problems).toEqual([]);
        });
    });

    describe("text", () => {
        it("keeps no owner notes, removed bindings or bare package imports in published pages", () => {
            const problems: string[] = [];
            for (const [name, markdown] of documents) {
                for (const [pattern, why] of [
                    [/TODO\(owner-review\)/, "an owner note"],
                    [/from\s+["']mona-ui["']/, 'an import from "mona-ui"'],
                    [/\[control\]=/, "the removed [control] binding"],
                    [/\[field\]=/, "the removed [field] binding"]
                ] as const) {
                    if (pattern.test(markdown)) {
                        problems.push(`${name} has ${why}`);
                    }
                }
            }
            expect(problems).toEqual([]);
        });

        it("imports only what the named entry point exports", () => {
            const problems: string[] = [];
            let checked = 0;
            for (const [name, markdown] of documents) {
                const imports = markdown.matchAll(
                    /(?:^|\n)[ \t]*import(?:\s+type)?\s*\{([^}]*)\}\s*from\s*["']@nanahoshi\/mona-ui\/([\w-]+)["']/g
                );
                for (const [, specifiers, entryName] of imports) {
                    const entry = entryPoints.get(entryName);
                    if (!entry) {
                        problems.push(`${name} imports from ${entryName}, which isn't an entry point`);
                        continue;
                    }
                    for (const specifier of specifiers.split(",")) {
                        const symbol = /^(?:type\s+)?(\w+)/.exec(specifier.replace(/\/\/.*$/gm, "").trim())?.[1];
                        if (symbol) {
                            checked++;
                            if (!entry.exports.has(symbol)) {
                                problems.push(`${name} imports ${symbol} from ${entryName}, which doesn't export it`);
                            }
                        }
                    }
                }
            }
            expect(problems).toEqual([]);
            expect(checked).toBeGreaterThan(50);
        });

        it("uses only real elements and real bindings in examples", () => {
            const problems: string[] = [];
            let checked = 0;
            for (const [name, markdown] of documents) {
                for (const [, block] of markdown.matchAll(/```(?:html|typescript|ts|angular)\n([\s\S]*?)```/g)) {
                    const code = block.replace(/<!--[\s\S]*?-->/g, "");
                    for (const [tag, selector, attributes] of code.matchAll(/<(mona-[\w-]+)((?:[^>"]|"[^"]*")*)>/g)) {
                        const source = selectorMembers.get(selector);
                        if (!source) {
                            problems.push(`${name}: ${tag} isn't an exported component`);
                            continue;
                        }
                        const names = attributes.replace(/="[^"]*"/g, " ");
                        const bindings = [...names.matchAll(/(?:^|\s)[[(]*([\w.-]+)[\])]*/g)].map(match => match[1]);
                        for (const binding of bindings) {
                            checked++;
                            const known = source.members.some(
                                member => member.name === binding || `${member.name}Change` === binding
                            );
                            if (!known && !elementBindings.test(binding) && !/^#/.test(binding)) {
                                problems.push(`${name}: ${binding} isn't a binding of <${selector}>`);
                            }
                        }
                        for (const member of source.members.filter(candidate => candidate.required)) {
                            if (!bindings.includes(member.name)) {
                                problems.push(`${name}: <${selector}> needs ${member.name}`);
                            }
                        }
                    }
                }
            }
            expect(problems).toEqual([]);
            expect(checked).toBeGreaterThan(200);
        });
    });

    describe("theme", () => {
        it("names every provider and token the theme entry point exports in the theming guide", () => {
            const entry = entryPoints.get("theme") as EntryPoint;
            const documented = [...entry.exports].filter(name => /^(?:provide[A-Z]|[A-Z_]+$)/.test(name));
            expect(documented.length).toBeGreaterThan(5);
            for (const name of documented) {
                expect(themeGuide, `The theming guide doesn't mention ${name}`).toContain(name);
            }
        });
    });
});

function mentions(markdown: string, source: SourceClass): boolean {
    return (
        markdown.includes(source.className) ||
        source.selector.split(",").some(selector => markdown.includes(selector.trim().replace(/^\[|\]$/g, "")))
    );
}

function checkRow(
    entryName: string,
    source: SourceClass,
    member: SourceMember,
    row: DocumentedRow,
    problems: string[]
): void {
    const label = `${entryName}: ${source.className} ${member.name}`;
    if (member.isOutput) {
        return;
    }
    if (member.required) {
        if (!/required/i.test(`${row.nameCell} ${row.defaultCell} ${row.description}`)) {
            problems.push(`${label} is required, and the table doesn't say so`);
        }
    } else if (
        member.defaultText !== undefined &&
        isLiteralDefault(member.defaultText) &&
        normalizeLiteral(row.defaultCell) !== normalizeLiteral(member.defaultText)
    ) {
        problems.push(`${label} defaults to ${member.defaultText}, and the table says ${row.defaultCell}`);
    }
    if (member.isModel && !/model|two-way/i.test(`${row.nameCell} ${row.typeCell} ${row.description}`)) {
        problems.push(`${label} is a model, and the table doesn't say it's two-way`);
    }
}
