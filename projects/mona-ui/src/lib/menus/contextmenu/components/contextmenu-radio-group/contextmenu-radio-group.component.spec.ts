import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextMenuRadioGroupComponent } from "./contextmenu-radio-group.component";
import { ContextMenuRadioItemComponent } from "../contextmenu-radio-item/contextmenu-radio-item.component";

describe("ContextmenuRadioGroupComponent", () => {
    let component: ContextMenuRadioGroupComponent;
    let fixture: ComponentFixture<ContextMenuRadioGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuRadioGroupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuRadioGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});

@Component({
    selector: "mona-test-contextmenu-radio-group-host",
    imports: [ContextMenuRadioGroupComponent, ContextMenuRadioItemComponent],
    template: `
        <mona-contextmenu-radio-group value="asc">
            <mona-contextmenu-radio-item label="Ascending" value="asc"></mona-contextmenu-radio-item>
            <mona-contextmenu-radio-item label="Descending" value="desc"></mona-contextmenu-radio-item>
        </mona-contextmenu-radio-group>
    `
})
class ContextMenuRadioGroupHostComponent {
    public readonly group = viewChild.required(ContextMenuRadioGroupComponent);
}

describe("ContextMenuRadioGroupComponent.getPopupMenuItem()", () => {
    let fixture: ComponentFixture<ContextMenuRadioGroupHostComponent>;
    let host: ContextMenuRadioGroupHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuRadioGroupHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuRadioGroupHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("marks only the item matching the group's value as selected", () => {
        const items = host.group().getPopupMenuItem();

        expect(items.length).toBe(2);
        const ascending = items.find(i => i.label === "Ascending")!;
        const descending = items.find(i => i.label === "Descending")!;
        expect(ascending.selected?.()).toBe(true);
        expect(descending.selected?.()).toBe(false);
        expect(ascending.radio).toBe(true);
    });
});
