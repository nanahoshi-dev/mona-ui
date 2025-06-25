import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { ButtonGroupComponent, ButtonGroupItemComponent, MenuItemComponent, SplitButtonComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-split-button-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./split-button-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitButtonDemoComponent extends AbstractDemoComponent<SplitButtonComponent> {
    protected readonly SplitButtonWrapperComponent = SplitButtonWrapperComponent;
    protected readonly config = signal<ComponentConfig<SplitButtonComponent>>({
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
            rounded: {
                type: "dropdown",
                value: ["small", "small", "medium", "large"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["medium", "small", "large"],
                defaultValue: "medium"
            },
            text: {
                type: "string",
                value: "Split Button"
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("SplitButtonComponent");
}

@Component({
    imports: [SplitButtonComponent, MenuItemComponent],
    template: `
        <mona-split-button
            [disabled]="disabled()"
            [look]="look()"
            [rounded]="rounded()"
            [size]="size()"
            [text]="text()">
            <mona-menu-item text="Option A"></mona-menu-item>
            <mona-menu-item text="Option B"></mona-menu-item>
            <mona-menu-item text="Option C"></mona-menu-item>
        </mona-split-button>
    `
})
export class SplitButtonWrapperComponent implements ComponentInputsAsSignal<SplitButtonComponent> {
    public readonly disabled = input(false);
    public readonly look = input<ReturnType<SplitButtonComponent["look"]>>("default");
    public readonly rounded = input<ReturnType<SplitButtonComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<SplitButtonComponent["size"]>>("medium");
    public readonly text = input("Split Button");
}
