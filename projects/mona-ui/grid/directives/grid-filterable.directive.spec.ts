import { TestBed } from "@angular/core/testing";
import { GridService } from "../services/grid.service";
import { GridFilterableDirective } from "./grid-filterable.directive";

describe("GridFilterableDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [GridService]
        });
        const directive = TestBed.runInInjectionContext(() => new GridFilterableDirective());
        expect(directive).toBeTruthy();
    });
});
