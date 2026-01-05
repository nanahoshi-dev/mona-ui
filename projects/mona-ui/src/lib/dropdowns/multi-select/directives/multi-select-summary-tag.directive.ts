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
     * @description Sets the number of tags to display before the summary tag is displayed.
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
