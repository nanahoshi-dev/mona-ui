import { TestBed } from "@angular/core/testing";
import { MonthDayDirective } from "./month-day.directive";

describe("MonthViewDayDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({});
        const directive = TestBed.runInInjectionContext(() => new MonthDayDirective());
        expect(directive).toBeTruthy();
    });
});
