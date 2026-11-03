import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { MultiSelectService } from "../services/multi-select.service";
import { MultiSelectSummaryTagDirective } from "./multi-select-summary-tag.directive";

describe("MultiSelectSummaryTagDirective", () => {
    it("creates an instance", () => {
        TestBed.configureTestingModule({ providers: [MultiSelectService] });
        const directive = TestBed.runInInjectionContext(() => new MultiSelectSummaryTagDirective());
        expect(directive).toBeTruthy();
    });
});
