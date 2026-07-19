import { TestBed } from "@angular/core/testing";
import { annaTheme } from "../../theme/definitions/anna-theme";
import { monaTheme } from "../../theme/definitions/mona-theme";
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
        const classes = tabListListItemThemeVariants({
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

    it("uses a muted rail and a token-driven bordered panel", () => {
        const railClasses = tabListBaseThemeVariants({ rounded: "medium", size: "medium" }).split(/\s+/);
        const panelClasses = tabContentThemeVariants({ rounded: "medium" }).split(/\s+/);

        expect(railClasses).toContain("bg-surface-muted");
        expect(panelClasses).toContain("bg-(--mona-tab-content-background)");
        expect(panelClasses).toContain("border");
        expect(panelClasses).toContain("border-border");
        expect(panelClasses).toContain("shadow-(--shadow-raised)");
    });

    it("keeps Mona and Anna tab backgrounds in their independent profiles", () => {
        expect(monaTheme.variants.dark.components["--mona-tab-content-background"]).toBe("var(--color-surface)");
        expect(annaTheme.variants.dark.components["--mona-tab-content-background"]).toBe("transparent");
    });
});
