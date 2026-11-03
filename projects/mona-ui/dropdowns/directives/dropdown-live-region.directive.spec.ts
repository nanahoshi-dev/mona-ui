import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { type PopupRef } from "@nanahoshi/mona-ui/popup";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownService } from "../services/dropdown.service";
import { DropdownLiveRegionDirective } from "./dropdown-live-region.directive";

@Component({
    template: `<div monaDropdownLiveRegion></div>`,
    imports: [DropdownLiveRegionDirective],
    providers: [DropdownService, ListService]
})
class TestHostComponent {
    public readonly dropdownService = inject(DropdownService);
    public readonly listService = inject(ListService<string>);
}

describe("DropdownLiveRegionDirective", () => {
    let announce: ReturnType<typeof vi.fn>;
    let fixture: ComponentFixture<TestHostComponent>;

    const openPopup = (): void => {
        fixture.componentInstance.dropdownService.popupRef.set({} as PopupRef);
        fixture.detectChanges();
    };

    beforeEach(async () => {
        announce = vi.fn(() => Promise.resolve());
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [{ provide: LiveAnnouncer, useValue: { announce } }]
        }).compileComponents();
        fixture = TestBed.createComponent(TestHostComponent);
        fixture.componentInstance.listService.setData(["Apple", "Apricot", "Banana"]);
        fixture.detectChanges();
    });

    it("renders nothing inside the element it sits on", () => {
        const host = fixture.nativeElement.querySelector("div") as HTMLElement;
        expect(host.textContent).toBe("");
        expect(host.getAttribute("aria-live")).toBeNull();
        expect(host.getAttribute("aria-label")).toBeNull();
    });

    it("stays quiet while the popup is closed", () => {
        fixture.componentInstance.listService.setFilter("ap");
        fixture.componentInstance.listService.setData(["Apple"]);
        fixture.detectChanges();
        expect(announce).not.toHaveBeenCalled();
    });

    it("stays quiet when the popup opens on an unfiltered list", () => {
        openPopup();
        expect(announce).not.toHaveBeenCalled();
    });

    it("doesn't announce the highlighted option", () => {
        openPopup();
        const listService = fixture.componentInstance.listService;
        listService.highlightedItem.set(listService.viewItems().first());
        fixture.detectChanges();
        expect(announce).not.toHaveBeenCalled();
    });

    it("announces the result count after filtering", () => {
        openPopup();
        fixture.componentInstance.listService.setFilter("b");
        fixture.detectChanges();
        expect(announce).toHaveBeenLastCalledWith("1 result available", "polite");

        fixture.componentInstance.listService.setFilter("z");
        fixture.detectChanges();
        expect(announce).toHaveBeenLastCalledWith("No results found", "polite");

        fixture.componentInstance.listService.clearFilter();
        fixture.detectChanges();
        expect(announce).toHaveBeenLastCalledWith("3 results available", "polite");
        expect(announce).toHaveBeenCalledTimes(3);
    });

    it("announces when the text that opened the popup already filtered the list", () => {
        fixture.componentInstance.listService.setFilter("ap");
        openPopup();
        expect(announce).toHaveBeenCalledExactlyOnceWith("2 results available", "polite");
    });

    it("announces when the items change while the popup is open, as with server-side filtering", () => {
        openPopup();
        fixture.componentInstance.listService.setData(["Apple", "Banana"]);
        fixture.detectChanges();
        expect(announce).toHaveBeenCalledExactlyOnceWith("2 results available", "polite");
    });

    it("uses the active locale's messages", () => {
        TestBed.inject(MonaI18nService).use({
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
        openPopup();
        fixture.componentInstance.listService.setFilter("ap");
        fixture.detectChanges();
        expect(announce).toHaveBeenLastCalledWith("2 sonuç mevcut", "polite");
    });
});
