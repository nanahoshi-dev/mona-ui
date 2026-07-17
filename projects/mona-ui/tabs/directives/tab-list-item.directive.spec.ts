import { TestBed } from "@angular/core/testing";
import { tabListListItemThemeVariants } from "../styles/tabs.styles";
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

        expect(classes).toContain("bg-surface");
        expect(classes).toContain("font-semibold");
        expect(classes).toContain("shadow-sm");
        expect(classes).toContain("inset-ring-border-subtle");
    });
});
