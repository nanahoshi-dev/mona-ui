import { createUniqueHeadingId, slugifyHeading } from "../layout/docs-heading-id";
import type { ApiMember, ApiSymbol, ApiSymbolKind, ApiSymbolReference } from "./api-model";

/**
 * How the API reference reads: the text rules the generated markdown, the `/api` pages and the search index share, so
 * all three say the same thing and link to the same anchors. Keep this file free of Angular imports, like
 * `api-model.ts`.
 */

export const PACKAGE_NAME = "@nanahoshi/mona-ui";

export const KIND_LABELS: Readonly<Record<ApiSymbolKind, string>> = {
    class: "Class",
    component: "Component",
    constant: "Constant",
    directive: "Directive",
    enum: "Enum",
    function: "Function",
    interface: "Interface",
    pipe: "Pipe",
    service: "Service",
    type: "Type alias"
};

/** The plural of each kind, for the headings that group symbols. */
export const KIND_GROUP_TITLES: Readonly<Record<ApiSymbolKind, string>> = {
    class: "Classes",
    component: "Components",
    constant: "Constants",
    directive: "Directives",
    enum: "Enums",
    function: "Functions",
    interface: "Interfaces",
    pipe: "Pipes",
    service: "Services",
    type: "Type aliases"
};

/** The order kinds are listed in: what goes in a template first, the types it takes last. */
export const KIND_ORDER: readonly ApiSymbolKind[] = [
    "component",
    "directive",
    "pipe",
    "service",
    "class",
    "function",
    "constant",
    "interface",
    "type",
    "enum"
];

/** The kinds a guide page lists under Types, after its components, services and functions. */
export const TYPE_KINDS: ReadonlySet<ApiSymbolKind> = new Set(["constant", "enum", "interface", "type"]);

/** Each selector of a selector list, such as `a[monaD], b[monaD]`, leaving a comma inside brackets alone. */
export function selectorAlternatives(selector: string): string[] {
    return selector
        .split(/,(?![^[(]*[\])])/)
        .map(alternative => alternative.trim())
        .filter(Boolean);
}

export type ApiFlag = "optional" | "read-only" | "required" | "two-way";

/** One member in a section of a symbol's page. */
export interface ApiSectionItem {
    readonly defaultValue?: string;
    readonly description: string;
    readonly flags: readonly ApiFlag[];
    /** The anchor on the symbol's page. */
    readonly id: string;
    readonly name: string;
    /** A method's signature, which stands in for its type. */
    readonly signature?: string;
    readonly type?: string;
    /** An enum member's value. */
    readonly value?: string;
}

export interface ApiSection {
    /** The base type an inherited section comes from. */
    readonly from?: string;
    readonly id: string;
    readonly items: readonly ApiSectionItem[];
    readonly title: string;
}

/** A piece of a type's text. A piece with an entry point is an exported name, which links to its page. */
export interface ApiTypeToken {
    readonly entryPoint?: string;
    readonly text: string;
}

/** The ids a symbol's page gives its parts other than member sections, which the sections must not reuse. */
export const SIGNATURE_ID = "signature";
export const USED_BY_ID = "used-by";

const QUOTED = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
const TYPE_TOKEN = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b[A-Z]\w*\b/g;
/** A code span, or a `<` that doesn't start one of the inline formatting tags a description may use. */
const CODE_OR_TAG_START = /(`+)[\s\S]*?\1|<(?!\/?(?:b|br|code|em|i|kbd|strong|sub|sup)[\s/>])/g;

/** The path of a symbol's reference page. */
export function apiSymbolPath(entryPoint: string, name: string): string {
    return `/api/${entryPoint}/${name}`;
}

/**
 * A description as markdown: link tags become code, and each `<` outside a code span is escaped, so a description
 * that names an element (such as `<title>`) shows it as written instead of opening that element in the page. The
 * inline formatting tags a description may use on purpose, such as `n<sup>th</sup>`, still render.
 */
export function prose(text: string): string {
    return text
        .replace(/\{@link\s+([^}\s]+)[^}]*\}/g, "`$1`")
        .replace(CODE_OR_TAG_START, match => (match === "<" ? "\\<" : match))
        .trim();
}

/** The first sentence of a description's first paragraph, as markdown on one line. */
export function summarize(description: string): string {
    const paragraph = prose(description)
        .split(/\n\s*\n/)[0]
        .replace(/\s+/g, " ")
        .trim();
    return /^.*?[.!?](?=\s+[A-Z`(]|$)/.exec(paragraph)?.[0] ?? paragraph;
}

/** The capitalized names a type's text mentions outside its string literals, such as `ChartPoint` in `ChartPoint[]`. */
export function mentionedNames(text: string): string[] {
    return Array.from(text.replace(QUOTED, "").matchAll(/\b[A-Z]\w*\b/g), match => match[0]);
}

/** Splits a type's text so each exported name in it can link to its page. A symbol doesn't link to itself. */
export function typeTokens(text: string, links: Readonly<Record<string, string>>, self?: string): ApiTypeToken[] {
    const tokens: ApiTypeToken[] = [];
    let last = 0;
    for (const match of text.matchAll(TYPE_TOKEN)) {
        const name = match[0];
        if (name === self || !Object.hasOwn(links, name)) {
            continue;
        }
        if (match.index > last) {
            tokens.push({ text: text.slice(last, match.index) });
        }
        tokens.push({ entryPoint: links[name], text: name });
        last = match.index + name.length;
    }
    if (last < text.length) {
        tokens.push({ text: text.slice(last) });
    }
    return tokens;
}

/** A component's outputs, with the change event each `model()` adds, since that's what a one-way listener binds. */
export function withModelEvents(outputs: readonly ApiMember[], inputs: readonly ApiMember[]): ApiMember[] {
    const modelEvents = inputs
        .filter(input => input.twoWay)
        .map((input): ApiMember => ({
            description: `Emitted when \`${input.alias ?? input.name}\` changes.`,
            name: `${input.alias ?? input.name}Change`,
            type: input.type
        }));
    return [...outputs, ...modelEvents].sort((first, second) => first.name.localeCompare(second.name, "en"));
}

function memberFlags(member: ApiMember): ApiFlag[] {
    const flags: ApiFlag[] = [];
    if (member.required) {
        flags.push("required");
    }
    if (member.twoWay) {
        flags.push("two-way");
    }
    if (member.readonly) {
        flags.push("read-only");
    }
    if (member.optional) {
        flags.push("optional");
    }
    return flags;
}

interface DraftSection {
    readonly from?: string;
    readonly items: readonly Omit<ApiSectionItem, "id">[];
    readonly title: string;
}

function memberItems(members: readonly ApiMember[]): Omit<ApiSectionItem, "id">[] {
    return members.map(member => ({
        defaultValue: member.defaultValue,
        description: member.description,
        flags: memberFlags(member),
        name: member.alias ?? member.name,
        type: member.type
    }));
}

function draftSections(symbol: ApiSymbolReference): DraftSection[] {
    const inputs = symbol.inputs ?? [];
    const sections: DraftSection[] = [
        { items: memberItems(inputs), title: "Inputs" },
        { items: memberItems(withModelEvents(symbol.outputs ?? [], inputs)), title: "Outputs" },
        { items: memberItems(symbol.templateContext?.members ?? []), title: "Template context" },
        { items: memberItems(symbol.properties ?? []), title: "Properties" },
        {
            items: (symbol.methods ?? []).map(method => ({
                description: method.description,
                flags: [],
                name: method.name,
                signature: method.signature
            })),
            title: "Methods"
        },
        {
            items: (symbol.enumMembers ?? []).map(member => ({
                description: member.description,
                flags: [],
                name: member.name,
                value: member.value
            })),
            title: "Members"
        }
    ];
    for (const base of symbol.inherited ?? []) {
        const baseInputs = base.inputs ?? [];
        sections.push({
            from: base.from,
            items: [
                ...memberItems(baseInputs),
                ...memberItems(withModelEvents(base.outputs ?? [], baseInputs)),
                ...memberItems(base.properties ?? []),
                ...(base.methods ?? []).map(method => ({
                    description: method.description,
                    flags: [],
                    name: method.name,
                    signature: method.signature
                }))
            ],
            title: `Inherited from ${base.from}`
        });
    }
    return sections.filter(section => section.items.length > 0);
}

/**
 * The member sections of a symbol's page, in order, with the anchor of each section and member. The page and the
 * search index both read them, so a search result lands on its member.
 */
export function apiSections(symbol: ApiSymbolReference): ApiSection[] {
    const drafts = draftSections(symbol);
    const ids = new Set([slugifyHeading(symbol.name), SIGNATURE_ID, USED_BY_ID]);
    const sectionIds = drafts.map(section => createUniqueHeadingId(section.title, ids));
    return drafts.map((section, index) => ({
        from: section.from,
        id: sectionIds[index],
        items: section.items.map(item => ({ ...item, id: createUniqueHeadingId(item.name, ids) })),
        title: section.title
    }));
}

/** The statement that imports a symbol. Types are imported as types. */
export function importStatement(symbol: Pick<ApiSymbol, "kind" | "name">, entryPoint: string): string {
    const keyword = symbol.kind === "interface" || symbol.kind === "type" ? "import type" : "import";
    return `${keyword} { ${symbol.name} } from "${PACKAGE_NAME}/${entryPoint}";`;
}
