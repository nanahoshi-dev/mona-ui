import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DropdownListComponent } from "../../../dropdowns/drop-down-list/components/dropdown-list/dropdown-list.component";
import { TextBoxComponent } from "../../../inputs/text-box/components/text-box/text-box.component";
import type { FilterMenuDateOptions } from "../../models/FilterMenuDateOptions";
import { FilterService } from "../../services/filter.service";

import { FilterMenuComponent } from "./filter-menu.component";

describe("FilterMenuComponent", () => {
    let component: FilterMenuComponent;
    let fixture: ComponentFixture<FilterMenuComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [FilterMenuComponent, TextBoxComponent, DropdownListComponent],
            providers: [FilterService]
        });
        fixture = TestBed.createComponent(FilterMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses the datetime default format when date options do not match the current type", () => {
        component.type.set("datetime");
        fixture.detectChanges();

        expect(readEffectiveDateOptions()).toEqual({
            format: "dd/MM/yyyy HH:mm",
            type: "datetime"
        });
    });

    it("uses the time default format when date options do not match the current type", () => {
        component.type.set("time");
        fixture.detectChanges();

        expect(readEffectiveDateOptions()).toEqual({
            format: "HH:mm",
            type: "time"
        });
    });

    function readEffectiveDateOptions(): FilterMenuDateOptions {
        type EffectiveDateOptionsReader = { effectiveDateOptions(): FilterMenuDateOptions };
        return (component as unknown as EffectiveDateOptionsReader).effectiveDateOptions();
    }
});
