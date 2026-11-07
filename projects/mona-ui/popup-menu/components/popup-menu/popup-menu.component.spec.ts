import { Component, DOCUMENT } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { popupMenuContainerThemeVariants } from "../../styles/popup-menu.styles";
import { PopupMenuComponent } from "./popup-menu.component";

@Component({
    template: `<button #target type="button">Open</button>
        <mona-popup-menu aria-label="File actions" aria-labelledby="other" [target]="target"></mona-popup-menu>`,
    imports: [PopupMenuComponent]
})
class NamedPopupMenuHostComponent {}

describe("PopupMenuComponent", () => {
    let component: PopupMenuComponent;
    let fixture: ComponentFixture<PopupMenuComponent>;
    let document: Document;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PopupMenuComponent],
            providers: []
        }).compileComponents();

        fixture = TestBed.createComponent(PopupMenuComponent);
        component = fixture.componentInstance;
        document = TestBed.inject(DOCUMENT);
        fixture.componentRef.setInput("target", document);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses the overlay surface, quiet border, and floating shadow", () => {
        const classes = popupMenuContainerThemeVariants({ rounded: "medium" }).split(/\s+/);

        expect(classes).toContain(
            "[background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]"
        );
        expect(classes).toContain("border-border");
        expect(classes).toContain("shadow-(--shadow-overlay)");
        expect(classes).not.toContain(
            "[background-color:var(--mona-effect-raised-background-color,var(--color-surface-raised))]"
        );
    });

    it("keeps the menu's name off its host, which has no role to carry it", () => {
        const host = TestBed.createComponent(NamedPopupMenuHostComponent);
        host.detectChanges();
        const menu = host.nativeElement.querySelector("mona-popup-menu") as HTMLElement;

        expect(menu.hasAttribute("aria-label")).toBe(false);
        expect(menu.hasAttribute("aria-labelledby")).toBe(false);
    });
});
