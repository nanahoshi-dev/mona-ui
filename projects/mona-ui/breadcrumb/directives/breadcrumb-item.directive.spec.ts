import { TestBed } from "@angular/core/testing";
import { describe, beforeEach, it } from "vitest";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { breadcrumbCurrentItemThemeVariants, breadcrumbListItemThemeVariants } from "../styles/breadcrumb.styles";
import { BreadcrumbItemDirective } from "./breadcrumb-item.directive";

describe("BreadcrumbItemDirective", () => {
    beforeEach(() => TestBed.configureTestingModule({ providers: [ThemeService] }));

    it("should create an instance", () => {
        const directive = TestBed.runInInjectionContext(() => new BreadcrumbItemDirective());
        expect(directive).toBeTruthy();
    });

    it("uses neutral navigation states and foreground for the current page", () => {
        const itemClasses = breadcrumbListItemThemeVariants("mona")({
            disabled: false,
            listDisabled: false
        }).split(/\s+/);
        const currentClasses = breadcrumbCurrentItemThemeVariants("mona")().split(/\s+/);

        expect(itemClasses).toContain("text-muted-foreground");
        expect(itemClasses).toContain("hover:bg-hover");
        expect(itemClasses).toContain("active:bg-active");
        expect(itemClasses).toContain("focus-visible:ring-focus-indicator/35");
        expect(itemClasses).not.toContain("text-primary/70");
        expect(currentClasses).toContain("text-foreground");
        expect(currentClasses).not.toContain("text-primary");
    });
});
