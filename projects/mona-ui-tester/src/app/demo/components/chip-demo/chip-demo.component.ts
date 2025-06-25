import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { ChipComponent } from "mona-ui";
import { ComponentConfig } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-chip-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./chip-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipDemoComponent extends AbstractDemoComponent<ChipComponent> {
    protected readonly ChipComponent = ChipComponent;
    protected readonly config = signal<ComponentConfig<ChipComponent>>({
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            look: {
                type: "dropdown",
                value: ["default", "destructive", "outline", "secondary"],
                defaultValue: "default"
            },
            label: {
                type: "string",
                value: "Chip Label"
            },
            removable: {
                type: "boolean",
                value: false
            }
        },
        outputs: {
            remove: {
                type: "event"
            }
        }
    });
    protected readonly metadata = this.getMetadata("ChipComponent");
}
