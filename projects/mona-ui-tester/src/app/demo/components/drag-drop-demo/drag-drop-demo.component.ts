import { NgComponentOutlet } from "@angular/common";
import { Component, computed } from "@angular/core";
import type { DropTargetDirective } from "@nanahoshi/mona-ui/drag-drop";
import type { ComponentConfig } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { DragDropDemoFoldersComponent } from "./drag-drop-demo-folders.component";

@Component({
    selector: "app-drag-drop-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./drag-drop-demo.component.html"
})
export class DragDropDemoComponent extends AbstractDemoComponent<DropTargetDirective> {
    protected readonly config = computed<ComponentConfig<DropTargetDirective>>(() => ({
        inputs: deriveInputConfig<DropTargetDirective>(this.metadata(), {
            dropEffect: {
                type: "dropdown",
                value: ["move", "copy", "link", "none"],
                defaultValue: "move"
            }
        })
    }));
    protected readonly metadata = this.getMetadata("DropTargetDirective");
    protected readonly wrapperComponent = DragDropDemoFoldersComponent;
}
