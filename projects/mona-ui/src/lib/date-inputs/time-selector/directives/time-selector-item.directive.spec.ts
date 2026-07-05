import { ElementRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { TimeSelectorItemDirective } from "./time-selector-item.directive";

describe("TimeSelectorItemDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [{ provide: ElementRef, useValue: new ElementRef(document.createElement("li")) }]
        });
        const directive = TestBed.runInInjectionContext(() => new TimeSelectorItemDirective());
        expect(directive).toBeTruthy();
    });
});
