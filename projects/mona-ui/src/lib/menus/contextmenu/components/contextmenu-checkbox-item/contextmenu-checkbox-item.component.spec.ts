import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextMenuCheckboxItemComponent } from "./contextmenu-checkbox-item.component";

describe("ContextmenuCheckboxItemComponent", () => {
    let component: ContextMenuCheckboxItemComponent;
    let fixture: ComponentFixture<ContextMenuCheckboxItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuCheckboxItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuCheckboxItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});

@Component({
    selector: "mona-test-contextmenu-checkbox-item-host",
    imports: [ContextMenuCheckboxItemComponent],
    template: ` <mona-contextmenu-checkbox-item label="Preview Pane" [checked]="true"></mona-contextmenu-checkbox-item> `
})
class ContextMenuCheckboxItemHostComponent {
    public readonly item = viewChild.required(ContextMenuCheckboxItemComponent);
}

describe("ContextMenuCheckboxItemComponent.getPopupMenuItem()", () => {
    let fixture: ComponentFixture<ContextMenuCheckboxItemHostComponent>;
    let host: ContextMenuCheckboxItemHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuCheckboxItemHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuCheckboxItemHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("returns a checkable item that reflects the checked input", () => {
        const [item] = host.item().getPopupMenuItem();

        expect(item.label).toBe("Preview Pane");
        expect(item.checkable).toBe(true);
        expect(item.checked?.()).toBe(true);
        expect(item.disabled).toBe(false);
        expect(item.items.length).toBe(0);
    });
});
