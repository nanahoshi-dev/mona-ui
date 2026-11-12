import { DOCUMENT } from "@angular/common";
import { Component, DestroyRef, computed, inject, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { LucideArrowRight, LucideBookOpen, LucideCheck, LucideCopy } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { catchError, map, of, startWith, switchMap } from "rxjs";
import { slugifyHeading } from "../../../layout/docs-heading-id";
import { KIND_HUES, SECTION_HUES } from "../../api-kind-hues";
import type { ApiEntryPointReference, ApiSymbolReference } from "../../api-model";
import { syncPageOutline } from "../../api-outline";
import { ApiReferenceService } from "../../api-reference.service";
import {
    type ApiSectionItem,
    KIND_LABELS,
    PACKAGE_NAME,
    SIGNATURE_ID,
    USED_BY_ID,
    apiSections,
    importKeyword,
    importStatement,
    selectorAlternatives
} from "../../api-text";
import { ApiFilterBarComponent, type ApiFilterGroup } from "../../components/api-filter-bar/api-filter-bar.component";
import { ApiMemberSectionComponent } from "../../components/api-member-section/api-member-section.component";
import { ApiProseComponent } from "../../components/api-prose/api-prose.component";
import { ApiTypeComponent } from "../../components/api-type/api-type.component";

type SymbolPageState =
    | { readonly status: "loading" }
    | { readonly entryPoint: string; readonly name: string; readonly status: "missing" }
    | { readonly reference: ApiEntryPointReference; readonly status: "ready"; readonly symbol: ApiSymbolReference };

/** What a template uses the symbol by: one of its selectors, its pipe name or the name it's exported as. */
interface SymbolUse {
    readonly label: string;
    /** The use split before each attribute, so a long one wraps between them rather than mid-word. */
    readonly parts: readonly string[];
    /** Whether its label shows, which only the first of several selectors' does. */
    readonly showLabel: boolean;
    /** What its button's tooltip says it copies. */
    readonly title: string;
    readonly value: string;
}

const COPIED_FOR_MS = 2000;

function matches(item: ApiSectionItem, query: string): boolean {
    return [item.name, item.type, item.signature, item.value, item.description].some(text =>
        text?.toLowerCase().includes(query)
    );
}

/**
 * The reference page of one export, at `/api/<entry point>/<name>`: its kind, import and what a template uses it by,
 * then its members as cards grouped and tinted by section, which a filter narrows to one section or to the names,
 * types and descriptions that match.
 */
@Component({
    selector: "app-api-symbol-page",
    imports: [
        ApiFilterBarComponent,
        ApiMemberSectionComponent,
        ApiProseComponent,
        ApiTypeComponent,
        ButtonDirective,
        LucideArrowRight,
        LucideBookOpen,
        LucideCheck,
        LucideCopy,
        RouterLink
    ],
    templateUrl: "./api-symbol-page.component.html",
    host: {
        class: "block @container"
    }
})
export class ApiSymbolPageComponent {
    readonly #api = inject(ApiReferenceService);
    readonly #document = inject(DOCUMENT);
    /** Which symbol is open, so the filters reset when another opens. */
    readonly #openSymbol = computed(() => {
        const ready = this.ready();
        return ready ? `${ready.reference.name}/${ready.symbol.name}` : undefined;
    });
    readonly #route = inject(ActivatedRoute);
    #copiedTimer: ReturnType<typeof setTimeout> | undefined;
    /** What was copied last, until its check mark goes. */
    protected readonly copied = signal<string | null>(null);
    /** What a screen reader hears after a copy. */
    protected readonly copiedStatus = computed(() => {
        const copied = this.copied();
        if (copied === null) {
            return "";
        }
        return copied === this.importText() ? "Import copied" : `Copied ${copied}`;
    });
    protected readonly filterGroups = computed(() =>
        this.sections().map((section): ApiFilterGroup<string> => ({
            count: section.items.length,
            hue: SECTION_HUES[section.kind],
            key: section.id,
            title: section.title
        }))
    );
    protected readonly filterId = "symbol-filter";
    protected readonly importKeyword = computed(() => importKeyword(this.ready()?.symbol.kind ?? "class"));
    protected readonly importText = computed(() => {
        const ready = this.ready();
        return ready ? importStatement(ready.symbol, ready.reference.name) : "";
    });
    protected readonly kindHue = computed(() => KIND_HUES[this.ready()?.symbol.kind ?? "class"]);
    protected readonly kindLabels = KIND_LABELS;
    protected readonly missing = computed(() => {
        const state = this.state();
        return state.status === "missing" ? state : null;
    });
    protected readonly packageName = PACKAGE_NAME;
    /** What the filter's text box holds. Each symbol opens with it empty. */
    protected readonly query = linkedSignal<string | undefined, string>({
        computation: () => "",
        source: () => this.#openSymbol()
    });
    protected readonly ready = computed(() => {
        const state = this.state();
        return state.status === "ready" ? state : null;
    });
    /** The id of the section the page is narrowed to, or null for every section. Each symbol opens with every one. */
    protected readonly section = linkedSignal<string | undefined, string | null>({
        computation: () => null,
        source: () => this.#openSymbol()
    });
    protected readonly sections = computed(() => {
        const ready = this.ready();
        return ready ? apiSections(ready.symbol) : [];
    });
    /** The sections the filter leaves, each with the members that match. */
    protected readonly shownSections = computed(() => {
        const section = this.section();
        const query = this.query().trim().toLowerCase();
        return this.sections()
            .filter(current => section === null || current.id === section)
            .map(current =>
                query ? { ...current, items: current.items.filter(item => matches(item, query)) } : current
            )
            .filter(current => current.items.length > 0);
    });
    protected readonly signatureId = SIGNATURE_ID;
    protected readonly state = toSignal(
        this.#route.paramMap.pipe(
            switchMap(params => {
                const entryPoint = params.get("entryPoint") ?? "";
                const name = params.get("symbol") ?? "";
                return this.#api.entryPoint(entryPoint).pipe(
                    map((reference): SymbolPageState => {
                        const symbol = reference.symbols.find(item => item.name === name);
                        return symbol
                            ? { reference, status: "ready", symbol }
                            : { entryPoint, name, status: "missing" };
                    }),
                    catchError(() => of<SymbolPageState>({ entryPoint, name, status: "missing" })),
                    startWith<SymbolPageState>({ status: "loading" })
                );
            })
        ),
        { initialValue: { status: "loading" } as SymbolPageState }
    );
    /** How many members the filter leaves, read out as it changes. Silent while nothing is filtered. */
    protected readonly status = computed(() => {
        if (this.section() === null && !this.query().trim()) {
            return "";
        }
        const shown = this.shownSections().reduce((sum, section) => sum + section.items.length, 0);
        return `${shown} of ${this.total()} members shown.`;
    });
    protected readonly titleId = computed(() => slugifyHeading(this.ready()?.symbol.name ?? "symbol"));
    protected readonly total = computed(() => this.sections().reduce((sum, section) => sum + section.items.length, 0));
    protected readonly usedById = USED_BY_ID;
    protected readonly uses = computed((): SymbolUse[] => {
        const symbol = this.ready()?.symbol;
        if (!symbol) {
            return [];
        }
        const uses = [
            ...(symbol.selector ? selectorAlternatives(symbol.selector) : []).map(value => ({
                label: "Selector",
                title: "Copy the selector",
                value
            })),
            ...(symbol.pipeName ? [{ label: "Pipe", title: "Copy the pipe name", value: symbol.pipeName }] : []),
            ...(symbol.exportAs
                ? [{ label: "Exported as", title: "Copy the name it's exported as", value: symbol.exportAs }]
                : [])
        ];
        return uses.map((use, index) => ({
            ...use,
            parts: use.value.split(/(?=\[)/),
            showLabel: index === 0 || uses[index - 1].label !== use.label
        }));
    });

    public constructor() {
        syncPageOutline(() => {
            const ready = this.ready();
            if (!ready) {
                return [];
            }
            return [
                { id: this.titleId(), title: ready.symbol.name },
                ...(ready.symbol.signature ? [{ id: SIGNATURE_ID, title: "Signature" }] : []),
                ...this.shownSections().map(section => ({ id: section.id, title: section.title })),
                ...(ready.symbol.usedBy?.length ? [{ id: USED_BY_ID, title: "Used by" }] : [])
            ];
        });
        inject(DestroyRef).onDestroy(() => clearTimeout(this.#copiedTimer));
    }

    protected async copy(text: string): Promise<void> {
        const clipboard = this.#document.defaultView?.navigator.clipboard;
        if (!clipboard) {
            return;
        }
        try {
            await clipboard.writeText(text);
        } catch {
            // Without clipboard access the text stays on the page to select.
            return;
        }
        clearTimeout(this.#copiedTimer);
        this.copied.set(text);
        this.#copiedTimer = setTimeout(() => this.copied.set(null), COPIED_FOR_MS);
    }

    protected resetFilters(): void {
        this.section.set(null);
        this.query.set("");
        // The button leaves with the empty state, so focus goes to the filter rather than the top of the page.
        this.#document.getElementById(this.filterId)?.focus();
    }
}
