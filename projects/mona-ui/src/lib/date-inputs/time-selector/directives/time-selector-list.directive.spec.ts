import { TestBed } from "@angular/core/testing";
import { TimeSelectorListDirective } from "./time-selector-list.directive";

describe("TimeSelectorListDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({});
        const directive = TestBed.runInInjectionContext(() => new TimeSelectorListDirective());
        expect(directive).toBeTruthy();
    });
});
