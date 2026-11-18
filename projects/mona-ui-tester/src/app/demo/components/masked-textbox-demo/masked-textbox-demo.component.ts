import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, input, model } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { MaskedTextBoxComponent } from "@nanahoshi/mona-ui/masked-text-box";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-masked-textbox-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./masked-textbox-demo.component.html"
})
export class MaskedTextboxDemoComponent extends AbstractDemoComponent<MaskedTextBoxComponent> {
    protected readonly config = computed<ComponentConfig<MaskedTextBoxComponent>>(() => ({
        inputs: deriveInputConfig<MaskedTextBoxComponent>(this.metadata(), {
            // The demo labels the box with a visible <mona-label> pointed at a fixed inputId.
            ariaDescribedBy: undefined,
            ariaLabel: undefined,
            ariaLabelledBy: undefined,
            inputId: undefined,
            // Objects and form state the playground has no control for.
            inputAttributes: undefined,
            inputClass: undefined,
            inputStyle: undefined,
            invalid: undefined,
            name: undefined,
            rules: undefined,
            touched: undefined,
            mask: {
                type: "string",
                value: "(000) 000-0000"
            },
            prompt: {
                type: "string",
                value: "_"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: "w-48"
            }
        })
    }));
    protected readonly metadata = this.getMetadata("MaskedTextBoxComponent");
    protected readonly wrapperComponent = MaskedTextboxWrapperComponent;
}

@Component({
    imports: [LabelComponent, MaskedTextBoxComponent],
    templateUrl: "./masked-textbox-demo-wrapper.component.html"
})
class MaskedTextboxWrapperComponent implements ComponentInputsAsSignal<MaskedTextBoxComponent> {
    public readonly clearButton = input(false, { transform: booleanAttribute });
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly includeLiterals = input(false, { transform: booleanAttribute });
    public readonly mask = input("(000) 000-0000");
    public readonly placeholder = input("");
    public readonly prompt = input("_");
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly rounded = input<ReturnType<MaskedTextBoxComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<MaskedTextBoxComponent["size"]>>("medium");
    public readonly userClass = input("w-48");
    public readonly value = model("");
}
