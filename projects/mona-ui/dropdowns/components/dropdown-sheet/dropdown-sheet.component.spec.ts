import { Component, signal, type TemplateRef, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { type PopupCloseEvent, PopupCloseSource, PopupDataInjectionToken, PopupRef } from "@nanahoshi/mona-ui/popup";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownSheetComponent, type DropdownSheetData } from "./dropdown-sheet.component";

/** Holds the popup content a dropdown would pass to its sheet. */
@Component({
    template: `
        <ng-template #content>
            <input aria-label="Filter places" />
            <ul aria-label="Places" role="listbox">
                <li aria-selected="false" role="option">Lisbon</li>
            </ul>
        </ng-template>
    `
})
class ContentHostComponent {
    public readonly content = viewChild.required<TemplateRef<unknown>>("content");
}

describe("DropdownSheetComponent", () => {
    let close: ReturnType<typeof vi.fn>;
    let fixture: ComponentFixture<DropdownSheetComponent>;
    let title: ReturnType<typeof signal<string>>;

    beforeEach(async () => {
        close = vi.fn();
        title = signal("Place");
        const data: { content: TemplateRef<unknown> | null; title: typeof title } = { content: null, title };
        TestBed.configureTestingModule({
            imports: [ContentHostComponent, DropdownSheetComponent],
            providers: [
                { provide: PopupRef, useValue: { close } },
                { provide: PopupDataInjectionToken, useFactory: (): DropdownSheetData => data as DropdownSheetData }
            ]
        });
        const contentHost = TestBed.createComponent(ContentHostComponent);
        contentHost.detectChanges();
        data.content = contentHost.componentInstance.content();
        fixture = TestBed.createComponent(DropdownSheetComponent);
        document.body.append(fixture.nativeElement as HTMLElement);
        await stable();
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
    });

    async function stable(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function getCloseButton(): HTMLButtonElement {
        return (fixture.nativeElement as HTMLElement).querySelector("header button") as HTMLButtonElement;
    }

    it("shows the title above the dropdown's popup content", async () => {
        const sheet = fixture.nativeElement as HTMLElement;
        expect(sheet.querySelector("header")?.textContent?.trim()).toBe("Place");
        expect(sheet.querySelector("[role='listbox']")?.textContent?.trim()).toBe("Lisbon");

        title.set("Destination");
        await stable();
        expect(sheet.querySelector("header")?.textContent?.trim()).toBe("Destination");
    });

    it("hides its drag handle from assistive technology", () => {
        const handle = (fixture.nativeElement as HTMLElement).querySelector("section > span");
        expect(handle?.getAttribute("aria-hidden")).toBe("true");
    });

    it("has a close button for pointers, which closes the sheet as a close button", () => {
        const button = getCloseButton();
        expect(button.getAttribute("aria-label")).toBe("Close");
        // Focus stays on the field, so the button isn't a Tab stop; Escape and Tab close the sheet from the keyboard.
        expect(button.getAttribute("tabindex")).toBe("-1");
        expect(button.classList).toContain("min-h-11");
        expect(button.classList).toContain("min-w-11");

        button.click();

        expect(close).toHaveBeenCalledTimes(1);
        const event = close.mock.calls[0][0] as PopupCloseEvent;
        expect(event.via).toBe(PopupCloseSource.CloseButton);
    });

    it("names its close button in the locale's language", async () => {
        TestBed.inject(MonaI18nService).use({
            direction: "ltr",
            id: "tr-TR",
            messages: { dropdowns: { close: "Kapat" } }
        });
        await stable();
        expect(getCloseButton().getAttribute("aria-label")).toBe("Kapat");
    });

    it("keeps focus where it is when pressed, except on a text box", () => {
        const sheet = fixture.nativeElement as HTMLElement;
        const press = (target: Element): boolean => {
            const event = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });
            target.dispatchEvent(event);
            return event.defaultPrevented;
        };

        expect(press(sheet.querySelector("header span") as Element)).toBe(true);
        expect(press(sheet.querySelector("[role='option']") as Element)).toBe(true);
        expect(press(getCloseButton())).toBe(true);
        expect(press(sheet.querySelector("input") as Element)).toBe(false);
    });

    it("has no axe violations", async () => {
        const results = await axe.run(fixture.nativeElement as HTMLElement, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });
});
