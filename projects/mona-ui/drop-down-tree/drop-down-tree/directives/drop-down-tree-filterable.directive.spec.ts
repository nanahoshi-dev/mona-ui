import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { FilterChangeEvent } from "@mirei/mona-ui/filter-input";
import { TreeService } from "@mirei/mona-ui/tree";
import { DropDownTreeFilterableDirective } from "./drop-down-tree-filterable.directive";

describe("DropDownTreeFilterableDirective", () => {
    let directive: DropDownTreeFilterableDirective<any>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new DropDownTreeFilterableDirective());
    });

    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
