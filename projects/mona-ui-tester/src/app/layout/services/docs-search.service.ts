import { DOCUMENT } from "@angular/common";
import { inject, Injectable, InjectionToken, signal } from "@angular/core";

/** The parts of Pagefind's browser API this site uses. */
export interface PagefindEngine {
    search(query: string): Promise<{ results: readonly PagefindResult[] }>;
}

export interface PagefindResult {
    data(): Promise<PagefindResultData>;
}

export interface PagefindResultData {
    readonly excerpt: string;
    readonly meta: Readonly<Record<string, string | undefined>>;
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Pagefind's name for it.
    readonly sub_results?: readonly PagefindSubResult[];
    readonly url: string;
}

export interface PagefindSubResult {
    readonly excerpt: string;
    readonly title: string;
    readonly url: string;
}

export interface DocsSearchSection {
    readonly excerpt: string;
    readonly title: string;
    readonly url: string;
}

export interface DocsSearchResult {
    readonly category: string;
    readonly excerpt: string;
    readonly sections: readonly DocsSearchSection[];
    readonly title: string;
    readonly url: string;
}

const MAX_PAGES = 8;
const MAX_SECTIONS_PER_PAGE = 3;

/**
 * Loads the engine that `npm run build:search-index` generates. It's outside the application's bundle, and it's only
 * fetched when someone first searches.
 */
export const PAGEFIND_LOADER = new InjectionToken<() => Promise<PagefindEngine>>("PAGEFIND_LOADER", {
    factory: () => {
        const document = inject(DOCUMENT);
        return () => import(/* @vite-ignore */ new URL("pagefind/pagefind.js", document.baseURI).href);
    }
});

/** A link the router can follow: no trailing slash on the path, whatever the index does with it. */
const normalizeUrl = (url: string): string => url.replace(/\/(?=#|$)/, "");

const toResult = (data: PagefindResultData): DocsSearchResult => {
    const url = normalizeUrl(data.url);
    return {
        category: data.meta["category"] ?? "",
        excerpt: data.excerpt,
        sections: (data.sub_results ?? [])
            .map(section => ({ ...section, url: normalizeUrl(section.url) }))
            .filter(section => section.url !== url)
            .slice(0, MAX_SECTIONS_PER_PAGE),
        title: data.meta["title"] ?? url,
        url
    };
};

@Injectable({
    providedIn: "root"
})
export class DocsSearchService {
    readonly #load = inject(PAGEFIND_LOADER);
    #engine: Promise<PagefindEngine> | null = null;

    /** Whether the search dialog is open. The sidebar's button and the dialog meet here. */
    public readonly open = signal(false);

    /** Searches the documentation. A failed load isn't kept, so the next search tries again. */
    public async search(query: string): Promise<readonly DocsSearchResult[]> {
        this.#engine ??= this.#load();
        try {
            const { results } = await (await this.#engine).search(query);
            const pages = await Promise.all(results.slice(0, MAX_PAGES).map(result => result.data()));
            return pages.map(toResult);
        } catch (error) {
            this.#engine = null;
            throw error;
        }
    }
}
