import { NgTemplateOutlet } from "@angular/common";
import { Component, type ElementRef, inject, type Signal, type TemplateRef, viewChild } from "@angular/core";
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
 * Focus is where the popup under the field keeps it: on the field or in the filter box for a list or a tree, and in
 * the popup, a dialog, for a date or time picker. So the sheet's close button is for pointers; the keyboard closes the
 * sheet with Escape, or Tab for a list or a tree.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
@Component({
    selector: "mona-dropdown-sheet",
    imports: [ButtonDirective, LucideX, NgTemplateOutlet],
    templateUrl: "./dropdown-sheet.component.html",
    host: {
        class: "contents max-h-[inherit]"
    }
})
export class DropdownSheetComponent {
    readonly #popupRef = inject(PopupRef);
    protected readonly content = viewChild.required<ElementRef<HTMLElement>>("content");
    protected readonly data = inject<DropdownSheetData>(PopupDataInjectionToken);
    protected readonly messages = inject(MonaI18nService).componentMessages("dropdowns", DROPDOWNS_DEFAULT_MESSAGES);
    protected readonly sheetClass = dropdownSheetThemeVariants();

    protected closeSheet(): void {
        this.#popupRef.close(new PopupCloseEvent({ via: PopupCloseSource.CloseButton }));
    }

    /**
     * Keeps focus where it is when the sheet's own parts are pressed: its handle, its title or its close button. The
     * dropdown's popup handles presses on itself, as it does under the field: a list keeps focus on the field, and a
     * calendar takes it.
     */
    protected onPointerDown(event: PointerEvent): void {
        const content = this.content().nativeElement;
        const target = event.target;
        if (target instanceof Node && target !== content && content.contains(target)) {
            return;
        }
        event.preventDefault();
    }
}
