import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WindowService } from "../../services/window.service";
import {
    windowBaseThemeVariants,
    windowContentContainerThemeVariants,
    windowTitleBarThemeVariants
} from "../../styles/window.styles";
import { WindowComponent } from "./window.component";

describe("WindowComponent", () => {
    let component: WindowComponent;
    let fixture: ComponentFixture<WindowComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [WindowComponent],
            providers: [WindowService]
        });
        fixture = TestBed.createComponent(WindowComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses an overlay surface and a neutral default title bar", () => {
        const windowClasses = windowBaseThemeVariants("mona")({ rounded: "medium" }).split(/\s+/);
        const contentClasses = windowContentContainerThemeVariants("mona")({ rounded: "medium" }).split(/\s+/);
        const titleClasses = windowTitleBarThemeVariants("mona")({ look: "default", rounded: "medium" }).split(/\s+/);

        expect(windowClasses).toContain("bg-surface-overlay");
        expect(contentClasses).toContain("border-border");
        expect(contentClasses).toContain("shadow-(--shadow-overlay)");
        expect(titleClasses).toContain("bg-surface-muted");
        expect(titleClasses).toContain("border-border-subtle");
        expect(titleClasses).not.toContain("bg-secondary");
    });
});
