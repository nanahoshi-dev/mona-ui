import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { DropdownListComponent } from "./dropdown-list.component";

describe("DropDownListComponent", () => {
    let component: DropdownListComponent<any>;
    let fixture: ComponentFixture<DropdownListComponent<any>>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DropdownListComponent, BrowserAnimationsModule],
            providers: []
        });
        fixture = TestBed.createComponent(DropdownListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
