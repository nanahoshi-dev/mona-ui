import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { catchError, map, of, startWith, switchMap } from "rxjs";
import { slugifyHeading } from "../../../layout/docs-heading-id";
import type { ApiEntryPointReference, ApiSymbolKind } from "../../api-model";
import { syncPageOutline } from "../../api-outline";
import { ApiReferenceService } from "../../api-reference.service";
import { KIND_GROUP_TITLES, KIND_ORDER, PACKAGE_NAME, summarize } from "../../api-text";
import { ApiProseComponent } from "../../components/api-prose/api-prose.component";

type EntryPointPageState =
    | { readonly status: "loading" }
    | { readonly name: string; readonly status: "missing" }
    | { readonly reference: ApiEntryPointReference; readonly status: "ready" };

interface SymbolGroup {
    readonly id: string;
    readonly kind: ApiSymbolKind;
    readonly symbols: readonly { readonly name: string; readonly summary: string }[];
    readonly title: string;
}

/** What one entry point exports, by kind, at `/api/<entry point>`. */
@Component({
    selector: "app-api-entry-point-page",
    imports: [ApiProseComponent, RouterLink],
    templateUrl: "./api-entry-point-page.component.html"
})
export class ApiEntryPointPageComponent {
    readonly #api = inject(ApiReferenceService);
    readonly #route = inject(ActivatedRoute);
    protected readonly groups = computed((): SymbolGroup[] => {
        const reference = this.ready()?.reference;
        if (!reference) {
            return [];
        }
        return KIND_ORDER.map(kind => ({
            id: slugifyHeading(KIND_GROUP_TITLES[kind]),
            kind,
            symbols: reference.symbols
                .filter(symbol => symbol.kind === kind)
                .map(symbol => ({ name: symbol.name, summary: summarize(symbol.description) }))
                .sort((first, second) => first.name.localeCompare(second.name, "en")),
            title: KIND_GROUP_TITLES[kind]
        })).filter(group => group.symbols.length > 0);
    });
    protected readonly missing = computed(() => {
        const state = this.state();
        return state.status === "missing" ? state : null;
    });
    protected readonly packageName = PACKAGE_NAME;
    protected readonly ready = computed(() => {
        const state = this.state();
        return state.status === "ready" ? state : null;
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
    protected readonly titleId = "entry-point";

    public constructor() {
        syncPageOutline(() => {
            const ready = this.ready();
            return ready
                ? [
                      { id: this.titleId, title: `${PACKAGE_NAME}/${ready.reference.name}` },
                      ...this.groups().map(group => ({ id: group.id, title: group.title }))
                  ]
                : [];
        });
    }
}
