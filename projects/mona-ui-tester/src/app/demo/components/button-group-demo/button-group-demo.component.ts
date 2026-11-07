import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { DropdownButtonComponent, DropdownButtonItemComponent } from "@nanahoshi/mona-ui/dropdown-button";
import { SplitButtonComponent, SplitButtonItemComponent } from "@nanahoshi/mona-ui/split-button";
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
            ariaLabelledBy: {
                alias: "aria-labelledby",
                type: "string",
                value: ""
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
            },
            // The demo holds its own value, shown under the group.
            value: undefined
        })
    }));
    protected readonly metadata = this.getMetadata("ButtonGroupComponent");
}

@Component({
    imports: [
        ButtonGroupComponent,
        ButtonDirective,
        DropdownButtonComponent,
        DropdownButtonItemComponent,
        SplitButtonComponent,
        SplitButtonItemComponent
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <div class="flex flex-col items-start gap-4">
            <mona-button-group
                [aria-label]="ariaLabel()"
                [allowEmpty]="allowEmpty()"
                [aria-labelledby]="ariaLabelledBy()"
                [disabled]="disabled()"
                [invalid]="invalid()"
                [readonly]="readonly()"
                [selection]="selection()"
                [look]="look()"
                [rounded]="rounded()"
                [size]="size()"
                [touched]="touched()"
                [class]="userClass()"
                [(value)]="currentValue"
                (buttonClick)="lastClick.set($event.button.textContent?.trim() ?? '')">
                <button monaButton value="B1">B1</button>
                <button monaButton value="B2">B2</button>
                <button monaButton value="B3">B3</button>
                <button monaButton [toggleable]="false">Action</button>
            </mona-button-group>
            <span>Value: {{ currentValue() ?? "none" }}. Last click: {{ lastClick() || "none" }}</span>
            <mona-button-group
                aria-label="Document"
                [disabled]="disabled()"
                [look]="look()"
                [rounded]="rounded()"
                [size]="size()">
                <button monaButton>Bold</button>
                <mona-dropdown-button text="Insert">
                    <mona-dropdown-button-item label="Table"></mona-dropdown-button-item>
                    <mona-dropdown-button-item label="Image"></mona-dropdown-button-item>
                </mona-dropdown-button>
                <mona-split-button text="Save">
                    <mona-split-button-item label="Save as"></mona-split-button-item>
                    <mona-split-button-item label="Save a copy"></mona-split-button-item>
                </mona-split-button>
            </mona-button-group>
        </div>
    `
})
export class ButtonGroupWrapperComponent implements ComponentInputsAsSignal<ButtonGroupComponent> {
    protected readonly currentValue = signal<string | readonly string[] | null | undefined>(undefined);
    protected readonly lastClick = signal("");
    public readonly allowEmpty = input(true, { transform: booleanAttribute });
    public readonly ariaLabel = input<ReturnType<ButtonGroupComponent["ariaLabel"]>>("Button group");
    public readonly ariaLabelledBy = input("");
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly invalid = input(false, { transform: booleanAttribute });
    public readonly look = input<ReturnType<ButtonGroupComponent["look"]>>("default");
    public readonly rounded = input<ReturnType<ButtonGroupComponent["rounded"]>>("medium");
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly selection = input<ReturnType<ButtonGroupComponent["selection"]>>("single");
    public readonly size = input<ReturnType<ButtonGroupComponent["size"]>>("medium");
    public readonly touched = input(false, { transform: booleanAttribute });
    public readonly userClass = input<ReturnType<ButtonGroupComponent["userClass"]>>("");
}
