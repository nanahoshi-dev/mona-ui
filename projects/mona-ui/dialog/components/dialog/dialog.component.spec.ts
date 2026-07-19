import { ComponentFixture, TestBed } from "@angular/core/testing";
import { dialogBaseThemeVariants, dialogFooterThemeVariants } from "../../styles/dialog.styles";
import { DialogComponent } from "./dialog.component";

describe("DialogComponent", () => {
    let component: DialogComponent;
    let fixture: ComponentFixture<DialogComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DialogComponent],
            providers: []
        });
        fixture = TestBed.createComponent(DialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses an overlay surface with a muted footer", () => {
        const dialogClasses = dialogBaseThemeVariants({ rounded: "medium" }).split(/\s+/);
        const footerClasses = dialogFooterThemeVariants({ layout: "end", rounded: "medium" }).split(/\s+/);

        expect(dialogClasses).toContain(
            "[background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]"
        );
        expect(dialogClasses).toContain("border-border");
        expect(dialogClasses).toContain("shadow-(--shadow-overlay)");
        expect(footerClasses).toContain("bg-surface-muted");
        expect(footerClasses).toContain("border-border-subtle");
    });
});
