import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextMenuItemComponent } from "./context-menu-item.component";

describe("ContextMenuItemComponent", () => {
    let component: ContextMenuItemComponent;
    let fixture: ComponentFixture<ContextMenuItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});

@Component({
    selector: "mona-test-contextmenu-item-host",
    imports: [ContextMenuItemComponent],
    template: `
        <mona-contextmenu-item label="Parent" [disabled]="true">
            <mona-contextmenu-item label="Child"></mona-contextmenu-item>
        </mona-contextmenu-item>
    `
})
class ContextMenuItemHostComponent {
    public readonly parent = viewChild.required(ContextMenuItemComponent);
}

describe("ContextMenuItemComponent.getPopupMenuItem()", () => {
    let fixture: ComponentFixture<ContextMenuItemHostComponent>;
    let host: ContextMenuItemHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuItemHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuItemHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("returns a single item with the label, disabled state, and nested child item", () => {
        const [item] = host.parent().getPopupMenuItem();

        expect(item.label).toBe("Parent");
        expect(item.disabled).toBe(true);
        expect(item.items.length).toBe(1);
        expect(item.items[0].label).toBe("Child");
        expect(item.items[0].disabled).toBe(false);
        expect(item.uid).toBeTruthy();
    });
});
