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
        disabled: {
            type: "boolean",
            description: "Disables the chip, preventing interaction.",
            value: false
        },
        look: {
            type: "dropdown",
            description: "Defines the visual style of the chip.",
            value: ["default", "destructive", "outline", "secondary"],
            defaultValue: "default"
        },
        label: {
            type: "string",
            description: "Sets the text label for the chip.",
            value: "Chip Label"
        },
        removable: {
            type: "boolean",
            description: "Enables the chip to be removable, allowing users to delete it.",
            value: true
        }
    });
}
