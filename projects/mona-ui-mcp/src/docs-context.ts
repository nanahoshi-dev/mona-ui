import type { DocsPage, ExportedSymbol, MonaDocs } from "./docs-data.js";
import type { PageSection } from "./markdown.js";
import { splitProseAndCode, splitSections } from "./markdown.js";
import { SearchIndex } from "./search.js";
import { TemplateChecker } from "./template-check.js";

export type SearchItem =
    | { readonly kind: "section"; readonly page: DocsPage; readonly section: PageSection }
    | { readonly kind: "symbol"; readonly symbol: ExportedSymbol };

/** One version of the docs, with what the tools build from it on first use: sections, the search index, the checker. */
export class DocsContext {
    readonly #sections = new Map<string, PageSection[]>();
    #checker?: TemplateChecker;
    #search?: SearchIndex<SearchItem>;
    #symbols?: ExportedSymbol[];

    public constructor(public readonly docs: MonaDocs) {}

    public get checker(): TemplateChecker {
        this.#checker ??= new TemplateChecker(this.symbols);
        return this.#checker;
    }

    public get search(): SearchIndex<SearchItem> {
        this.#search ??= this.#buildSearch();
        return this.#search;
    }

    public get symbols(): ExportedSymbol[] {
        this.#symbols ??= this.docs.allSymbols();
        return this.#symbols;
    }

    /** Finds a page by its slug, route, title or entry point, ignoring case. */
    public findPage(request: string): DocsPage | undefined {
        const wanted = request
            .trim()
            .toLowerCase()
            .replace(/^@nanahoshi\/mona-ui\//, "")
            .replace(/^\/?(?:components\/)?/, "")
            .replace(/\.md$/, "");
        const pages = this.docs.manifest.pages;
        return (
            pages.find(page => page.slug === wanted || page.path === wanted) ??
            pages.find(page => page.title.toLowerCase() === wanted) ??
            pages.find(page => page.kind === "component" && page.entryPoint === wanted) ??
            pages.find(page => page.entryPoint === wanted)
        );
    }

    public sections(page: DocsPage): PageSection[] {
        let sections = this.#sections.get(page.slug);
        if (!sections) {
            sections = splitSections(this.docs.pageMarkdown(page));
            this.#sections.set(page.slug, sections);
        }
        return sections;
    }

    #buildSearch(): SearchIndex<SearchItem> {
        const index = new SearchIndex<SearchItem>({ code: 0.3, members: 1.5, name: 4, summary: 2, text: 1, title: 3 }, [
            "name",
            "summary",
            "title"
        ]);
        for (const page of this.docs.manifest.pages) {
            const markdown = this.docs.pageMarkdown(page);
            // A page's API section lists its exports, which are indexed as symbols, with more to say.
            for (const section of this.sections(page).filter(entry => entry.path[0] !== "API")) {
                const { code, prose } = splitProseAndCode(markdown.slice(section.start, section.end));
                index.add(
                    { kind: "section", page, section },
                    {
                        code,
                        // The page's one-line description says what it's for in the words people search with.
                        summary: section.level === 1 ? page.description : "",
                        text: prose,
                        // The entry point names the component on pages titled by topic, such as the grid's "Editing".
                        title: [page.title, page.entryPoint?.replace(/-/g, " "), ...section.path].join(" ")
                    }
                );
            }
        }
        for (const exported of this.symbols) {
            const { symbol } = exported;
            const members = [
                ...(symbol.inputs ?? []),
                ...(symbol.outputs ?? []),
                ...(symbol.properties ?? []),
                ...(symbol.methods ?? [])
            ];
            index.add(
                { kind: "symbol", symbol: exported },
                {
                    members: members.map(member => member.name).join(" "),
                    name: [symbol.name, symbol.selector, symbol.pipeName, symbol.exportAs].filter(Boolean).join(" "),
                    text: [symbol.description, ...members.map(member => member.description)].join("\n")
                }
            );
        }
        return index;
    }
}
