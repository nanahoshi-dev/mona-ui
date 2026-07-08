import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextMenuGroupComponent } from "./context-menu-group.component";
import { ContextMenuItemComponent } from "../contextmenu-item/context-menu-item.component";

describe("ContextMenuGroupComponent", () => {
    let component: ContextMenuGroupComponent;
    let fixture: ComponentFixture<ContextMenuGroupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuGroupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});

@Component({
    selector: "mona-test-contextmenu-group-host",
    imports: [ContextMenuGroupComponent, ContextMenuItemComponent],
    template: `
        <mona-contextmenu-group title="System Actions">
            <mona-contextmenu-item label="Share"></mona-contextmenu-item>
            <mona-contextmenu-item label="Properties"></mona-contextmenu-item>
        </mona-contextmenu-group>
    `
})
class ContextMenuGroupHostComponent {
    public readonly group = viewChild.required(ContextMenuGroupComponent);
}

describe("ContextMenuGroupComponent.getPopupMenuItem()", () => {
    let fixture: ComponentFixture<ContextMenuGroupHostComponent>;
    let host: ContextMenuGroupHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuGroupHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuGroupHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("tags each projected item with the group's title", () => {
        const items = host.group().getPopupMenuItem();

        expect(items.length).toBe(2);
        expect(items.every(i => i.group === "System Actions")).toBe(true);
        expect(items.map(i => i.label)).toEqual(["Share", "Properties"]);
    });
});
