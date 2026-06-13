import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { TextBoxComponent } from "../../../../inputs/text-box/components/text-box/text-box.component";

import { DateTimePickerComponent } from "./datetime-picker.component";

describe("DateTimePickerComponent", () => {
    let component: DateTimePickerComponent;
    let fixture: ComponentFixture<DateTimePickerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerComponent, TextBoxComponent, BrowserAnimationsModule],
            providers: []
        });
        fixture = TestBed.createComponent(DateTimePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
