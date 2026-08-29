import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input, model, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { disabled, form, FormField } from "@angular/forms/signals";
import { RadioButtonComponent, RadioButtonDirective } from "@nanahoshi/mona-ui/radio-button";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-radio-button-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./radio-button-demo.component.html"
})
export class RadioButtonDemoComponent extends AbstractDemoComponent<RadioButtonComponent> {
    protected readonly RadioButtonWrapperComponent = RadioButtonWrapperComponent;
    protected readonly config = computed<ComponentConfig<RadioButtonComponent>>(() => ({
        inputs: deriveInputConfig<RadioButtonComponent>(this.metadata(), {
            label: {
                type: "string",
                value: "Autumn"
            },
            labelSize: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            name: {
                type: "string",
                value: "seasons"
            },
            radioValue: {
                type: "string",
                value: "Autumn"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "full"
            },
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            touched: undefined,
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("RadioButtonComponent");
}

@Component({
    imports: [RadioButtonComponent, FormsModule, RadioButtonDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <div class="flex flex-col gap-4">
            <span>Current season: {{ form.season().value() }}</span>
            <form class="flex flex-row gap-4">
                <mona-radio-button
                    [labelPosition]="labelPosition()"
                    [labelSize]="labelSize()"
                    [label]="label()"
                    [rounded]="rounded()"
                    [radioValue]="radioValue()"
                    [formField]="form.season"
                    (inputBlur)="onInputBlur($event)"
                    (inputClick)="onInputClick($event)"
                    (inputFocus)="onInputFocus($event)"
                    [class]="userClass()">
                    <span class="text-yellow-900">Autumn</span>
                </mona-radio-button>
                <mona-radio-button
                    [labelPosition]="labelPosition()"
                    [labelSize]="labelSize()"
                    label="Winter"
                    [rounded]="rounded()"
                    [formField]="form.season"
                    [radioValue]="'Winter'"
                    (inputBlur)="onInputBlur($event)"
                    (inputClick)="onInputClick($event)"
                    (inputFocus)="onInputFocus($event)"
                    [class]="userClass()">
                </mona-radio-button>
                <mona-radio-button
                    [labelPosition]="labelPosition()"
                    [labelSize]="labelSize()"
                    label="Spring"
                    [rounded]="rounded()"
                    [formField]="form.season"
                    [radioValue]="'Spring'"
                    (inputBlur)="onInputBlur($event)"
                    (inputClick)="onInputClick($event)"
                    (inputFocus)="onInputFocus($event)"
                    [class]="userClass()"></mona-radio-button>
                <mona-radio-button
                    [labelPosition]="labelPosition()"
                    [labelSize]="labelSize()"
                    [rounded]="rounded()"
                    [formField]="form.season"
                    [radioValue]="'Summer'"
                    (inputBlur)="onInputBlur($event)"
                    (inputClick)="onInputClick($event)"
                    (inputFocus)="onInputFocus($event)"
                    [class]="userClass()">
                    <span class="text-rose-800">Summer</span>
                </mona-radio-button>
            </form>
        </div>

        <div class="flex flex-col gap-4 mt-4">
            <span>Current direction: {{ form.direction().value() }}</span>
            <form class="flex flex-row gap-4">
                <label class="flex items-center gap-2">
                    <input
                        type="radio"
                        monaRadioButton
                        [formField]="form.direction"
                        value="East"
                        [rounded]="rounded()" />
                    <span class="text-blue-800">East</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="radio"
                        monaRadioButton
                        [formField]="form.direction"
                        value="West"
                        [rounded]="rounded()" />
                    <span class="text-blue-800">West</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="radio"
                        monaRadioButton
                        [formField]="form.direction"
                        value="North"
                        [rounded]="rounded()" />
                    <span class="text-blue-800">North</span>
                </label>
                <label class="flex items-center gap-2">
                    <input
                        type="radio"
                        monaRadioButton
                        [formField]="form.direction"
                        value="South"
                        [rounded]="rounded()" />
                    <span class="text-blue-800">South</span>
                </label>
            </form>
        </div>
    `
})
export class RadioButtonWrapperComponent implements ComponentInputsAsSignal<RadioButtonComponent> {
    readonly #formModel = signal<FormModel>({ season: "Autumn", direction: "West" });
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.season, { when: () => this.disabled() });
        disabled(schema.direction, { when: () => this.disabled() });
    });
    protected readonly selectedDirection = signal("West");
    protected readonly selectedSeason = signal("Autumn");
    public readonly disabled = input(false);
    public readonly label = input("Autumn");
    public readonly labelPosition = input<ReturnType<RadioButtonComponent["labelPosition"]>>("after");
    public readonly labelSize = input<ReturnType<RadioButtonComponent["labelSize"]>>("medium");
    public readonly name = input("seasons");
    public readonly radioValue = model("Autumn");
    public readonly rounded = input<ReturnType<RadioButtonComponent["rounded"]>>("full");
    public readonly userClass = input<ReturnType<RadioButtonComponent["userClass"]>>("");
    public readonly value = model<any>(undefined);

    public constructor() {}

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

interface FormModel {
    direction: string;
    season: string;
}
