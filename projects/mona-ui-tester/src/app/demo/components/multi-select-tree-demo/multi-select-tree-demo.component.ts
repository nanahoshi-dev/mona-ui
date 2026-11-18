import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, input, model } from "@angular/core";
import { MultiSelectTreeComponent } from "@nanahoshi/mona-ui/multi-select-tree";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { type DemoPlace, demoPlaces } from "../../../../assets/tree-dropdown.data";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-multi-select-tree-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./multi-select-tree-demo.component.html"
})
export class MultiSelectTreeDemoComponent extends AbstractDemoComponent<MultiSelectTreeComponent<DemoPlace>> {
    protected readonly config = computed<ComponentConfig<MultiSelectTreeComponent<DemoPlace>>>(() => ({
        inputs: deriveInputConfig<MultiSelectTreeComponent<DemoPlace>>(this.metadata(), {
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
            checkChildren: {
                type: "boolean",
                value: true
            },
            checkParents: {
                type: "boolean",
                value: true
            },
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
                value: "Choose places"
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
                value: "w-80"
            }
        })
    }));
    protected readonly metadata = this.getMetadata("MultiSelectTreeComponent");
    protected readonly wrapperComponent = MultiSelectTreeWrapperComponent;
}

@Component({
    imports: [DropdownFilterableDirective, MultiSelectTreeComponent],
    templateUrl: "./multi-select-tree-demo-wrapper.component.html"
})
class MultiSelectTreeWrapperComponent implements ComponentInputsAsSignal<MultiSelectTreeComponent<DemoPlace>> {
    protected readonly places = demoPlaces;
    public readonly adaptiveMode = input<ReturnType<MultiSelectTreeComponent["adaptiveMode"]>>("none");
    public readonly adaptiveTitle = input("");
    public readonly checkChildren = input(true, { transform: booleanAttribute });
    public readonly checkParents = input(true, { transform: booleanAttribute });
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly loading = input(false, { transform: booleanAttribute });
    public readonly placeholder = input("Choose places");
    public readonly popupClass = input("");
    public readonly popupHeight = input<ReturnType<MultiSelectTreeComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<MultiSelectTreeComponent["popupWidth"]>>(null);
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly rounded = input<ReturnType<MultiSelectTreeComponent["rounded"]>>("medium");
    public readonly showClearButton = input(false, { transform: booleanAttribute });
    public readonly size = input<ReturnType<MultiSelectTreeComponent["size"]>>("medium");
    public readonly userClass = input("w-80");
    public readonly value = model<Iterable<DemoPlace>>([]);

    protected valueText(value: Iterable<DemoPlace>): string {
        return Array.from(value, place => place.name).join(", ") || "none";
    }
}
