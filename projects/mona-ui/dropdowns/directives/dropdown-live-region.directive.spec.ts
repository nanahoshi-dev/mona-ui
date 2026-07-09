import { ElementRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { DropdownService } from "../services/dropdown.service";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { DropdownLiveRegionDirective } from "./dropdown-live-region.directive";

describe("DropdownLiveRegionDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [
                DropdownService,
                ListService,
                { provide: ElementRef, useValue: new ElementRef(document.createElement("span")) }
            ]
        });
        const directive = TestBed.runInInjectionContext(() => new DropdownLiveRegionDirective());
        expect(directive).toBeTruthy();
    });
});
