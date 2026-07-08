import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ListService } from "@mirei/mona-ui/internal/list";
import { DropdownGroupableDirective } from "./dropdown-groupable.directive";

describe("DropdownGroupableDirective", () => {
    let directive: DropdownGroupableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ListService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new DropdownGroupableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
