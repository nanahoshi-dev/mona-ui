import { Component, inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { type PopupRef } from "@nanahoshi/mona-ui/popup";
import { describe, expect, it } from "vitest";
import { DropdownService } from "../services/dropdown.service";
import { DropdownLiveRegionDirective } from "./dropdown-live-region.directive";

@Component({
    template: `<span monaDropdownLiveRegion></span>`,
    imports: [DropdownLiveRegionDirective],
    providers: [DropdownService, ListService]
})
class TestHostComponent {
    public readonly dropdownService = inject(DropdownService);
    public readonly listService = inject(ListService);
}

describe("DropdownLiveRegionDirective", () => {
    it("announces default English no results found when list is empty", async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();

        const span = fixture.nativeElement.querySelector("span");
        expect(span.getAttribute("aria-label")).toBe("No results found");
        expect(span.textContent).toBe("No results found");
    });

    it("announces result counts in default English", async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.componentInstance.listService.setData(["Apple"]);
        fixture.detectChanges();

        const span = fixture.nativeElement.querySelector("span");
        expect(span.textContent).toBe("1 result available");

        fixture.componentInstance.listService.setData(["Apple", "Banana", "Cherry"]);
        fixture.detectChanges();
        expect(span.textContent).toBe("3 results available");
    });

    it("announces active item position when expanded", async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.componentInstance.listService.setData(["Apple", "Banana", "Cherry"]);
        fixture.componentInstance.dropdownService.popupRef.set({} as PopupRef);
        fixture.detectChanges();

        const firstItem = fixture.componentInstance.listService.viewItems().first();
        fixture.componentInstance.listService.highlightedItem.set(firstItem);
        fixture.detectChanges();

        const span = fixture.nativeElement.querySelector("span");
        expect(span.textContent).toBe("Apple, 1 of 3");
    });

    it("updates announcements dynamically when locale changes", async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        const fixture = TestBed.createComponent(TestHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({
            direction: "ltr",
            id: "tr-TR",
            messages: {
                dropdowns: {
                    itemPosition: (text, position, total) => `${text}, ${total} içinden ${position}`,
                    noResultsFound: "Sonuç bulunamadı",
                    resultsAvailable: count => `${count} sonuç mevcut`
                }
            }
        });
        fixture.detectChanges();

        const span = fixture.nativeElement.querySelector("span");
        expect(span.textContent).toBe("Sonuç bulunamadı");

        fixture.componentInstance.listService.setData(["Elma", "Armut"]);
        fixture.detectChanges();
        expect(span.textContent).toBe("2 sonuç mevcut");

        fixture.componentInstance.dropdownService.popupRef.set({} as PopupRef);
        const firstItem = fixture.componentInstance.listService.viewItems().first();
        fixture.componentInstance.listService.highlightedItem.set(firstItem);
        fixture.detectChanges();
        expect(span.textContent).toBe("Elma, 2 içinden 1");
    });
});
