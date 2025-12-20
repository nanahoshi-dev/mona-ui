import { TestBed } from "@angular/core/testing";
import { ThemeService } from "../../../theme/services/theme.service";
import { TextBoxDirective } from "./text-box.directive";

describe("TextBoxDirective", () => {
    let directive: TextBoxDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ThemeService]
        });
        directive = TestBed.runInInjectionContext(() => new TextBoxDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
