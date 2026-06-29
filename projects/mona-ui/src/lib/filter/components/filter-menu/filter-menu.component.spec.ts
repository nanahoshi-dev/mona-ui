import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DropdownListComponent } from "../../../dropdowns/drop-down-list/components/dropdown-list/dropdown-list.component";
import { TextBoxComponent } from "../../../inputs/text-box/components/text-box/text-box.component";
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
});
