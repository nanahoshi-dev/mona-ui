import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ListService } from "@mirei/mona-ui/internal/list";
import { DropdownVirtualScrollDirective } from "./dropdown-virtual-scroll.directive";

describe("DropdownVirtualScrollDirective", () => {
    let directive: DropdownVirtualScrollDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ListService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new DropdownVirtualScrollDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
