import { Location } from "@angular/common";
import { Component, computed, DOCUMENT, effect, inject, linkedSignal, resource, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
    CommandComponent,
    CommandDialogComponent,
    CommandDialogContentDirective,
    CommandEmptyComponent,
    CommandFooterComponent,
    CommandInputComponent,
    CommandItemComponent,
    CommandListComponent,
    CommandLoadingComponent,
    type CommandSelectEvent,
    CommandShortcutComponent
} from "@nanahoshi/mona-ui/command";
import { type DocsSearchResult, DocsSearchService } from "../../services/docs-search.service";
import { SidebarService } from "../../services/sidebar.service";

/** Waits for a pause in typing, so each keystroke doesn't fetch a part of the index. */
const SEARCH_DELAY = 120;

/** Ends early when the search is replaced. The resource ignores what a replaced search returns. */
const pause = (milliseconds: number, abortSignal: AbortSignal): Promise<void> =>
    new Promise(resolve => {
        const timer = setTimeout(resolve, milliseconds);
        abortSignal.addEventListener("abort", () => {
            clearTimeout(timer);
            resolve();
        });
    });

/** The documentation's search: a command menu in a dialog, with results from the search index. */
@Component({
    selector: "app-docs-search",
    imports: [
        CommandComponent,
        CommandDialogComponent,
        CommandDialogContentDirective,
        CommandEmptyComponent,
        CommandFooterComponent,
        CommandInputComponent,
        CommandItemComponent,
        CommandListComponent,
        CommandLoadingComponent,
        CommandShortcutComponent
    ],
    templateUrl: "./docs-search.component.html"
})
export class DocsSearchComponent {
    readonly #answer = resource({
        defaultValue: [] as readonly DocsSearchResult[],
        loader: async ({ abortSignal, params }) => {
            if (params === "") {
                return [];
            }
            await pause(SEARCH_DELAY, abortSignal);
            return abortSignal.aborted ? [] : this.search.search(params);
        },
        params: () => this.query().trim()
    });
    readonly #document = inject(DOCUMENT);
    readonly #location = inject(Location);
    readonly #router = inject(Router);
    readonly #sidebar = inject(SidebarService);

    protected readonly failed = computed(() => this.#answer.error() !== undefined);
    protected readonly loading = this.#answer.isLoading;
    protected readonly query = signal("");
    /** What's on screen. While the next answer is on its way the last one stays, so the list doesn't blink as you type. */
    protected readonly results = linkedSignal<
        { loading: boolean; value: readonly DocsSearchResult[] },
        readonly DocsSearchResult[]
    >({
        computation: (source, previous) => (source.loading && previous ? previous.value : source.value),
        source: () => ({
            loading: this.#answer.isLoading() && this.query().trim() !== "",
            value: this.#answer.hasValue() ? this.#answer.value() : []
        })
    });
    protected readonly search = inject(DocsSearchService);

    public constructor() {
        effect(() => {
            if (!this.search.open()) {
                this.query.set("");
            }
        });
    }

    /** Ctrl or Command opens a new tab and leaves the search as it is, so several results can be opened. */
    protected go({ originalEvent, value }: CommandSelectEvent): void {
        if (originalEvent.ctrlKey || originalEvent.metaKey) {
            this.#document.defaultView?.open(this.#location.prepareExternalUrl(value), "_blank", "noopener");
            return;
        }
        this.search.open.set(false);
        this.#sidebar.close();
        void this.#router.navigateByUrl(value);
    }
}
