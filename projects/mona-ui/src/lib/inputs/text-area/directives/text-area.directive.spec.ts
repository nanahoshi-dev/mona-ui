import { TestBed } from "@angular/core/testing";
import { ThemeService } from "mona-ui";
import { TextAreaDirective } from "./text-area.directive";

describe("TextAreaDirective", () => {
    let directive: TextAreaDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ThemeService]
        });
        directive = TestBed.runInInjectionContext(() => new TextAreaDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
