import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";

import { ColorPickerComponent } from "./color-picker.component";

describe("ColorPickerComponent", () => {
    let component: ColorPickerComponent;
    let fixture: ComponentFixture<ColorPickerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ColorPickerComponent, ButtonDirective, BrowserAnimationsModule],
            providers: []
        });
        fixture = TestBed.createComponent(ColorPickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
