import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, input, model } from "@angular/core";
import { DropdownTreeComponent } from "@nanahoshi/mona-ui/dropdown-tree";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { type DemoPlace, demoPlaces } from "../../../../assets/tree-dropdown.data";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-dropdown-tree-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./dropdown-tree-demo.component.html"
})
export class DropdownTreeDemoComponent extends AbstractDemoComponent<DropdownTreeComponent<DemoPlace>> {
    protected readonly config = computed<ComponentConfig<DropdownTreeComponent<DemoPlace>>>(() => ({
        inputs: deriveInputConfig<DropdownTreeComponent<DemoPlace>>(this.metadata(), {
            adaptiveMode: {
                type: "dropdown",
                value: ["none", "auto"],
                defaultValue: "none"
            },
            adaptiveTitle: {
                type: "string",
                value: ""
            },
            // The demo labels the field with visible text referenced through aria-labelledby.
            ariaDescribedBy: undefined,
            ariaLabel: undefined,
            ariaLabelledBy: undefined,
            // The data and its shape are the demo's own; the examples show the other shapes.
            children: undefined,
            data: undefined,
            hasChildren: undefined,
            idField: undefined,
            invalid: undefined,
            itemDisabled: undefined,
            mode: undefined,
            parentIdField: undefined,
            textField: undefined,
            touched: undefined,
            valueField: undefined,
            valuePrimitive: undefined,
            placeholder: {
                type: "string",
                value: "Choose a place"
            },
            popupHeight: {
                type: "number",
                nullable: true,
                min: 0,
                max: 500,
                value: null
            },
            popupWidth: {
                type: "number",
                nullable: true,
                min: 0,
                max: 500,
                value: null
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
                value: "w-64"
            }
        })
    }));
    protected readonly metadata = this.getMetadata("DropdownTreeComponent");
    protected readonly wrapperComponent = DropdownTreeWrapperComponent;
}

@Component({
    imports: [DropdownFilterableDirective, DropdownTreeComponent],
    templateUrl: "./dropdown-tree-demo-wrapper.component.html"
})
class DropdownTreeWrapperComponent implements ComponentInputsAsSignal<DropdownTreeComponent<DemoPlace>> {
    protected readonly places = demoPlaces;
    public readonly adaptiveMode = input<ReturnType<DropdownTreeComponent["adaptiveMode"]>>("none");
    public readonly adaptiveTitle = input("");
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly loading = input(false, { transform: booleanAttribute });
    public readonly placeholder = input("Choose a place");
    public readonly popupClass = input("");
    public readonly popupHeight = input<ReturnType<DropdownTreeComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<DropdownTreeComponent["popupWidth"]>>(null);
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly rounded = input<ReturnType<DropdownTreeComponent["rounded"]>>("medium");
    public readonly showClearButton = input(false, { transform: booleanAttribute });
    public readonly size = input<ReturnType<DropdownTreeComponent["size"]>>("medium");
    public readonly userClass = input("w-64");
    public readonly value = model<DemoPlace | null>(null);
}
