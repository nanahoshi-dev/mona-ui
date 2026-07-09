import { TestBed } from "@angular/core/testing";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { DropdownVirtualScrollDirective } from "./dropdown-virtual-scroll.directive";

describe("DropdownVirtualScrollDirective", () => {
    let directive: DropdownVirtualScrollDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ListService]
        });
        directive = TestBed.runInInjectionContext(() => new DropdownVirtualScrollDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
