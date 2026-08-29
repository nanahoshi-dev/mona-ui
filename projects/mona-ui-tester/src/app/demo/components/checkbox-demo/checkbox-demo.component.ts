import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input, model } from "@angular/core";
import { CheckBoxComponent, CheckboxDirective } from "@nanahoshi/mona-ui/check-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-checkbox-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./checkbox-demo.component.html"
})
export class CheckboxDemoComponent extends AbstractDemoComponent<CheckBoxComponent> {
    protected readonly config = computed<ComponentConfig<CheckBoxComponent>>(() => ({
        inputs: deriveInputConfig<CheckBoxComponent>(this.metadata(), {
            label: {
                type: "string",
                value: "Checkbox Component"
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
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("CheckBoxComponent");
    protected readonly CheckBoxWrapperComponent = CheckBoxWrapperComponent;
}

@Component({
    imports: [CheckBoxComponent, CheckboxDirective],
    template: `
        <mona-check-box
            [checked]="checked()"
            [disabled]="disabled()"
            [indeterminate]="indeterminate()"
            [invalid]="invalid()"
            [label]="label()"
            [labelPosition]="labelPosition()"
            [labelSize]="labelSize()"
            [required]="required()"
            [rounded]="rounded()"
            [tabIndex]="tabIndex()"
            [touched]="touched()"
            [class]="userClass()"
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
    public readonly invalid = input(false);
    public readonly label = input("Checkbox Label");
    public readonly labelPosition = input<ReturnType<CheckBoxComponent["labelPosition"]>>("after");
    public readonly labelSize = input<ReturnType<CheckBoxComponent["labelSize"]>>("medium");
    public readonly required = input(false);
    public readonly rounded = input<ReturnType<CheckBoxComponent["rounded"]>>("medium");
    public readonly tabIndex = input(0);
    public readonly touched = input(false);
    public readonly userClass = input("");

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
