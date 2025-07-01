import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { CheckBoxComponent, CheckboxDirective, CheckboxLabelTemplateDirective } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-checkbox-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./checkbox-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxDemoComponent extends AbstractDemoComponent<CheckBoxComponent> {
    readonly #injector = createFeatureInjector({
        labelTemplate: {
            code: `
                <ng-template monaCheckboxLabelTemplate let-label>
                    <span class="text-primary font-semibold">{{ label }} </span>
                </ng-template>
            `,
            description: `This template is used to customize the label of the checkbox.`,
            name: "Label Template",
            active: false
        }
    });
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
                (inputFocus)="onInputFocus($event)"></mona-check-box>

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
        },
        outputs: {
            inputBlur: {
                type: "event",
                description: "Emitted when the checkbox loses focus."
            },
            inputChange: {
                type: "event",
                description: "Emitted when the checkbox value changes."
            },
            inputFocus: {
                type: "event",
                description: "Emitted when the checkbox gains focus."
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("CheckBoxComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly CheckBoxWrapperComponent = CheckBoxWrapperComponent;
}

@Component({
    imports: [CheckBoxComponent, CheckboxLabelTemplateDirective, CheckboxDirective],
    template: `
        @let featureData = features();
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
            @if (featureData && featureData["labelTemplate"].active) {
                <ng-template monaCheckboxLabelTemplate let-label>
                    <span class="text-rose-700 ">{{ label }} </span>
                </ng-template>
            }
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
    protected readonly features = inject(FeatureConfigHandler).data;
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
