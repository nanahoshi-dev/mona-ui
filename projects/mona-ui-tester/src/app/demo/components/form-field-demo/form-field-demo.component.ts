import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, input, signal } from "@angular/core";
import { form, FormField, minLength, required } from "@angular/forms/signals";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-form-field-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./form-field-demo.component.html"
})
export class FormFieldDemoComponent extends AbstractDemoComponent<FormFieldComponent> {
    protected readonly config = computed<ComponentConfig<FormFieldComponent>>(() => ({
        inputs: deriveInputConfig<FormFieldComponent>(this.metadata(), {
            // The demo curates a starting label and hint instead of the library's "" defaults.
            hint: {
                type: "string",
                value: "At least 3 characters. Leave the field to see its errors."
            },
            label: {
                type: "string",
                value: "Display name"
            },
            orientation: {
                type: "dropdown",
                value: ["vertical", "horizontal"],
                defaultValue: "vertical"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("FormFieldComponent");
    protected readonly wrapperComponent = FormFieldWrapperComponent;
}

@Component({
    imports: [FormField, FormFieldComponent, TextBoxComponent],
    template: `
        <mona-form-field
            [class]="userClass()"
            [error]="error()"
            [hint]="hint()"
            [label]="label()"
            [optional]="optional()"
            [optionalText]="optionalText()"
            [orientation]="orientation()"
            [required]="required()"
            [showRequiredMarker]="showRequiredMarker()">
            <mona-text-box [formField]="profile.name" />
        </mona-form-field>
    `,
    host: {
        class: "w-full max-w-md"
    }
})
class FormFieldWrapperComponent implements ComponentInputsAsSignal<FormFieldComponent> {
    readonly #model = signal({ name: "" });
    protected readonly profile = form(this.#model, path => {
        required(path.name);
        minLength(path.name, 3);
    });
    public readonly error = input<ReturnType<FormFieldComponent["error"]>>("");
    public readonly hint = input<ReturnType<FormFieldComponent["hint"]>>("");
    public readonly label = input<ReturnType<FormFieldComponent["label"]>>("Display name");
    public readonly optional = input(false, { transform: booleanAttribute });
    public readonly optionalText = input<ReturnType<FormFieldComponent["optionalText"]>>("");
    public readonly orientation = input<ReturnType<FormFieldComponent["orientation"]>>("vertical");
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly showRequiredMarker = input(true, { transform: booleanAttribute });
    public readonly userClass = input<ReturnType<FormFieldComponent["userClass"]>>("");
}
