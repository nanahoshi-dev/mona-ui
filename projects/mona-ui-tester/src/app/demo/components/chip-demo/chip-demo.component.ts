import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { ChipComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-chip-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./chip-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipDemoComponent extends AbstractDemoComponent<ChipComponent> {
    protected readonly ChipWrapperComponent = ChipWrapperComponent;
    protected readonly config = signal<ComponentConfig<ChipComponent>>({
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            look: {
                type: "dropdown",
                value: ["default", "outline", "primary", "success", "error", "warning", "info", "secondary", "ghost"],
                defaultValue: "default"
            },
            label: {
                type: "string",
                value: "Chip Label"
            },
            removable: {
                type: "boolean",
                value: false
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

@Component({
    imports: [ChipComponent],
    template: `
        <mona-chip
            [look]="look()"
            [disabled]="disabled()"
            [removable]="removable()"
            [rounded]="rounded()"
            [size]="size()"
            [label]="label()"
            (remove)="onRemove($event)"></mona-chip>
    `
})
export class ChipWrapperComponent implements ComponentInputsAsSignal<ChipComponent> {
    public readonly disabled = input(false);
    public readonly label = input("Mona Chip");
    public readonly look = input<ReturnType<ChipComponent["look"]>>("default");
    public readonly removable = input(false);
    public readonly rounded = input<ReturnType<ChipComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<ChipComponent["size"]>>("medium");

    protected onRemove(event: Event): void {
        console.log("Chip removed", event);
    }
}
