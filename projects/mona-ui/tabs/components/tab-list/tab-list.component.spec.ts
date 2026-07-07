import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { TabListComponent } from "./tab-list.component";

describe("TabListComponent", () => {
    let component: TabListComponent;
    let fixture: ComponentFixture<TabListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TabListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TabListComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("rounded", "medium");
        fixture.componentRef.setInput("size", "medium");
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: false },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: false },
            { id: "tab3", index: 2, selected: false, title: "Tab 3", closable: true, disabled: false }
        ]);
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should navigate with ArrowRight", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const debugElement = fixture.debugElement;
        debugElement.triggerEventHandler("keydown", { key: "ArrowRight" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
    });

    it("should navigate with ArrowLeft", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const debugElement = fixture.debugElement;
        debugElement.triggerEventHandler("keydown", { key: "ArrowLeft" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    });

    it("should navigate with Home", () => {
        fixture.componentRef.setInput("selectedTabId", "tab2");
        fixture.detectChanges();

        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const debugElement = fixture.debugElement;
        debugElement.triggerEventHandler("keydown", { key: "Home" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });

    it("should navigate with End", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const debugElement = fixture.debugElement;
        debugElement.triggerEventHandler("keydown", { key: "End" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    });

    it("should emit close event with Delete", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabClose, "emit");
        const debugElement = fixture.debugElement;
        debugElement.triggerEventHandler("keydown", { key: "Delete" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });

    it("should focus panel on Tab", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const debugElement = fixture.debugElement;
        const preventDefaultSpy = vi.fn();

        // Mock document.getElementById
        const focusSpy = vi.fn();
        const getElementByIdSpy = vi.spyOn(document, "getElementById").mockReturnValue({ focus: focusSpy } as any);

        debugElement.triggerEventHandler("keydown", {
            key: "Tab",
            preventDefault: preventDefaultSpy,
            shiftKey: false
        });

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(getElementByIdSpy).toHaveBeenCalledWith("tab1-panel");
        expect(focusSpy).toHaveBeenCalled();

        getElementByIdSpy.mockRestore();
    });

    it("should allow default behavior on Shift+Tab", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const debugElement = fixture.debugElement;
        const preventDefaultSpy = vi.fn();

        debugElement.triggerEventHandler("keydown", {
            key: "Tab",
            preventDefault: preventDefaultSpy,
            shiftKey: true
        });

        expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it("should render tab id and aria-controls with -tab/-panel suffixes", () => {
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const tabElement: HTMLElement = fixture.debugElement.query(By.css("li[data-tab-id='tab1']")).nativeElement;
        expect(tabElement.id).toBe("tab1-tab");
        expect(tabElement.getAttribute("aria-controls")).toBe("tab1-panel");
    });

    it("should skip disabled tabs with ArrowRight", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: false },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: true },
            { id: "tab3", index: 2, selected: false, title: "Tab 3", closable: true, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowRight" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    });

    it("should skip disabled tabs with ArrowLeft", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: false, title: "Tab 1", closable: true, disabled: false },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: true },
            { id: "tab3", index: 2, selected: true, title: "Tab 3", closable: true, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab3");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowLeft" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });

    it("should skip a disabled tab at Home", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: false, title: "Tab 1", closable: true, disabled: true },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: false },
            { id: "tab3", index: 2, selected: true, title: "Tab 3", closable: true, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab3");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "Home" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
    });

    it("should skip a disabled tab at End", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: false },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: false },
            { id: "tab3", index: 2, selected: false, title: "Tab 3", closable: true, disabled: true }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "End" });
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
    });

    it("should not close a disabled tab with Delete", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: true },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabClose, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "Delete" });
        fixture.detectChanges();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should not emit any selection when every tab is disabled", () => {
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: true, disabled: true },
            { id: "tab2", index: 1, selected: false, title: "Tab 2", closable: true, disabled: true }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowRight" });
        fixture.debugElement.triggerEventHandler("keydown", { key: "Home" });
        fixture.debugElement.triggerEventHandler("keydown", { key: "End" });
        fixture.detectChanges();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should no-op keyboard navigation when the list-wide disabled input is set", () => {
        fixture.componentRef.setInput("disabled", true);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        fixture.debugElement.triggerEventHandler("keydown", { key: "ArrowRight" });
        fixture.detectChanges();
        expect(emitSpy).not.toHaveBeenCalled();

        const tabElement: HTMLElement = fixture.debugElement.query(By.css("li[data-tab-id='tab1']")).nativeElement;
        expect(tabElement.getAttribute("aria-disabled")).toBe("true");
    });

    it("should show the close button when closable is true regardless of per-tab closable value", () => {
        fixture.componentRef.setInput("closable", true);
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: true, title: "Tab 1", closable: false, disabled: false }
        ]);
        fixture.componentRef.setInput("selectedTabId", "tab1");
        fixture.detectChanges();

        const closeButton = fixture.debugElement.query(By.css("li[data-tab-id='tab1'] button"));
        expect(closeButton).toBeTruthy();
    });
});
