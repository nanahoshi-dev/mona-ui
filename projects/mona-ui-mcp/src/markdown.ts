/** A heading of a page and the text under it, up to the next heading of any level. */
export interface PageSection {
    /** The heading's id, as the docs site makes it: lowercase, with dashes. The intro's is empty. */
    readonly anchor: string;
    /** Where the section's own text ends, before the next heading. */
    readonly end: number;
    /** Where the section ends with its sub-sections, before the next heading of the same level or higher. */
    readonly endWithSubsections: number;
    readonly heading: string;
    /** 1 for the intro above the first `##`, otherwise the heading's level. */
    readonly level: number;
    /** The headings above it and its own, such as `["Examples", "Looks"]`. */
    readonly path: readonly string[];
    readonly start: number;
}

const FENCE = /^(```|~~~)/;
const HEADING = /^(#{2,6})\s+(.+?)\s*#*\s*$/;

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/`/g, "")
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-");
}

/** Splits a page at its `##` to `######` headings, leaving alone what looks like one inside a code block. */
export function splitSections(markdown: string): PageSection[] {
    const headings: { heading: string; level: number; start: number }[] = [];
    let fence: string | undefined;
    let offset = 0;
    for (const line of markdown.split("\n")) {
        const fenceMatch = FENCE.exec(line);
        if (fenceMatch) {
            if (!fence) {
                fence = fenceMatch[1];
            } else if (line.trim() === fence) {
                fence = undefined;
            }
        } else if (!fence) {
            const match = HEADING.exec(line);
            if (match) {
                headings.push({ heading: match[2].replace(/`/g, ""), level: match[1].length, start: offset });
            }
        }
        offset += line.length + 1;
    }

    const length = markdown.length;
    const sections: PageSection[] = [];
    const firstStart = headings[0]?.start ?? length;
    sections.push({
        anchor: "",
        end: firstStart,
        endWithSubsections: firstStart,
        heading: "Introduction",
        level: 1,
        path: [],
        start: 0
    });
    const trail: string[] = [];
    headings.forEach((heading, index) => {
        trail.length = Math.min(trail.length, heading.level - 2);
        trail[heading.level - 2] = heading.heading;
        const next = headings.slice(index + 1).find(other => other.level <= heading.level);
        sections.push({
            anchor: slugify(heading.heading),
            end: headings[index + 1]?.start ?? length,
            endWithSubsections: next?.start ?? length,
            heading: heading.heading,
            level: heading.level,
            path: trail.filter(entry => entry !== undefined),
            start: heading.start
        });
    });
    return sections;
}

/**
 * Finds the section a request names: by its heading, its anchor, or its path joined with `>` or `/`, ignoring case.
 * Prefers an exact match, then a heading that starts with the request, then one that contains it.
 */
export function findSection(sections: readonly PageSection[], request: string): PageSection | undefined {
    const wanted = normalize(request.replace(/^#+/, ""));
    if (!wanted) {
        return undefined;
    }
    const candidates = sections.filter(section => section.level > 1);
    const exact = candidates.find(
        section =>
            normalize(section.heading) === wanted ||
            section.anchor === slugify(request.replace(/^#+/, "")) ||
            normalize(section.path.join(" > ")) === wanted
    );
    return (
        exact ??
        candidates.find(section => normalize(section.heading).startsWith(wanted)) ??
        candidates.find(section => normalize(section.path.join(" > ")).includes(wanted))
    );
}

/** The page's headings as an indented list, with roughly how many tokens each section takes with its sub-sections. */
export function renderOutline(sections: readonly PageSection[]): string {
    return sections
        .filter(section => section.level > 1)
        .map(section => {
            const tokens = estimateTokens(section.endWithSubsections - section.start);
            return `${"  ".repeat(section.level - 2)}- ${section.heading} (~${tokens} tokens)`;
        })
        .join("\n");
}

/** Code blocks out, prose in: for indexing and snippets. An example's file name, on its own line, counts as code. */
export function splitProseAndCode(text: string): { code: string; prose: string } {
    const code: string[] = [];
    const prose = text
        .replace(/^(```|~~~)[^\n]*\n([\s\S]*?)^\1[ \t]*$/gm, (_block, _fence, body: string) => {
            code.push(body);
            return "";
        })
        .replace(/^`[\w.-]+\.(?:css|html|scss|ts)`[ \t]*$/gm, name => {
            code.push(name);
            return "";
        });
    return { code: code.join("\n"), prose };
}

export function estimateTokens(characters: number): number {
    return Math.max(10, Math.round(characters / 40) * 10);
}

function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/`/g, "")
        .replace(/\s*[>/]\s*/g, " > ")
        .replace(/\s+/g, " ")
        .trim();
}
