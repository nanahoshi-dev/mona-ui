import { TestBed } from "@angular/core/testing";
import { ThemeService } from "@mirei/mona-ui/theme";
import { CheckboxDirective } from "./checkbox.directive";

describe("CheckboxDirective", () => {
    let directive: CheckboxDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ThemeService]
        });
        directive = TestBed.runInInjectionContext(() => new CheckboxDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
