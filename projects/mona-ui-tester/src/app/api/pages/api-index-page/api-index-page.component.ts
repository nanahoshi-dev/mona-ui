import { Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import type { ApiEntryPointSummary, ApiSymbolKind, ApiSymbolSummary } from "../../api-model";
import { syncPageOutline } from "../../api-outline";
import { ApiReferenceService } from "../../api-reference.service";
import { KIND_GROUP_TITLES, KIND_LABELS, KIND_ORDER, PACKAGE_NAME } from "../../api-text";
import { ApiProseComponent } from "../../components/api-prose/api-prose.component";

/** How many matches the filter lists, so a one-letter query doesn't render the whole library. */
export const MAX_MATCHES = 60;

interface SymbolMatch extends ApiSymbolSummary {
    readonly entryPoint: string;
}

function countLabel(count: number, kind: ApiSymbolKind): string {
    return `${count} ${(count === 1 ? KIND_LABELS[kind] : KIND_GROUP_TITLES[kind]).toLowerCase()}`;
}

/** Every entry point at `/api`, with a filter that finds an export by name across all of them. */
@Component({
    selector: "app-api-index-page",
    imports: [ApiProseComponent, RouterLink, TextBoxDirective],
    templateUrl: "./api-index-page.component.html"
})
export class ApiIndexPageComponent {
    readonly #index = toSignal(inject(ApiReferenceService).index(), { initialValue: null });
    protected readonly entryPoints = computed(() =>
        (this.#index()?.entryPoints ?? []).map(entryPoint => ({
            ...entryPoint,
            counts: this.#counts(entryPoint)
        }))
    );
    protected readonly kindLabels = KIND_LABELS;
    protected readonly matches = computed((): SymbolMatch[] => {
        const query = this.query().trim().toLowerCase();
        if (!query) {
            return [];
        }
        return (this.#index()?.entryPoints ?? [])
            .flatMap(entryPoint => entryPoint.symbols.map(symbol => ({ ...symbol, entryPoint: entryPoint.name })))
            .filter(symbol => symbol.name.toLowerCase().includes(query))
            .sort(
                (first, second) =>
                    Number(!first.name.toLowerCase().startsWith(query)) -
                        Number(!second.name.toLowerCase().startsWith(query)) ||
                    first.name.length - second.name.length ||
                    first.name.localeCompare(second.name, "en")
            );
    });
    protected readonly maxMatches = MAX_MATCHES;
    protected readonly packageName = PACKAGE_NAME;
    protected readonly query = signal("");
    /** What the filter found, or what there is to find, read out as it changes. */
    protected readonly status = computed(() => {
        const index = this.#index();
        if (!index) {
            return "Loading the reference…";
        }
        if (!this.query().trim()) {
            const total = index.entryPoints.reduce((sum, entryPoint) => sum + entryPoint.symbols.length, 0);
            return `${total} exports in ${index.entryPoints.length} entry points.`;
        }
        const count = this.matches().length;
        const found = `${count} ${count === 1 ? "export matches" : "exports match"}`;
        return count > MAX_MATCHES ? `${found}, showing the first ${MAX_MATCHES}.` : `${found}.`;
    });

    public constructor() {
        syncPageOutline(() => [{ id: "api-reference", title: "API Reference" }]);
    }

    protected onQuery(event: Event): void {
        this.query.set((event.target as HTMLInputElement).value);
    }

    #counts(entryPoint: ApiEntryPointSummary): string {
        return KIND_ORDER.map(kind => [kind, entryPoint.symbols.filter(symbol => symbol.kind === kind).length] as const)
            .filter(([, count]) => count > 0)
            .map(([kind, count]) => countLabel(count, kind))
            .join(" · ");
    }
}
