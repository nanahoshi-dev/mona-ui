import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ListService } from "../../common/list/services/list.service";
import { DropDownVirtualScrollDirective } from "./drop-down-virtual-scroll.directive";

describe("DropDownVirtualScrollDirective", () => {
    let directive: DropDownVirtualScrollDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ListService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new DropDownVirtualScrollDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
