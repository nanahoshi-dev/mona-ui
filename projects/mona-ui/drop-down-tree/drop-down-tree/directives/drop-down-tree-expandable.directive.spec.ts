import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TreeService } from "@mirei/mona-ui/tree";
import { DropDownTreeExpandableDirective } from "./drop-down-tree-expandable.directive";

describe("DropDownTreeExpandableDirective", () => {
    let directive: DropDownTreeExpandableDirective<any>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new DropDownTreeExpandableDirective());
    });

    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
