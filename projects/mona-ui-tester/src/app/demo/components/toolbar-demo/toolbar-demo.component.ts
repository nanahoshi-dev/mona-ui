import { NgComponentOutlet } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { LucideBold, LucideItalic, LucideRedo2, LucideUnderline, LucideUndo2 } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { SeparatorComponent } from "@nanahoshi/mona-ui/separator";
import { ToolbarComponent, ToolbarItemDirective } from "@nanahoshi/mona-ui/toolbar";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-toolbar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./toolbar-demo.component.html"
})
export class ToolbarDemoComponent extends AbstractDemoComponent<ToolbarComponent> {
    protected readonly config = computed<ComponentConfig<ToolbarComponent>>(() => ({
        inputs: deriveInputConfig<ToolbarComponent>(this.metadata(), {
            ariaLabel: {
                type: "string",
                value: "Formatting"
            },
            overflow: {
                type: "dropdown",
                value: ["menu", "wrap"],
                defaultValue: "menu"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("ToolbarComponent");
    protected readonly wrapperComponent = ToolbarWrapperComponent;
}

@Component({
    imports: [
        ButtonDirective,
        LucideBold,
        LucideItalic,
        LucideRedo2,
        LucideUnderline,
        LucideUndo2,
        SeparatorComponent,
        ToolbarComponent,
        ToolbarItemDirective
    ],
    templateUrl: "./toolbar-demo-wrapper.component.html",
    host: {
        class: "w-full"
    }
})
class ToolbarWrapperComponent implements ComponentInputsAsSignal<ToolbarComponent> {
    public readonly ariaLabel = input("Formatting");
    public readonly ariaLabelledBy = input("");
    public readonly moreLabel = input("");
    public readonly overflow = input<ReturnType<ToolbarComponent["overflow"]>>("menu");
    public readonly size = input<ReturnType<ToolbarComponent["size"]>>("medium");
    public readonly userClass = input<string, ClassInputType>("", {
        transform: value => classInputToClass(value)
    });
}
