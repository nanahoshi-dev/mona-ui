import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { PopupAnimationService } from "../../../animations/services/popup-animation.service";
import { DropdownListComponent } from "../../../dropdowns/drop-down-list/components/dropdown-list/dropdown-list.component";
import { TextBoxComponent } from "../../../inputs/text-box/components/text-box/text-box.component";

import { FilterMenuComponent } from "./filter-menu.component";

describe("FilterMenuComponent", () => {
    let component: FilterMenuComponent;
    let fixture: ComponentFixture<FilterMenuComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [FilterMenuComponent, TextBoxComponent, DropdownListComponent, BrowserAnimationsModule],
            providers: [PopupAnimationService]
        });
        fixture = TestBed.createComponent(FilterMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
