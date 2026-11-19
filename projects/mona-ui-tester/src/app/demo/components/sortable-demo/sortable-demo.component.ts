import { NgComponentOutlet } from "@angular/common";
import { Component, computed } from "@angular/core";
import type { SortableDirective } from "@nanahoshi/mona-ui/sortable";
import type { ComponentConfig } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { SortableDemoListComponent } from "./sortable-demo-list.component";

@Component({
    selector: "app-sortable-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./sortable-demo.component.html"
})
export class SortableDemoComponent extends AbstractDemoComponent<SortableDirective> {
    protected readonly config = computed<ComponentConfig<SortableDirective>>(() => ({
        inputs: deriveInputConfig<SortableDirective>(this.metadata(), {
            orientation: {
                type: "dropdown",
                value: ["vertical", "horizontal", "mixed"],
                defaultValue: "vertical"
            }
        })
    }));
    protected readonly metadata = this.getMetadata("SortableDirective");
    protected readonly wrapperComponent = SortableDemoListComponent;
}
