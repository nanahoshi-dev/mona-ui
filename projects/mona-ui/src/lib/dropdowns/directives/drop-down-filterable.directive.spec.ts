import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ListService } from "../../common/list/services/list.service";
import { DropDownFilterableDirective } from "./drop-down-filterable.directive";

describe("DropDownFilterableDirective", () => {
    let directive: DropDownFilterableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ListService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new DropDownFilterableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
