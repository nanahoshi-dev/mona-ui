import { ElementRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { GridNavigationService } from "../services/grid-navigation.service";
import { GridService } from "../services/grid.service";
import { GridLogicalCellDirective } from "./grid-logical-cell.directive";

describe("GridLogicalCellDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [
                GridService,
                GridNavigationService,
                { provide: ElementRef, useValue: new ElementRef(document.createElement("td")) }
            ]
        });
        const directive = TestBed.runInInjectionContext(() => new GridLogicalCellDirective());
        expect(directive).toBeTruthy();
    });
});
