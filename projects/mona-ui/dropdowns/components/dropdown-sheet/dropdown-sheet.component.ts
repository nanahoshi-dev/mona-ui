import { NgTemplateOutlet } from "@angular/common";
import { Component, inject, type Signal, type TemplateRef } from "@angular/core";
import { LucideX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { PopupCloseEvent, PopupCloseSource, PopupDataInjectionToken, PopupRef } from "@nanahoshi/mona-ui/popup";
import { DROPDOWNS_DEFAULT_MESSAGES } from "../../i18n/dropdowns.default-messages";
import { dropdownSheetThemeVariants } from "../../styles/dropdown-sheet.styles";

/** What a dropdown passes to the bottom sheet its popup opens as. */
export interface DropdownSheetData {
    /** The dropdown's popup template, shown below the sheet's header. */
    readonly content: TemplateRef<unknown>;
    /** The sheet's title: the dropdown's `adaptiveTitle`, or else its name. */
    readonly title: Signal<string>;
}

/**
 * The bottom sheet a dropdown's popup opens as on a small screen (`adaptiveMode="auto"`): a header with the field's
 * name and a close button, over the dropdown's own popup.
 *
 * Focus stays on the field, or in the popup's filter box, as it does in the popup under the field. So the sheet isn't a
 * dialog, and its close button is for pointers; the keyboard closes it with Escape or Tab.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
@Component({
    selector: "mona-dropdown-sheet",
    imports: [ButtonDirective, LucideX, NgTemplateOutlet],
    templateUrl: "./dropdown-sheet.component.html",
    host: {
        class: "contents"
    }
})
export class DropdownSheetComponent {
    readonly #popupRef = inject(PopupRef);
    protected readonly data = inject<DropdownSheetData>(PopupDataInjectionToken);
    protected readonly messages = inject(MonaI18nService).componentMessages("dropdowns", DROPDOWNS_DEFAULT_MESSAGES);
    protected readonly sheetClass = dropdownSheetThemeVariants();

    protected closeSheet(): void {
        this.#popupRef.close(new PopupCloseEvent({ via: PopupCloseSource.CloseButton }));
    }

    /** Keeps focus on the field (or in the filter box) when the sheet is pressed. */
    protected onPointerDown(event: PointerEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.tagName !== "INPUT") {
            event.preventDefault();
        }
    }
}
