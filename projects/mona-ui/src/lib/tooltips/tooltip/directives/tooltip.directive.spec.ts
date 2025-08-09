import { TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { PopupService } from "../../../popup/services/popup.service";
import { TooltipDirective } from "./tooltip.directive";

describe("TooltipDirective", () => {
    let directive: TooltipDirective;
    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [PopupService, provideNoopAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new TooltipDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
