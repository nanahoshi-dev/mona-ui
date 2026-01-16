import { computed, Directive, effect, ElementRef, inject } from "@angular/core";
import { ListService } from "../../common/list/services/list.service";
import { DropdownService } from "../../common/dropdown/services/dropdown.service";

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
    readonly #host = inject<ElementRef<HTMLSpanElement>>(ElementRef);
    readonly #listService = inject(ListService);
    readonly #expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly liveRegionText = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        const selectedItem = this.#listService.selectedListItems().lastOrDefault();
        const count = this.#listService.viewItems().size();
        const activeItem = highlightedItem ?? selectedItem;

        if (activeItem && this.#expanded()) {
            const text = this.#listService.getItemText(activeItem);
            const positionInfo = this.#listService.getItemPosition(activeItem);
            if (positionInfo) {
                return `${text}, ${positionInfo.position} of ${positionInfo.total}`;
            }
            return text;
        }
        return count === 0 ? "No results found" : `${count} result${count === 1 ? "" : "s"} available`;
    });

    public constructor() {
        effect(() => {
            this.#host.nativeElement.textContent = this.liveRegionText();
        });
    }
}
