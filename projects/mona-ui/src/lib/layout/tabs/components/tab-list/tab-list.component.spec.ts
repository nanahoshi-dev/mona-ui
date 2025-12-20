import { ComponentFixture, TestBed } from "@angular/core/testing";

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
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const host = fixture.debugElement.nativeElement;
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
    });

    it("should navigate with ArrowLeft", () => {
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const host = fixture.debugElement.nativeElement;
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    });

    it("should navigate with Home", () => {
        // First select middle to test Home properly
        fixture.componentRef.setInput("tabList", [
            { id: "tab1", index: 0, selected: false, title: "Tab 1", closable: true, disabled: false },
            { id: "tab2", index: 1, selected: true, title: "Tab 2", closable: true, disabled: false },
            { id: "tab3", index: 2, selected: false, title: "Tab 3", closable: true, disabled: false }
        ]);
        fixture.detectChanges();

        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const host = fixture.debugElement.nativeElement;
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });

    it("should navigate with End", () => {
        const emitSpy = vi.spyOn(component.tabSelect, "emit");
        const host = fixture.debugElement.nativeElement;
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    });

    it("should emit close event with Delete", () => {
        const emitSpy = vi.spyOn(component.tabClose, "emit");
        const host = fixture.debugElement.nativeElement;
        host.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
        fixture.detectChanges();
        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });
});
