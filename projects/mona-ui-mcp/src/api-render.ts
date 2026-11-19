import type { ApiEntryPoint, ApiMember, ApiMethod, ApiSymbol, ExportedSymbol } from "./docs-data.js";
import { PACKAGE_NAME } from "./docs-data.js";

/** The element and attribute names a selector matches by: `button[monaButton], a` gives button, monaButton and a. */
export function selectorNames(selector: string): string[] {
    const names = new Set<string>();
    for (const match of selector.matchAll(/(?:^|[\s,>+~])([a-zA-Z][\w-]*)|\[([^\]=~|^$*\s]+)/g)) {
        names.add(match[1] ?? match[2]);
    }
    return [...names];
}

/**
 * Finds what a request names: a symbol (`GridComponent`), a selector or one of its names (`mona-grid`, `<mona-grid>`,
 * `[monaButton]`), a pipe (`monaSlice`) or an `exportAs` name. Case doesn't matter.
 */
export function findSymbols(symbols: readonly ExportedSymbol[], request: string): ExportedSymbol[] {
    const wanted = request
        .trim()
        .replace(/^<\/?|\/?>$/g, "")
        .replace(/^\[|\]$/g, "")
        .replace(/^\*/, "")
        .toLowerCase();
    const byName = symbols.filter(({ symbol }) => symbol.name.toLowerCase() === wanted);
    if (byName.length > 0) {
        return byName;
    }
    return symbols.filter(
        ({ symbol }) =>
            symbol.selector?.toLowerCase() === wanted ||
            selectorNames(symbol.selector ?? "").some(name => name.toLowerCase() === wanted) ||
            symbol.pipeName?.toLowerCase() === wanted ||
            symbol.exportAs?.toLowerCase() === wanted
    );
}

/** An entry point's exports, with the line that imports them and what each one does. */
export function renderEntryPoint(entryPoint: ApiEntryPoint): string {
    const lines = [`# ${PACKAGE_NAME}/${entryPoint.name}`, ""];
    if (entryPoint.pages.length > 0) {
        lines.push(`Docs: ${entryPoint.pages.map(page => `${page.title} (page "${page.path}")`).join(", ")}`, "");
    }
    lines.push(
        `Import from \`${PACKAGE_NAME}/${entryPoint.name}\`. Call get_api with a name for its full reference.`,
        ""
    );
    for (const symbol of entryPoint.symbols) {
        const usedBy = symbol.selector ? ` \`${symbol.selector}\`` : symbol.pipeName ? ` \`| ${symbol.pipeName}\`` : "";
        const summary = firstSentence(symbol.description);
        lines.push(`- **${symbol.name}** (${symbol.kind})${usedBy}${summary ? `: ${summary}` : ""}`);
    }
    return lines.join("\n");
}

/** One symbol's full reference: how to import and use it, then its members. */
export function renderSymbol({ entryPoint, symbol }: ExportedSymbol): string {
    const lines = [`# ${symbol.name}`, ""];
    const facts = [`${symbol.kind} from \`${PACKAGE_NAME}/${entryPoint}\``];
    if (symbol.selector) {
        facts.push(`selector \`${symbol.selector}\``);
    }
    if (symbol.pipeName) {
        facts.push(`pipe \`${symbol.pipeName}\``);
    }
    if (symbol.exportAs) {
        facts.push(`exportAs \`${symbol.exportAs}\``);
    }
    lines.push(`${capitalize(facts.join(", "))}.`, "");
    lines.push("```typescript", `import { ${symbol.name} } from "${PACKAGE_NAME}/${entryPoint}";`, "```", "");
    if (["component", "directive", "pipe"].includes(symbol.kind)) {
        lines.push("Add it to the standalone component's `imports` array.", "");
    }
    if (symbol.page) {
        lines.push(`Guide: ${symbol.page.title} (get_docs_page "${symbol.page.path}").`, "");
    }
    if (symbol.description) {
        lines.push(symbol.description.trim(), "");
    }
    if (symbol.signature) {
        lines.push("```typescript", symbol.signature.trim(), "```", "");
    }
    const sections: [string, string[]][] = [
        ["Inputs", allMembers(symbol, "inputs").map(([member, from]) => renderInput(member, from))],
        ["Outputs", allMembers(symbol, "outputs").map(([member, from]) => renderOutput(member, from))],
        ["Properties", allMembers(symbol, "properties").map(([member, from]) => renderProperty(member, from))],
        ["Methods", allMethods(symbol).map(([method, from]) => renderMethod(method, from))],
        [
            "Enum members",
            (symbol.enumMembers ?? []).map(
                member =>
                    `- \`${member.name} = ${member.value}\`${member.description ? `: ${oneLine(member.description)}` : ""}`
            )
        ]
    ];
    if (symbol.templateContext) {
        sections.push([
            `Template context (\`${symbol.templateContext.type}\`, read with \`let-\` variables)`,
            symbol.templateContext.members.map(member => renderProperty(member))
        ]);
    }
    for (const [title, entries] of sections) {
        if (entries.length > 0) {
            lines.push(`## ${title}`, "", ...entries, "");
        }
    }
    if (symbol.usedBy && symbol.usedBy.length > 0) {
        lines.push(`Used by: ${symbol.usedBy.map(name => `\`${name}\``).join(", ")}.`);
    }
    return lines.join("\n").trimEnd();
}

/** What a template binds the input by: `[(value)]` for a model, `[name]` otherwise. */
export function bindingName(member: ApiMember): string {
    return member.alias ?? member.name;
}

function renderInput(member: ApiMember, from?: string): string {
    const name = bindingName(member);
    const binding = member.twoWay ? `[(${name})]` : `[${name}]`;
    const notes = [
        member.required ? "required" : undefined,
        member.alias && member.alias !== member.name ? `property \`${member.name}\`` : undefined,
        member.defaultValue !== undefined ? `default \`${oneLine(member.defaultValue)}\`` : undefined,
        from ? `from ${from}` : undefined
    ].filter(Boolean);
    return `- \`${binding}\`: \`${oneLine(member.type)}\`${notes.length > 0 ? ` (${notes.join(", ")})` : ""}${describe(member.description)}`;
}

function renderOutput(member: ApiMember, from?: string): string {
    return `- \`(${bindingName(member)})\`: \`${oneLine(member.type)}\`${from ? ` (from ${from})` : ""}${describe(member.description)}`;
}

function renderProperty(member: ApiMember, from?: string): string {
    const notes = [
        member.readonly ? "readonly" : undefined,
        member.optional ? "optional" : undefined,
        from ? `from ${from}` : undefined
    ].filter(Boolean);
    return `- \`${member.name}\`: \`${oneLine(member.type)}\`${notes.length > 0 ? ` (${notes.join(", ")})` : ""}${describe(member.description)}`;
}

function renderMethod(method: ApiMethod, from?: string): string {
    return `- \`${oneLine(method.signature)}\`${from ? ` (from ${from})` : ""}${describe(method.description)}`;
}

/** A symbol's own members of a kind, then those it inherits from exported base types. */
export function allMembers(
    symbol: ApiSymbol,
    kind: "inputs" | "outputs" | "properties"
): [member: ApiMember, from: string | undefined][] {
    return [
        ...(symbol[kind] ?? []).map(member => [member, undefined] as [ApiMember, undefined]),
        ...(symbol.inherited ?? []).flatMap(base =>
            (base[kind] ?? []).map(member => [member, base.from] as [ApiMember, string])
        )
    ];
}

function allMethods(symbol: ApiSymbol): [method: ApiMethod, from: string | undefined][] {
    return [
        ...(symbol.methods ?? []).map(method => [method, undefined] as [ApiMethod, undefined]),
        ...(symbol.inherited ?? []).flatMap(base =>
            (base.methods ?? []).map(method => [method, base.from] as [ApiMethod, string])
        )
    ];
}

function describe(description: string): string {
    const text = oneLine(description);
    return text ? `: ${text}` : "";
}

export function firstSentence(markdown: string): string {
    const text = oneLine(markdown);
    const end = text.search(/[.!?](?:\s|$)/);
    return end === -1 ? text : text.slice(0, end + 1);
}

function oneLine(text: string): string {
    return text.replace(/\s*\n\s*/g, " ").trim();
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
