import { Component, input, model } from "@angular/core";
import { LucideSearch } from "@lucide/angular";
import { TextBoxComponent, TextBoxPrefixTemplateDirective } from "@nanahoshi/mona-ui/text-box";

/** One group a filter bar can narrow to, tinted with its hue. */
export interface ApiFilterGroup<K extends string> {
    readonly count: number;
    readonly hue: string;
    readonly key: K;
    readonly title: string;
}

/**
 * The filters of a reference page: a button for each group, which narrows the page to it, and a text box that leaves
 * what matches. The groups show only when there are two or more. Lays itself out against the page's container.
 */
@Component({
    selector: "app-api-filter-bar",
    imports: [LucideSearch, TextBoxComponent, TextBoxPrefixTemplateDirective],
    templateUrl: "./api-filter-bar.component.html",
    host: {
        class: "mt-5 flex flex-col gap-3 border-t border-border pt-4 @2xl:flex-row @2xl:items-start @2xl:justify-between"
    }
})
export class ApiFilterBarComponent<K extends string> {
    /** What the group buttons filter by, such as "kind". */
    public readonly groupLabel = input.required<string>();
    public readonly groups = input.required<readonly ApiFilterGroup<K>[]>();
    public readonly inputId = input.required<string>();
    public readonly placeholder = input.required<string>();
    /** What the text box holds. */
    public readonly query = model("");
    /** What the text box matches, as its accessible name. */
    public readonly queryLabel = input.required<string>();
    /** The group the page is narrowed to, or null for every group. */
    public readonly selected = model<K | null>(null);
    /** How many there are in every group. */
    public readonly total = input.required<number>();
}
