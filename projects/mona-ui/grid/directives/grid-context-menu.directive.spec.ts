import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { GridService } from "../services/grid.service";
import { GridContextMenuDirective } from "./grid-context-menu.directive";

describe("GridContextMenuDirective", () => {
    let directive: GridContextMenuDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GridService, provideAnimations()]
        });
        directive = TestBed.runInInjectionContext(() => new GridContextMenuDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
