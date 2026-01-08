import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonDirective, RadioButtonComponent, RadioButtonDirective } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-radio-button-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./radio-button-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioButtonDemoComponent extends AbstractDemoComponent<RadioButtonComponent> {
    protected readonly RadioButtonWrapperComponent = RadioButtonWrapperComponent;
    protected readonly config = signal<ComponentConfig<RadioButtonComponent>>({
        code: `
            <div class="flex gap-4">
                <mona-radio-button
                    [disabled]="disabled()"
                    [labelPosition]="labelPosition()"
                    [labelSize]="labelSize()"
                    [label]="label()"
                    [name]="name()"
                    [rounded]="rounded()"
                    [value]="value()"
                    (inputBlur)="onInputBlur($event)"
                    (inputClick)="onInputClick($event)"
                    (inputFocus)="onInputFocus($event)"
                    [ngModel]="selectedSeason()"
                    (ngModelChange)="selectedSeason.set($event)">
                    <span class="text-yellow-900">Autumn</span>
                </mona-radio-button>
                <mona-radio-button
                    [disabled]="disabled()"
                    [labelPosition]="labelPosition()"
                    [labelSize]="labelSize()"
                    label="Winter"
                    [name]="name()"
                    [rounded]="rounded()"
                    value="Winter"
                    (inputBlur)="onInputBlur($event)"
                    (inputClick)="onInputClick($event)"
                    (inputFocus)="onInputFocus($event)"
                    [ngModel]="selectedSeason()"
                    (ngModelChange)="selectedSeason.set($event)">
                </mona-radio-button>
                <mona-radio-button
                    [disabled]="true"
                    [labelPosition]="labelPosition()"
                    [labelSize]="labelSize()"
                    label="Spring"
                    [name]="name()"
                    [rounded]="rounded()"
                    value="Spring"
                    (inputBlur)="onInputBlur($event)"
                    (inputClick)="onInputClick($event)"
                    (inputFocus)="onInputFocus($event)"
                    [ngModel]="selectedSeason()"
                    (ngModelChange)="selectedSeason.set($event)"></mona-radio-button>
                <mona-radio-button
                    [disabled]="disabled()"
                    [labelPosition]="labelPosition()"
                    [labelSize]="labelSize()"
                    [name]="name()"
                    [rounded]="rounded()"
                    value="Summer"
                    (inputBlur)="onInputBlur($event)"
                    (inputClick)="onInputClick($event)"
                    (inputFocus)="onInputFocus($event)"
                    [ngModel]="selectedSeason()"
                    (ngModelChange)="selectedSeason.set($event)">
                    <span class="text-rose-800">Summer</span>
                </mona-radio-button>
            </div>

            <div class="flex gap-4 mt-4">
                <label class="flex items-center gap-2">
                    <input
                        type="radio"
                        monaRadioButton
                        name="directions"
                        value="East"
                        [disabled]="disabled()"
                        [rounded]="rounded()"
                        [ngModel]="selectedDirection()"
                        (ngModelChange)="selectedDirection.set($event)" />
                    <span class="text-blue-800">East</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="radio"
                        monaRadioButton
                        name="directions"
                        value="West"
                        [disabled]="disabled()"
                        [rounded]="rounded()"
                        [ngModel]="selectedDirection()"
                        (ngModelChange)="selectedDirection.set($event)" />
                    <span class="text-blue-800">West</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="radio"
                        monaRadioButton
                        name="directions"
                        value="North"
                        [disabled]="disabled()"
                        [rounded]="rounded()"
                        [ngModel]="selectedDirection()"
                        (ngModelChange)="selectedDirection.set($event)" />
                    <span class="text-blue-800">North</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="radio"
                        monaRadioButton
                        name="directions"
                        value="South"
                        [disabled]="disabled()"
                        [rounded]="rounded()"
                        [ngModel]="selectedDirection()"
                        (ngModelChange)="selectedDirection.set($event)" />
                    <span class="text-blue-800">South</span>
                </label>
            </div>
        `,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            label: {
                type: "string",
                value: "Autumn"
            },
            labelPosition: {
                type: "dropdown",
                value: ["before", "after"],
                defaultValue: "after"
            },
            labelSize: {
                type: "dropdown",
                value: ["small", "default", "large"],
                defaultValue: "default"
            },
            name: {
                type: "string",
                value: "seasons"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "full"
            },
            value: {
                type: "string",
                value: "Autumn"
            }
        }
    });
    protected readonly metadata = this.getMetadata("RadioButtonComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata(["RadioButtonDirective"]);
}

@Component({
    imports: [RadioButtonComponent, FormsModule, RadioButtonDirective],
    template: `
        <div class="flex gap-4">
            <mona-radio-button
                [disabled]="disabled()"
                [labelPosition]="labelPosition()"
                [labelSize]="labelSize()"
                [label]="label()"
                [name]="name()"
                [rounded]="rounded()"
                [value]="value()"
                (inputBlur)="onInputBlur($event)"
                (inputClick)="onInputClick($event)"
                (inputFocus)="onInputFocus($event)"
                [ngModel]="selectedSeason()"
                (ngModelChange)="selectedSeason.set($event)">
                <span class="text-yellow-900">Autumn</span>
            </mona-radio-button>
            <mona-radio-button
                [disabled]="disabled()"
                [labelPosition]="labelPosition()"
                [labelSize]="labelSize()"
                label="Winter"
                [name]="name()"
                [rounded]="rounded()"
                value="Winter"
                (inputBlur)="onInputBlur($event)"
                (inputClick)="onInputClick($event)"
                (inputFocus)="onInputFocus($event)"
                [ngModel]="selectedSeason()"
                (ngModelChange)="selectedSeason.set($event)">
            </mona-radio-button>
            <mona-radio-button
                [disabled]="true"
                [labelPosition]="labelPosition()"
                [labelSize]="labelSize()"
                label="Spring"
                [name]="name()"
                [rounded]="rounded()"
                value="Spring"
                (inputBlur)="onInputBlur($event)"
                (inputClick)="onInputClick($event)"
                (inputFocus)="onInputFocus($event)"
                [ngModel]="selectedSeason()"
                (ngModelChange)="selectedSeason.set($event)"></mona-radio-button>
            <mona-radio-button
                [disabled]="disabled()"
                [labelPosition]="labelPosition()"
                [labelSize]="labelSize()"
                [name]="name()"
                [rounded]="rounded()"
                value="Summer"
                (inputBlur)="onInputBlur($event)"
                (inputClick)="onInputClick($event)"
                (inputFocus)="onInputFocus($event)"
                [ngModel]="selectedSeason()"
                (ngModelChange)="selectedSeason.set($event)">
                <span class="text-rose-800">Summer</span>
            </mona-radio-button>
        </div>

        <div class="flex gap-4 mt-4">
            <label class="flex items-center gap-2">
                <input
                    type="radio"
                    monaRadioButton
                    name="directions"
                    value="East"
                    [disabled]="disabled()"
                    [rounded]="rounded()"
                    [ngModel]="selectedDirection()"
                    (ngModelChange)="selectedDirection.set($event)" />
                <span class="text-blue-800">East</span>
            </label>
            <label class="flex items-center gap-2">
                <input
                    type="radio"
                    monaRadioButton
                    name="directions"
                    value="West"
                    [disabled]="disabled()"
                    [rounded]="rounded()"
                    [ngModel]="selectedDirection()"
                    (ngModelChange)="selectedDirection.set($event)" />
                <span class="text-blue-800">West</span>
            </label>
            <label class="flex items-center gap-2">
                <input
                    type="radio"
                    monaRadioButton
                    name="directions"
                    value="North"
                    [disabled]="disabled()"
                    [rounded]="rounded()"
                    [ngModel]="selectedDirection()"
                    (ngModelChange)="selectedDirection.set($event)" />
                <span class="text-blue-800">North</span>
            </label>
            <label class="flex items-center gap-2">
                <input
                    type="radio"
                    monaRadioButton
                    name="directions"
                    value="South"
                    [disabled]="disabled()"
                    [rounded]="rounded()"
                    [ngModel]="selectedDirection()"
                    (ngModelChange)="selectedDirection.set($event)" />
                <span class="text-blue-800">South</span>
            </label>
        </div>
    `
})
export class RadioButtonWrapperComponent implements ComponentInputsAsSignal<RadioButtonComponent> {
    protected readonly selectedDirection = signal("West");
    protected readonly selectedSeason = signal("Autumn");
    public readonly disabled = input(false);
    public readonly label = input("Autumn");
    public readonly labelPosition = input<ReturnType<RadioButtonComponent["labelPosition"]>>("after");
    public readonly labelSize = input<ReturnType<RadioButtonComponent["labelSize"]>>("default");
    public readonly name = input("seasons");
    public readonly rounded = input<ReturnType<RadioButtonComponent["rounded"]>>("full");
    public readonly value = input("Autumn");

    protected onInputBlur(event: FocusEvent): void {
        console.log("Input blurred:", event);
    }

    protected onInputClick(event: MouseEvent): void {
        console.log("Input clicked:", event);
    }

    protected onInputFocus(event: FocusEvent): void {
        console.log("Input focused:", event);
    }
}
