import { computed, Directive, effect, ElementRef, inject } from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { DROPDOWNS_DEFAULT_MESSAGES } from "../i18n/dropdowns.default-messages";
import { DropdownService } from "../services/dropdown.service";

@Directive({
    selector: "span[monaDropdownLiveRegion]",
    host: {
        "[class.sr-only]": "true",
        "[attr.aria-live]": '"polite"',
        "[attr.aria-atomic]": '"true"',
        "[attr.aria-label]": "liveRegionText()"
    }
})
export class DropdownLiveRegionDirective {
    readonly #dropdownService = inject(DropdownService);
    readonly #expanded = computed(() => this.#dropdownService.popupRef() !== null);
    readonly #host = inject<ElementRef<HTMLSpanElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #listService = inject(ListService);
    readonly #messages = this.#i18n.componentMessages("dropdowns", DROPDOWNS_DEFAULT_MESSAGES);

    protected readonly liveRegionText = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        const selectedItem = this.#listService.selectedListItems().lastOrDefault();
        const count = this.#listService.viewItems().size();
        const activeItem = highlightedItem ?? selectedItem;

        if (activeItem && this.#expanded()) {
            const text = this.#listService.getItemText(activeItem);
            const positionInfo = this.#listService.getItemPosition(activeItem);
            if (positionInfo) {
                return this.#messages().itemPosition(text, positionInfo.position, positionInfo.total);
            }
            return text;
        }
        return count === 0 ? this.#messages().noResultsFound : this.#messages().resultsAvailable(count);
    });

    public constructor() {
        effect(() => {
            this.#host.nativeElement.textContent = this.liveRegionText();
        });
    }
}
