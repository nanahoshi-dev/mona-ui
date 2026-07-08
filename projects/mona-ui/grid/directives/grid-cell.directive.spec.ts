import { TestBed } from "@angular/core/testing";
import { GridCellDirective } from "./grid-cell.directive";

describe("GridCellDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({});
        const directive = TestBed.runInInjectionContext(() => new GridCellDirective());
        expect(directive).toBeTruthy();
    });
});
