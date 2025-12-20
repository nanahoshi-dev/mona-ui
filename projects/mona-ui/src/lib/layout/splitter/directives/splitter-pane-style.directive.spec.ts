import { SplitterPaneStyleDirective } from "./splitter-pane-style.directive";
import { TestBed } from "@angular/core/testing";

describe("SplitterPaneStyleDirective", () => {
    let directive: SplitterPaneStyleDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SplitterPaneStyleDirective]
        });
        directive = TestBed.runInInjectionContext(() => new SplitterPaneStyleDirective());
    })
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
