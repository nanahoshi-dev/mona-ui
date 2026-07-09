import { TestBed } from "@angular/core/testing";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { RadioButtonDirective } from "./radio-button.directive";

describe("RadioButtonDirective", () => {
    let directive: RadioButtonDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ThemeService]
        });
        directive = TestBed.runInInjectionContext(() => new RadioButtonDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
