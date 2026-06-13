import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { TextBoxDirective } from "../../../../inputs/text-box/directives/text-box.directive";

import { ComboBoxComponent } from "./combo-box.component";

describe("ComboBoxComponent", () => {
    let component: ComboBoxComponent<any>;
    let fixture: ComponentFixture<ComboBoxComponent<any>>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ComboBoxComponent, ButtonDirective, TextBoxDirective, BrowserAnimationsModule],
            providers: []
        });
        fixture = TestBed.createComponent(ComboBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
