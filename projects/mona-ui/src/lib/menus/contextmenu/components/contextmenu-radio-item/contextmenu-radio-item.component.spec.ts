import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ContextMenuRadioItemComponent } from "./contextmenu-radio-item.component";

describe("ContextmenuRadioItemComponent", () => {
    let component: ContextMenuRadioItemComponent;
    let fixture: ComponentFixture<ContextMenuRadioItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuRadioItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuRadioItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});

@Component({
    selector: "mona-test-contextmenu-radio-item-host",
    imports: [ContextMenuRadioItemComponent],
    template: ` <mona-contextmenu-radio-item label="Ascending" value="asc"></mona-contextmenu-radio-item> `
})
class ContextMenuRadioItemHostComponent {
    public readonly item = viewChild.required(ContextMenuRadioItemComponent);
}

describe("ContextMenuRadioItemComponent.getPopupMenuItem()", () => {
    let fixture: ComponentFixture<ContextMenuRadioItemHostComponent>;
    let host: ContextMenuRadioItemHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuRadioItemHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuRadioItemHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("returns a radio item with the label, value, and radio flag", () => {
        const [item] = host.item().getPopupMenuItem();

        expect(item.label).toBe("Ascending");
        expect(item.radio).toBe(true);
        expect(item.value?.()).toBe("asc");
        expect(item.disabled).toBe(false);
    });
});
