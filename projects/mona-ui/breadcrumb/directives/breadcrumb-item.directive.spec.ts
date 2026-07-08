import { TestBed } from "@angular/core/testing";
import { describe, beforeEach, it } from "vitest";
import { ThemeService } from "../../theme/public-api";
import { BreadcrumbItemDirective } from "./breadcrumb-item.directive";

describe("BreadcrumbItemDirective", () => {
    beforeEach(() => TestBed.configureTestingModule({ providers: [ThemeService] }));

    it("should create an instance", () => {
        const directive = TestBed.runInInjectionContext(() => new BreadcrumbItemDirective());
        expect(directive).toBeTruthy();
    });
});
