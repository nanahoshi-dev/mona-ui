import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ListService } from "@mirei/mona-ui/internal/list";
import { DropdownFilterableDirective } from "./dropdown-filterable.directive";

describe("DropdownFilterableDirective", () => {
    let directive: DropdownFilterableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ListService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new DropdownFilterableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
