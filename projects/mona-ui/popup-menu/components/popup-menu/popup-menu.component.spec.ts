import { DOCUMENT } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { popupMenuContainerThemeVariants } from "../../styles/popup-menu.styles";
import { PopupMenuComponent } from "./popup-menu.component";

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

        expect(classes).toContain("bg-surface-overlay");
        expect(classes).toContain("border-border");
        expect(classes).toContain("shadow-(--shadow-overlay)");
        expect(classes).not.toContain("bg-surface-raised");
    });
});
