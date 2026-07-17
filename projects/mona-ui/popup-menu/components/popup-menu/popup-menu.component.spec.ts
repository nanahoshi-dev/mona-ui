import { DOCUMENT } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { popupMenuContainerVariants } from "../../styles/popup-menu.mona.styles";
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

    it("uses the raised surface and quiet default border", () => {
        const classes = popupMenuContainerVariants({ rounded: "medium" });

        expect(classes).toContain("bg-surface-raised");
        expect(classes).toContain("border-border");
    });
});
