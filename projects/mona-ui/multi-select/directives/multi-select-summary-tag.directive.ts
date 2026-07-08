import { contentChild, Directive, effect, inject, input, TemplateRef, untracked } from "@angular/core";
import { MultiSelectService } from "../services/multi-select.service";
import { MultiSelectSummaryTagTemplateDirective } from "./multi-select-summary-tag-template.directive";

@Directive({
    selector: "mona-multi-select[monaMultiSelectSummaryTag]"
})
export class MultiSelectSummaryTagDirective<TData> {
    readonly #multiSelectService = inject(MultiSelectService);
    private readonly summaryTagTemplate = contentChild(MultiSelectSummaryTagTemplateDirective, { read: TemplateRef });

    /**
     * @description Number of selected item tags to display before collapsing the rest into a summary tag.
     * A negative value shows every selected item as its own tag and never renders the summary tag.
     * @default -1
     */
    public readonly tagCount = input(-1, { alias: "monaMultiSelectSummaryTag" });

    public constructor() {
        effect(() => {
            const tagCount = this.tagCount();
            untracked(() => this.#multiSelectService.tagCount.set(tagCount));
        });
        effect(() => {
            const tagTemplate = this.summaryTagTemplate();
            untracked(() => this.#multiSelectService.summaryTagTemplate.set(tagTemplate ?? null));
        });
    }
}
