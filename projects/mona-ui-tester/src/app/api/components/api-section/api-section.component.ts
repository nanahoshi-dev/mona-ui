import { DOCUMENT } from "@angular/common";
import {
    Component,
    DestroyRef,
    ElementRef,
    Injector,
    afterNextRender,
    computed,
    effect,
    inject,
    input,
    signal
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { catchError, map, of, startWith, switchMap } from "rxjs";
import { createUniqueHeadingId } from "../../../layout/docs-heading-id";
import type { SectionItem } from "../../../layout/models/SectionItem";
import { PageService } from "../../../layout/services/page.service";
import type { ApiPageExport, ApiPageReference } from "../../api-model";
import { ApiReferenceService } from "../../api-reference.service";
import { PACKAGE_NAME, TYPE_KINDS } from "../../api-text";
import { ApiExportListComponent } from "../api-export-list/api-export-list.component";

interface HeadingIds {
    readonly api: string;
    readonly types: string;
}

type SectionState =
    | { readonly status: "loading" }
    | { readonly status: "missing" }
    | { readonly ids: HeadingIds; readonly page: ApiPageReference; readonly status: "ready" };

/** Exports from one entry point, which the section names when it isn't the page's own. */
interface ExportGroup {
    readonly entryPoint: string;
    readonly exports: readonly ApiPageExport[];
}

/**
 * A component page's API section: what the page documents as cards, then its types, each linking to its reference
 * page. It shows what `npm run build:api-data` writes for the page. `src` is the same section as markdown, `api.md`,
 * which search and the AI docs read, and whose folder names the page.
 */
@Component({
    selector: "app-api-section",
    imports: [ApiExportListComponent, RouterLink],
    templateUrl: "./api-section.component.html"
})
export class ApiSectionComponent {
    readonly #api = inject(ApiReferenceService);
    readonly #document = inject(DOCUMENT);
    readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #injector = inject(Injector);
    readonly #pageService = inject(PageService);
    #registered: readonly SectionItem[] = [];
    protected readonly classGroups = computed(() => this.#groups(false));
    protected readonly hasTypes = computed(() => {
        const page = this.ready()?.page;
        return !!page && (page.related.length > 0 || page.exports.some(item => TYPE_KINDS.has(item.kind)));
    });
    protected readonly packageName = PACKAGE_NAME;
    protected readonly ready = computed(() => {
        const state = this.state();
        return state.status === "ready" ? state : null;
    });
    protected readonly state = toSignal(
        toObservable(computed(() => /^docs\/(.+)\/api\.md$/.exec(this.src())?.[1] ?? "")).pipe(
            switchMap(slug =>
                this.#api.page(slug).pipe(
                    map((page): SectionState => ({ ids: this.#headingIds(), page, status: "ready" })),
                    catchError(() => of<SectionState>({ status: "missing" })),
                    startWith<SectionState>({ status: "loading" })
                )
            )
        ),
        { initialValue: { status: "loading" } as SectionState }
    );
    protected readonly typeGroups = computed(() => this.#groups(true));
    /** The id of the page's own section, which this one belongs to in the page's outline. */
    public readonly parentSectionId = input<string | null>(null);
    /** The section as markdown, `docs/<page>/api.md`. */
    public readonly src = input.required<string>();

    public constructor() {
        effect(() => {
            const ready = this.ready();
            if (!ready) {
                return;
            }
            const parentId = this.parentSectionId();
            const sections = [
                this.#sectionItem(ready.ids.api, "API", 1, parentId),
                ...(this.hasTypes() ? [this.#sectionItem(ready.ids.types, "Types", 2, parentId)] : [])
            ];
            // The outline follows the headings, so it waits until they're on the page.
            afterNextRender(() => this.#register(sections), { injector: this.#injector });
        });
        inject(DestroyRef).onDestroy(() => this.#register([]));
    }

    #groups(types: boolean): ExportGroup[] {
        const page = this.ready()?.page;
        if (!page) {
            return [];
        }
        return page.entryPoints
            .map(entryPoint => ({
                entryPoint,
                exports: page.exports.filter(
                    item => item.entryPoint === entryPoint && TYPE_KINDS.has(item.kind) === types
                )
            }))
            .filter(group => group.exports.length > 0);
    }

    /** Ids for the section's headings that no other heading on the page has, as the markdown around it gives them. */
    #headingIds(): HeadingIds {
        const host = this.#host.nativeElement;
        const taken = new Set(
            (Array.from(this.#document.querySelectorAll("[id]")) as HTMLElement[])
                .filter(element => !host.contains(element))
                .map(element => element.id)
        );
        return { api: createUniqueHeadingId("API", taken), types: createUniqueHeadingId("Types", taken) };
    }

    #register(sections: readonly SectionItem[]): void {
        this.#registered.forEach(section => this.#pageService.removeSection(section));
        this.#registered = sections;
        this.#pageService.setSections(sections);
    }

    #sectionItem(id: string, header: string, depth: number, parentId: string | null): SectionItem {
        return { depth: signal(depth), header: signal(header), id: signal(id), parentId: signal(parentId) };
    }
}
