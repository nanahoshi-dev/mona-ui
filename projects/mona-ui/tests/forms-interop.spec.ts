import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";
import { RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";
import { RatingComponent } from "@nanahoshi/mona-ui/rating";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { describe, expect, it } from "vitest";

/**
 * None of these has a `ControlValueAccessor`. The docs say `[ngModel]` and `[formControl]` work anyway, because Angular
 * binds a control's `value` or `checked` and its `touch` directly when there's no accessor. This is what holds them to it.
 */
@Component({
    imports: [
        CheckBoxComponent,
        ColorPaletteComponent,
        FormsModule,
        OtpInputComponent,
        RadioGroupComponent,
        RatingComponent,
        ReactiveFormsModule,
        SegmentedComponent,
        SliderComponent,
        SwitchComponent
    ],
    template: `
        <mona-check-box label="Control" [formControl]="flag"></mona-check-box>
        <mona-check-box label="Model" [ngModel]="flagModel()"></mona-check-box>
        <mona-switch aria-label="Control" [formControl]="flag"></mona-switch>
        <mona-switch aria-label="Model" [ngModel]="flagModel()"></mona-switch>
        <mona-slider aria-label="Control" [formControl]="amount"></mona-slider>
        <mona-slider aria-label="Model" [ngModel]="amountModel()"></mona-slider>
        <mona-rating aria-label="Control" [formControl]="amount"></mona-rating>
        <mona-rating aria-label="Model" [ngModel]="amountModel()"></mona-rating>
        <mona-otp-input aria-label="Control" [formControl]="text"></mona-otp-input>
        <mona-otp-input aria-label="Model" [ngModel]="textModel()"></mona-otp-input>
        <mona-color-palette aria-label="Control" [formControl]="text"></mona-color-palette>
        <mona-color-palette aria-label="Model" [ngModel]="textModel()"></mona-color-palette>
        <mona-segmented aria-label="Control" [options]="options" [formControl]="text"></mona-segmented>
        <mona-segmented aria-label="Model" [options]="options" [ngModel]="textModel()"></mona-segmented>
        <mona-radio-group aria-label="Control" [formControl]="text"></mona-radio-group>
        <mona-radio-group aria-label="Model" [ngModel]="textModel()"></mona-radio-group>
    `
})
class InteropHostComponent {
    public readonly amount = new FormControl(3);
    public readonly amountModel = signal(3);
    public readonly flag = new FormControl(true);
    public readonly flagModel = signal(true);
    public readonly options = [{ label: "One", value: "12" }];
    public readonly text = new FormControl("12");
    public readonly textModel = signal("12");
}

async function settle(fixture: ComponentFixture<InteropHostComponent>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function createHost(): Promise<ComponentFixture<InteropHostComponent>> {
    const fixture = TestBed.createComponent(InteropHostComponent);
    await settle(fixture);
    return fixture;
}

describe("Form directives on controls without an accessor", () => {
    it.each([
        ["mona-check-box", CheckBoxComponent, "checked", true],
        ["mona-switch", SwitchComponent, "checked", true],
        ["mona-slider", SliderComponent, "value", 3],
        ["mona-rating", RatingComponent, "value", 3],
        ["mona-otp-input", OtpInputComponent, "value", "12"],
        ["mona-color-palette", ColorPaletteComponent, "value", "12"],
        ["mona-segmented", SegmentedComponent, "value", "12"],
        ["mona-radio-group", RadioGroupComponent, "value", "12"]
    ] as const)("hands %s its value through both", async (_selector, type, member, expected) => {
        const fixture = await createHost();
        const instances = fixture.debugElement.queryAll(By.directive(type)).map(element => element.componentInstance);

        expect(instances).toHaveLength(2);
        for (const instance of instances) {
            expect(instance[member]()).toBe(expected);
        }
    });

    it("follows a form control's later value", async () => {
        const fixture = await createHost();

        fixture.componentInstance.flag.setValue(false);
        fixture.componentInstance.amount.setValue(7);
        await settle(fixture);

        const [checkBox] = fixture.debugElement.queryAll(By.directive(CheckBoxComponent));
        const [slider] = fixture.debugElement.queryAll(By.directive(SliderComponent));
        expect(checkBox.componentInstance.checked()).toBe(false);
        expect(slider.componentInstance.value()).toBe(7);
    });

    it("reports a user's change back to the form control", async () => {
        const fixture = await createHost();
        fixture.componentInstance.flag.setValue(false);
        await settle(fixture);

        (fixture.nativeElement.querySelector("mona-switch") as HTMLElement).click();
        await settle(fixture);

        expect(fixture.componentInstance.flag.value).toBe(true);
    });

    it("marks the form control touched when the control reports it", async () => {
        const fixture = await createHost();
        expect(fixture.componentInstance.flag.touched).toBe(false);

        const [control] = fixture.debugElement.queryAll(By.directive(SwitchComponent));
        control.componentInstance.touch.emit();

        expect(fixture.componentInstance.flag.touched).toBe(true);
    });
});
