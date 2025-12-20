import { TestBed } from "@angular/core/testing";
import { ScrollViewActivePageDirective } from "./scroll-view-active-page.directive";

describe("ScrollViewActivePageDirective", () => {
    let directive: ScrollViewActivePageDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ScrollViewActivePageDirective]
        });
        directive = TestBed.runInInjectionContext(() => new ScrollViewActivePageDirective());
    })
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
