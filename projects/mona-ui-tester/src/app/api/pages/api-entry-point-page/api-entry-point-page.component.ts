import { DOCUMENT } from "@angular/common";
import { Component, DestroyRef, computed, inject, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { LucideArrowRight, LucideBookOpen, LucideCheck, LucideCopy } from "@lucide/angular";
import { catchError, map, of, startWith, switchMap } from "rxjs";
import { slugifyHeading } from "../../../layout/docs-heading-id";
import { KIND_HUES } from "../../api-kind-hues";
import type { ApiEntryPointReference, ApiSymbolKind } from "../../api-model";
import { syncPageOutline } from "../../api-outline";
import { ApiReferenceService } from "../../api-reference.service";
import { KIND_GROUP_TITLES, KIND_ORDER, PACKAGE_NAME, summarize } from "../../api-text";
import { ApiFilterBarComponent, type ApiFilterGroup } from "../../components/api-filter-bar/api-filter-bar.component";
import { ApiProseComponent } from "../../components/api-prose/api-prose.component";

const COPIED_FOR_MS = 2000;

type EntryPointPageState =
    | { readonly status: "loading" }
    | { readonly name: string; readonly status: "missing" }
    | { readonly reference: ApiEntryPointReference; readonly status: "ready" };

interface SymbolEntry {
    readonly name: string;
    /** The description's first sentence, as markdown. */
    readonly summary: string;
}

interface SymbolGroup {
    readonly hue: string;
    readonly id: string;
    readonly kind: ApiSymbolKind;
    readonly symbols: readonly SymbolEntry[];
    readonly title: string;
}

function matches(symbol: SymbolEntry, query: string): boolean {
    return symbol.name.toLowerCase().includes(query) || symbol.summary.toLowerCase().includes(query);
}

/**
 * What one entry point exports at `/api/<entry point>`: its import path to copy, its guides, and its exports as cards
 * grouped and tinted by kind, which a filter narrows to one kind or to the names and descriptions that match.
 */
@Component({
    selector: "app-api-entry-point-page",
    imports: [
        ApiFilterBarComponent,
        ApiProseComponent,
        LucideArrowRight,
        LucideBookOpen,
        LucideCheck,
        LucideCopy,
        RouterLink
    ],
    templateUrl: "./api-entry-point-page.component.html",
    host: {
        class: "block @container"
    }
})
export class ApiEntryPointPageComponent {
    readonly #api = inject(ApiReferenceService);
    readonly #document = inject(DOCUMENT);
    readonly #route = inject(ActivatedRoute);
    #copiedTimer: ReturnType<typeof setTimeout> | undefined;
    protected readonly copied = signal(false);
    protected readonly filterGroups = computed(() =>
        this.groups().map((group): ApiFilterGroup<ApiSymbolKind> => ({
            count: group.symbols.length,
            hue: group.hue,
            key: group.kind,
            title: group.title
        }))
    );
    protected readonly filterId = "entry-point-filter";
    /** Every kind the entry point exports, in order, with its exports by name. */
    protected readonly groups = computed((): SymbolGroup[] => {
        const reference = this.ready()?.reference;
        if (!reference) {
            return [];
        }
        return KIND_ORDER.map(kind => ({
            hue: KIND_HUES[kind],
            id: slugifyHeading(KIND_GROUP_TITLES[kind]),
            kind,
            symbols: reference.symbols
                .filter(symbol => symbol.kind === kind)
                .map(symbol => ({ name: symbol.name, summary: summarize(symbol.description) }))
                .sort((first, second) => first.name.localeCompare(second.name, "en")),
            title: KIND_GROUP_TITLES[kind]
        })).filter(group => group.symbols.length > 0);
    });
    protected readonly guidesId = "entry-point-guides";
    /** The kind the page is narrowed to, or null for every kind. Each entry point opens with every kind. */
    protected readonly kind = linkedSignal<string | undefined, ApiSymbolKind | null>({
        computation: () => null,
        source: () => this.ready()?.reference.name
    });
    protected readonly missing = computed(() => {
        const state = this.state();
        return state.status === "missing" ? state : null;
    });
    protected readonly packageName = PACKAGE_NAME;
    /** What the filter's text box holds. Each entry point opens with it empty. */
    protected readonly query = linkedSignal<string | undefined, string>({
        computation: () => "",
        source: () => this.ready()?.reference.name
    });
    protected readonly ready = computed(() => {
        const state = this.state();
        return state.status === "ready" ? state : null;
    });
    /** The groups the filter leaves, each with the exports that match. */
    protected readonly shownGroups = computed((): SymbolGroup[] => {
        const kind = this.kind();
        const query = this.query().trim().toLowerCase();
        return this.groups()
            .filter(group => kind === null || group.kind === kind)
            .map(group =>
                query ? { ...group, symbols: group.symbols.filter(symbol => matches(symbol, query)) } : group
            )
            .filter(group => group.symbols.length > 0);
    });
    protected readonly state = toSignal(
        this.#route.paramMap.pipe(
            switchMap(params => {
                const name = params.get("entryPoint") ?? "";
                return this.#api.entryPoint(name).pipe(
                    map((reference): EntryPointPageState => ({ reference, status: "ready" })),
                    catchError(() => of<EntryPointPageState>({ name, status: "missing" })),
                    startWith<EntryPointPageState>({ status: "loading" })
                );
            })
        ),
        { initialValue: { status: "loading" } as EntryPointPageState }
    );
    /** How many exports the filter leaves, read out as it changes. Silent while nothing is filtered. */
    protected readonly status = computed(() => {
        if (this.kind() === null && !this.query().trim()) {
            return "";
        }
        const shown = this.shownGroups().reduce((sum, group) => sum + group.symbols.length, 0);
        return `${shown} of ${this.total()} exports shown.`;
    });
    protected readonly titleId = "entry-point";
    protected readonly total = computed(() => this.ready()?.reference.symbols.length ?? 0);

    public constructor() {
        syncPageOutline(() => {
            const ready = this.ready();
            return ready
                ? [
                      { id: this.titleId, title: `${PACKAGE_NAME}/${ready.reference.name}` },
                      ...this.shownGroups().map(group => ({ id: group.id, title: group.title }))
                  ]
                : [];
        });
        inject(DestroyRef).onDestroy(() => clearTimeout(this.#copiedTimer));
    }

    protected async copyPath(name: string): Promise<void> {
        const clipboard = this.#document.defaultView?.navigator.clipboard;
        if (!clipboard) {
            return;
        }
        try {
            await clipboard.writeText(`${PACKAGE_NAME}/${name}`);
        } catch {
            // Without clipboard access the path stays on the page to select.
            return;
        }
        clearTimeout(this.#copiedTimer);
        this.copied.set(true);
        this.#copiedTimer = setTimeout(() => this.copied.set(false), COPIED_FOR_MS);
    }

    protected resetFilters(): void {
        this.kind.set(null);
        this.query.set("");
        // The button leaves with the empty state, so focus goes to the filter rather than the top of the page.
        this.#document.getElementById(this.filterId)?.focus();
    }
}
