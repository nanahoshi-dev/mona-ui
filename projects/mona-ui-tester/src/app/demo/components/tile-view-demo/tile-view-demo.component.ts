import { NgComponentOutlet } from "@angular/common";
import { Component, computed } from "@angular/core";
import type { TileViewComponent } from "@nanahoshi/mona-ui/tile-view";
import type { ComponentConfig } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { TileViewDemoPhotosComponent } from "./tile-view-demo-photos.component";

@Component({
    selector: "app-tile-view-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./tile-view-demo.component.html"
})
export class TileViewDemoComponent extends AbstractDemoComponent<TileViewComponent> {
    protected readonly config = computed<ComponentConfig<TileViewComponent>>(() => ({
        inputs: deriveInputConfig<TileViewComponent>(this.metadata(), {
            // The photos are fixed, so their name, keys and text are too.
            ariaLabel: undefined,
            ariaLabelledBy: undefined,
            columns: undefined,
            gap: { type: "number", min: 0, max: 32, value: 4 },
            itemKey: undefined,
            items: undefined,
            selectedKeys: undefined,
            selectionMode: {
                type: "dropdown",
                value: ["multiple", "single", "none"],
                defaultValue: "multiple"
            },
            textField: undefined,
            // The photos aren't dragged anywhere: dragging tiles is in the guide.
            tileDraggable: undefined,
            tileHeight: { type: "number", min: 48, max: 256, value: 112 },
            tileWidth: { type: "number", min: 48, max: 256, value: 112 },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("TileViewComponent");
    protected readonly wrapperComponent = TileViewDemoPhotosComponent;
}
