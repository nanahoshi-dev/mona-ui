import { DOCUMENT } from "@angular/common";
import { Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { LucideCheck, LucideCopy } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { catchError, map, of, startWith, switchMap } from "rxjs";
import { slugifyHeading } from "../../../layout/docs-heading-id";
import type { ApiEntryPointReference, ApiSymbolReference } from "../../api-model";
import { syncPageOutline } from "../../api-outline";
import { ApiReferenceService } from "../../api-reference.service";
import { KIND_LABELS, PACKAGE_NAME, SIGNATURE_ID, USED_BY_ID, apiSections, importStatement } from "../../api-text";
import { ApiMemberSectionComponent } from "../../components/api-member-section/api-member-section.component";
import { ApiProseComponent } from "../../components/api-prose/api-prose.component";
import { ApiTypeComponent } from "../../components/api-type/api-type.component";

type SymbolPageState =
    | { readonly status: "loading" }
    | { readonly entryPoint: string; readonly name: string; readonly status: "missing" }
    | { readonly reference: ApiEntryPointReference; readonly status: "ready"; readonly symbol: ApiSymbolReference };

const COPIED_FOR_MS = 2000;

/** The reference page of one export, at `/api/<entry point>/<name>`. */
@Component({
    selector: "app-api-symbol-page",
    imports: [
        ApiMemberSectionComponent,
        ApiProseComponent,
        ApiTypeComponent,
        ButtonDirective,
        LucideCheck,
        LucideCopy,
        RouterLink
    ],
    templateUrl: "./api-symbol-page.component.html"
})
export class ApiSymbolPageComponent {
    readonly #api = inject(ApiReferenceService);
    readonly #document = inject(DOCUMENT);
    readonly #route = inject(ActivatedRoute);
    #copiedTimer: ReturnType<typeof setTimeout> | undefined;
    protected readonly copied = signal(false);
    protected readonly importText = computed(() => {
        const ready = this.ready();
        return ready ? importStatement(ready.symbol, ready.reference.name) : "";
    });
    protected readonly kindLabels = KIND_LABELS;
    protected readonly missing = computed(() => {
        const state = this.state();
        return state.status === "missing" ? state : null;
    });
    protected readonly packageName = PACKAGE_NAME;
    protected readonly ready = computed(() => {
        const state = this.state();
        return state.status === "ready" ? state : null;
    });
    protected readonly sections = computed(() => {
        const ready = this.ready();
        return ready ? apiSections(ready.symbol) : [];
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
    protected readonly titleId = computed(() => slugifyHeading(this.ready()?.symbol.name ?? "symbol"));
    protected readonly usedById = USED_BY_ID;

    public constructor() {
        syncPageOutline(() => {
            const ready = this.ready();
            if (!ready) {
                return [];
            }
            return [
                { id: this.titleId(), title: ready.symbol.name },
                ...(ready.symbol.signature ? [{ id: SIGNATURE_ID, title: "Signature" }] : []),
                ...this.sections().map(section => ({ id: section.id, title: section.title })),
                ...(ready.symbol.usedBy?.length ? [{ id: USED_BY_ID, title: "Used by" }] : [])
            ];
        });
        inject(DestroyRef).onDestroy(() => clearTimeout(this.#copiedTimer));
    }

    protected async copyImport(): Promise<void> {
        const clipboard = this.#document.defaultView?.navigator.clipboard;
        if (!clipboard) {
            return;
        }
        try {
            await clipboard.writeText(this.importText());
        } catch {
            // Without clipboard access the statement stays on the page to select.
            return;
        }
        clearTimeout(this.#copiedTimer);
        this.copied.set(true);
        this.#copiedTimer = setTimeout(() => this.copied.set(false), COPIED_FOR_MS);
    }
}
