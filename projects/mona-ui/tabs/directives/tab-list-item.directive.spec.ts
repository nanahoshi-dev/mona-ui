import { TestBed } from "@angular/core/testing";
import { tabContentThemeVariants, tabListBaseThemeVariants, tabListListItemThemeVariants } from "../styles/tabs.styles";
import { TabListItemDirective } from "./tab-list-item.directive";

describe("TabListItemDirective", () => {
    let directive: TabListItemDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TabListItemDirective]
        });
        directive = TestBed.runInInjectionContext(() => new TabListItemDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });

    it("uses a distinct surface and boundary for the selected tab", () => {
        const classes = tabListListItemThemeVariants("mona")({
            active: true,
            disabled: false,
            rounded: "medium"
        });
        const tokens = classes.split(/\s+/);

        expect(tokens).toContain("bg-surface-raised");
        expect(tokens).toContain("font-semibold");
        expect(tokens).toContain("shadow-(--shadow-control)");
        expect(tokens).toContain("inset-ring-border-subtle");
        expect(tokens).toContain("focus-visible:ring-focus-indicator/35");
        expect(tokens).not.toContain("bg-accent");
    });

    it("uses a muted rail and a bordered elevated panel for Mona", () => {
        const railClasses = tabListBaseThemeVariants("mona")({ rounded: "medium", size: "medium" }).split(/\s+/);
        const panelClasses = tabContentThemeVariants("mona")({ rounded: "medium" }).split(/\s+/);

        expect(railClasses).toContain("bg-surface-muted");
        expect(panelClasses).toContain("bg-surface");
        expect(panelClasses).toContain("border");
        expect(panelClasses).toContain("border-border");
        expect(panelClasses).toContain("shadow-(--shadow-raised)");
    });

    it("uses a darker bordered and elevated content panel for Anna", () => {
        const panelClasses = tabContentThemeVariants("anna")({ rounded: "medium" }).split(/\s+/);

        expect(panelClasses).toContain("bg-surface-muted");
        expect(panelClasses).toContain("border");
        expect(panelClasses).toContain("border-border");
        expect(panelClasses).toContain("shadow-(--shadow-raised)");
        expect(panelClasses).not.toContain("bg-surface");
    });
});
