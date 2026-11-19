import { NgComponentOutlet } from "@angular/common";
import { Component, computed } from "@angular/core";
import type { KanbanComponent } from "@nanahoshi/mona-ui/kanban";
import type { ComponentConfig } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { KanbanDemoBoardComponent } from "./kanban-demo-board.component";

@Component({
    selector: "app-kanban-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./kanban-demo.component.html"
})
export class KanbanDemoComponent extends AbstractDemoComponent<KanbanComponent> {
    protected readonly config = computed<ComponentConfig<KanbanComponent>>(() => ({
        inputs: deriveInputConfig<KanbanComponent>(this.metadata(), {
            // The board's cards are fixed, so their field names are too.
            statusField: undefined,
            textField: undefined,
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("KanbanComponent");
    protected readonly wrapperComponent = KanbanDemoBoardComponent;
}
