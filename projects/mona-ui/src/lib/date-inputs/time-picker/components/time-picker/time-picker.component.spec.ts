import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { TextBoxComponent } from "../../../../inputs/text-box/components/text-box/text-box.component";
import { TimeSelectorComponent } from "../../../time-selector/components/time-selector/time-selector.component";

import { TimePickerComponent } from "./time-picker.component";

describe("TimePickerComponent", () => {
    let component: TimePickerComponent;
    let fixture: ComponentFixture<TimePickerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TimePickerComponent, TimeSelectorComponent, TextBoxComponent, BrowserAnimationsModule],
            providers: []
        });
        fixture = TestBed.createComponent(TimePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
