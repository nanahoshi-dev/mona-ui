import { Component, DestroyRef, inject, signal } from "@angular/core";
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
import type { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

/** The folders the made-up server knows. */
const FOLDERS = [
    "Documents",
    "Documents\\Invoices",
    "Downloads",
    "Music",
    "Pictures",
    "Pictures\\Camera roll",
    "Pictures\\Screenshots",
    "Videos"
];

/** How long the made-up server takes to answer. */
const LOOKUP_MS = 150;

@Component({
    selector: "app-auto-complete-suggestions-example",
    imports: [AutoCompleteComponent, DropdownFilterableDirective, LabelDirective],
    templateUrl: "./suggestions-example.component.html"
})
export class AutoCompleteSuggestionsExampleComponent {
    #lookup: ReturnType<typeof setTimeout> | null = null;

    protected readonly folder = signal<string | null>(null);
    protected readonly loading = signal(false);
    protected readonly suggestions = signal<readonly string[]>([]);

    public constructor() {
        inject(DestroyRef).onDestroy(() => this.#cancelLookup());
    }

    /**
     * Looks the typed text up, as a server would, in place of the lookup before it. Cancelling the change keeps the
     * list from narrowing the answer again.
     */
    protected suggest(event: FilterChangeEvent): void {
        event.preventDefault();
        this.#cancelLookup();
        const text = event.filter.toLowerCase();
        if (!text) {
            this.suggestions.set([]);
            return;
        }
        this.loading.set(true);
        this.#lookup = setTimeout(() => {
            this.#lookup = null;
            this.loading.set(false);
            this.suggestions.set(FOLDERS.filter(folder => folder.toLowerCase().startsWith(text)));
        }, LOOKUP_MS);
    }

    #cancelLookup(): void {
        if (this.#lookup !== null) {
            clearTimeout(this.#lookup);
            this.#lookup = null;
            this.loading.set(false);
        }
    }
}
