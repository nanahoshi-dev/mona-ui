import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ListService } from "@mirei/mona-ui/list";
import { DropDownGroupableDirective } from "./drop-down-groupable.directive";

describe("DropDownGroupableDirective", () => {
    let directive: DropDownGroupableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ListService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new DropDownGroupableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
