import { NgComponentOutlet } from "@angular/common";
import { Component, signal } from "@angular/core";
import { ChipComponent } from "mona-ui";
import { ComponentConfig } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { ConfigComponent } from "../config/config.component";

@Component({
    selector: "app-chip-demo",
    imports: [ConfigComponent, NgComponentOutlet],
    templateUrl: "./chip-demo.component.html"
})
export class ChipDemoComponent extends AbstractDemoComponent<ChipComponent> {
    protected readonly ChipComponent = ChipComponent;
    protected readonly config = signal<ComponentConfig<ChipComponent>>({
        disabled: {
            type: "single",
            value: false
        },
        look: {
            type: "dropdown",
            value: ["default", "destructive", "outline", "secondary"]
        },
        label: {
            type: "single",
            value: "Chip Label"
        },
        removable: {
            type: "single",
            value: true
        }
    });
}
