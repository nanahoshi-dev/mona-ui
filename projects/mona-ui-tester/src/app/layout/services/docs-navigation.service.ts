import { DOCUMENT, Injectable, computed, effect, inject, signal, untracked } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { DOCS_MANIFEST, flattenDocsPages } from "../docs-manifest";
import type { DocsCategory, DocsPage } from "../docs-manifest";

const STORAGE_KEY = "mona-docs-navigation";
const ALWAYS_OPEN_BY_DEFAULT = "get-started";
const API_PATH = /^\/api(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/;

/** Where the reader is in the API reference: its index, an entry point, or one of that entry point's exports. */
export interface ApiLocation {
    readonly entryPoint?: string;
    readonly symbol?: string;
}

/**
 * Where the reader is in the documentation, from the manifest and the current URL. The sidebar has two instances, one
 * for the drawer and one for wide screens, and which sections are open is shared between them through here.
 */
@Injectable({ providedIn: "root" })
export class DocsNavigationService {
    /** What the reader chose for a section, where it differs from the default. */
    readonly #choices = signal<Record<string, boolean>>({});
    readonly #pages = flattenDocsPages();
    readonly #router = inject(Router);
    readonly #storage = this.#readStorage();

    /** Where the URL is in the API reference, or `null` outside `/api`. A change of fragment alone doesn't change it. */
    public readonly apiLocation = computed<ApiLocation | null>(
        () => {
            const match = API_PATH.exec(this.url().split(/[?#]/)[0]);
            if (!match) {
                return null;
            }
            const [, entryPoint, symbol] = match.map(part =>
                part === undefined ? undefined : decodeURIComponent(part)
            );
            return { entryPoint, symbol };
        },
        {
            equal: (first, second) =>
                first === second ||
                (first !== null &&
                    second !== null &&
                    first.entryPoint === second.entryPoint &&
                    first.symbol === second.symbol)
        }
    );
    public readonly categories: readonly DocsCategory[] = DOCS_MANIFEST;
    public readonly currentCategory = computed<DocsCategory | null>(() => {
        const page = this.currentPage();
        return page ? (this.categories.find(category => flattenDocsPages([category]).includes(page)) ?? null) : null;
    });
    /** The page the URL names under `/components`, where a nested page's path has a segment for each level. */
    public readonly currentPage = computed<DocsPage | null>(() => {
        const path = this.url()
            .split(/[?#]/)[0]
            .replace(/^\/components\//, "")
            .replace(/\/$/, "");
        return this.#pages.find(page => page.path === path) ?? null;
    });
    public readonly nextPage = computed(() => this.#neighbor(1));
    public readonly previousPage = computed(() => this.#neighbor(-1));
    public readonly url = toSignal(
        this.#router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            map(() => this.#router.url),
            startWith(this.#router.url)
        ),
        { requireSync: true }
    );

    public constructor() {
        this.#choices.set(this.#readChoices());
        // Going to a page shows where it is, even if the reader closed its section earlier.
        effect(() => {
            this.currentPage();
            const category = this.currentCategory();
            if (category && untracked(this.#choices)[category.id] === false) {
                untracked(() => this.#choose(category.id, true));
            }
        });
    }

    /** A section is open if the reader opened it, and otherwise if it's the first one or holds the current page. */
    public isExpanded(categoryId: string): boolean {
        return (
            this.#choices()[categoryId] ??
            (categoryId === ALWAYS_OPEN_BY_DEFAULT || categoryId === this.currentCategory()?.id)
        );
    }

    public toggle(categoryId: string): void {
        this.#choose(categoryId, !this.isExpanded(categoryId));
    }

    #choose(categoryId: string, expanded: boolean): void {
        this.#choices.update(choices => ({ ...choices, [categoryId]: expanded }));
        try {
            this.#storage?.setItem(STORAGE_KEY, JSON.stringify(this.#choices()));
        } catch {
            // Without storage the choice lasts until the page reloads.
        }
    }

    #neighbor(offset: number): DocsPage | null {
        const page = this.currentPage();
        return page ? (this.#pages[this.#pages.indexOf(page) + offset] ?? null) : null;
    }

    #readChoices(): Record<string, boolean> {
        try {
            const stored: unknown = JSON.parse(this.#storage?.getItem(STORAGE_KEY) ?? "{}");
            return stored && typeof stored === "object" ? (stored as Record<string, boolean>) : {};
        } catch {
            return {};
        }
    }

    #readStorage(): Storage | null {
        try {
            return inject(DOCUMENT).defaultView?.localStorage ?? null;
        } catch {
            return null;
        }
    }
}
