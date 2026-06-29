import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { beforeEach, describe, expect, it } from "vitest";
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

    it("opens the gradient popup without requiring a control value accessor", async () => {
        fixture.nativeElement.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(document.body.querySelector("mona-color-gradient")).not.toBeNull();
    });
});
