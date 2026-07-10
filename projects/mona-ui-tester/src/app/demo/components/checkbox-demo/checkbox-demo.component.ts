import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, model, signal } from "@angular/core";
import { CheckBoxComponent, CheckboxDirective } from "@nanahoshi/mona-ui/check-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-checkbox-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./checkbox-demo.component.html"
})
export class CheckboxDemoComponent extends AbstractDemoComponent<CheckBoxComponent> {
    protected readonly config = signal<ComponentConfig<CheckBoxComponent>>({
        code: `
            <mona-check-box
                [disabled]="disabled()"
                [indeterminate]="indeterminate()"
                [label]="label()"
                [labelPosition]="labelPosition()"
                [labelSize]="labelSize()"
                [rounded]="rounded()"
                (inputBlur)="onInputBlur($event)"
                (inputChange)="onInputChange($event)"
                (inputFocus)="onInputFocus($event)">
                <span class="text-emerald-700">Checkbox Component</span>
            </mona-check-box>

            <label class="flex items-center gap-2">
                <input
                    type="checkbox"
                    (change)="onInputChange($event)"
                    [indeterminate]="indeterminate()"
                    [disabled]="disabled()"
                    [rounded]="rounded()"
                    monaCheckbox />
                Checkbox Directive
            </label>
        `,
        inputs: {
            checked: {
                type: "boolean",
                value: false
            },
            disabled: {
                type: "boolean",
                value: false
            },
            indeterminate: {
                type: "boolean",
                value: false
            },
            label: {
                type: "string",
                value: "Checkbox Component"
            },
            labelPosition: {
                type: "dropdown",
                value: ["before", "after"],
                defaultValue: "after"
            },
            labelSize: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            }
        }
    });
    protected readonly metadata = this.getMetadata("CheckBoxComponent");
    protected readonly CheckBoxWrapperComponent = CheckBoxWrapperComponent;
}

@Component({
    imports: [CheckBoxComponent, CheckboxDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <mona-check-box
            [checked]="checked()"
            [disabled]="disabled()"
            [indeterminate]="indeterminate()"
            [label]="label()"
            [labelPosition]="labelPosition()"
            [labelSize]="labelSize()"
            [rounded]="rounded()"
            (inputBlur)="onInputBlur($event)"
            (inputChange)="onInputChange($event)"
            (inputFocus)="onInputFocus($event)">
            <span class="text-emerald-700">Checkbox Component</span>
        </mona-check-box>

        <label class="flex items-center gap-2">
            <input
                type="checkbox"
                (change)="onInputChange($event)"
                [indeterminate]="indeterminate()"
                [disabled]="disabled()"
                [rounded]="rounded()"
                monaCheckbox />
            Checkbox Directive
        </label>
    `
})
export class CheckBoxWrapperComponent implements ComponentInputsAsSignal<CheckBoxComponent> {
    public readonly checked = model(false);
    public readonly disabled = input(false);
    public readonly indeterminate = input(false);
    public readonly label = input("Checkbox Label");
    public readonly labelPosition = input<ReturnType<CheckBoxComponent["labelPosition"]>>("after");
    public readonly labelSize = input<ReturnType<CheckBoxComponent["labelSize"]>>("medium");
    public readonly rounded = input<ReturnType<CheckBoxComponent["rounded"]>>("medium");

    protected onInputBlur(event: FocusEvent): void {
        console.log("Checkbox blurred", event);
    }

    protected onInputChange(event: Event): void {
        console.log("Checkbox changed", (event.target as HTMLInputElement).checked);
    }

    protected onInputFocus(event: FocusEvent): void {
        console.log("Checkbox focused", event);
    }
}
