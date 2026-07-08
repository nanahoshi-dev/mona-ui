import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TreeService } from "@mirei/mona-ui/tree";
import { DropDownTreeDisableDirective } from "./drop-down-tree-disable.directive";

describe("DropDownTreeDisableDirective", () => {
    let directive: DropDownTreeDisableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new DropDownTreeDisableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
