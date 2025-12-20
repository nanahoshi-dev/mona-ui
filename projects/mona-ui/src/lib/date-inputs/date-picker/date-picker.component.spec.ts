import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { PopupAnimationService } from "../../animations/services/popup-animation.service";
import { TextBoxComponent } from "../../inputs/text-box/components/text-box/text-box.component";
import { ContextMenuComponent } from "../../menus/contextmenu/components/contextmenu/context-menu.component";

import { DatePickerComponent } from "./date-picker.component";

describe("DatePickerComponent", () => {
    let component: DatePickerComponent;
    let fixture: ComponentFixture<DatePickerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DatePickerComponent, TextBoxComponent, ContextMenuComponent],
            providers: [PopupAnimationService, provideNoopAnimations()]
        });
        fixture = TestBed.createComponent(DatePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
