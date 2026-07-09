import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { DropdownDataInputToken } from "../models/DropdownDataInput";
import { DropdownDataHandlerDirective } from "./dropdown-data-handler.directive";

describe("DropdownDataHandlerDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [
                ListService,
                {
                    provide: DropdownDataInputToken,
                    useValue: {
                        data: signal([]),
                        itemDisabled: signal(""),
                        textField: signal(""),
                        valueField: signal("")
                    }
                }
            ]
        });
        const directive = TestBed.runInInjectionContext(() => new DropdownDataHandlerDirective());
        expect(directive).toBeTruthy();
    });
});
