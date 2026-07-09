import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
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
