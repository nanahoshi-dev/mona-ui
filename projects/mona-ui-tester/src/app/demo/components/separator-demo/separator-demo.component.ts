import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { SeparatorComponent } from "@nanahoshi/mona-ui/separator";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-separator-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./separator-demo.component.html"
})
export class SeparatorDemoComponent extends AbstractDemoComponent<SeparatorComponent> {
    protected readonly config = computed<ComponentConfig<SeparatorComponent>>(() => ({
        inputs: deriveInputConfig<SeparatorComponent>(this.metadata(), {
            orientation: {
                type: "dropdown",
                value: ["horizontal", "vertical"],
                defaultValue: "horizontal"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("SeparatorComponent");
    protected readonly wrapperComponent = SeparatorWrapperComponent;
}

@Component({
    imports: [SeparatorComponent],
    templateUrl: "./separator-demo-wrapper.component.html",
    host: {
        class: "w-full max-w-md"
    }
})
class SeparatorWrapperComponent implements ComponentInputsAsSignal<SeparatorComponent> {
    /** A vertical line sits between items in a row, and anything else between items in a column. */
    protected readonly layoutClass = computed(() =>
        this.orientation() === "vertical" && this.label() === ""
            ? "flex h-6 items-center gap-3 text-sm"
            : "flex flex-col gap-3 text-sm"
    );
    public readonly decorative = input(false, { transform: booleanAttribute });
    public readonly label = input("");
    public readonly orientation = input<ReturnType<SeparatorComponent["orientation"]>>("horizontal");
    public readonly userClass = input<string, ClassInputType>("", {
        transform: value => classInputToClass(value)
    });
}
