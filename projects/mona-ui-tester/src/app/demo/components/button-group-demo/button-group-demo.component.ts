import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input, model } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-button-group-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./button-group-demo.component.html"
})
export class ButtonGroupDemoComponent extends AbstractDemoComponent<ButtonGroupComponent> {
    protected readonly ButtonGroupWrapperComponent = ButtonGroupWrapperComponent;
    protected readonly config = computed<ComponentConfig<ButtonGroupComponent>>(() => ({
        inputs: deriveInputConfig<ButtonGroupComponent>(this.metadata(), {
            ariaLabel: {
                alias: "aria-label",
                type: "string",
                value: "Button group"
            },
            look: {
                type: "dropdown",
                value: ["default", "outline", "primary", "secondary", "success", "error", "warning", "info", "ghost"],
                defaultValue: "default"
            },
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "full", "none"],
                defaultValue: "medium"
            },
            // The demo curates a "single" starting selection mode instead of the library's "multiple" default.
            selection: {
                type: "dropdown",
                value: ["single", "multiple"],
                defaultValue: "single"
            },
            size: {
                type: "dropdown",
                value: ["medium", "small", "large"],
                defaultValue: "medium"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("ButtonGroupComponent");
}

@Component({
    imports: [ButtonGroupComponent, ButtonDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <mona-button-group
            [aria-label]="ariaLabel()"
            [allowEmpty]="allowEmpty()"
            [disabled]="disabled()"
            [selection]="selection()"
            [look]="look()"
            [rounded]="rounded()"
            [size]="size()"
            [class]="userClass()">
            <button monaButton>B1</button>
            <button monaButton>B2</button>
            <button monaButton>B3</button>
        </mona-button-group>
    `
})
export class ButtonGroupWrapperComponent implements ComponentInputsAsSignal<ButtonGroupComponent> {
    public readonly allowEmpty = input<ReturnType<ButtonGroupComponent["allowEmpty"]>>(true);
    public readonly ariaLabel = input<ReturnType<ButtonGroupComponent["ariaLabel"]>>("Button group");
    public readonly disabled = model<ReturnType<ButtonGroupComponent["disabled"]>>(false);
    public readonly look = input<ReturnType<ButtonGroupComponent["look"]>>("default");
    public readonly rounded = input<ReturnType<ButtonGroupComponent["rounded"]>>("medium");
    public readonly selection = model<ReturnType<ButtonGroupComponent["selection"]>>("single");
    public readonly size = input<ReturnType<ButtonGroupComponent["size"]>>("medium");
    public readonly userClass = input<ReturnType<ButtonGroupComponent["userClass"]>>("");
}
