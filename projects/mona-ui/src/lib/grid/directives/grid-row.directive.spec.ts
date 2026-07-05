import { TestBed } from "@angular/core/testing";
import { GridService } from "../services/grid.service";
import { GridRowDirective } from "./grid-row.directive";

describe("GridRowDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [GridService]
        });
        const directive = TestBed.runInInjectionContext(() => new GridRowDirective());
        expect(directive).toBeTruthy();
    });
});
