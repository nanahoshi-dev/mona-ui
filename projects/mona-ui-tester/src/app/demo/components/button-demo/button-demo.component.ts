import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, model, signal } from "@angular/core";
import { LucideLayers } from "@lucide/angular";
import { ButtonDirective } from "mona-ui/button";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-button-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./button-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonDemoComponent extends AbstractDemoComponent<ButtonDirective> {
    protected readonly ButtonWrapperComponent = ButtonWrapperComponent;
    protected readonly config = signal<ComponentConfig<ButtonDirective>>({
        code: `
            <button
                monaButton
                [disabled]="disabled()"
                [iconOnly]="iconOnly()"
                [look]="look()"
                [rounded]="rounded()"
                [selected]="selected()"
                [size]="size()"
                [toggleable]="toggleable()">
                Mona Button
            </button>`,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            iconOnly: {
                type: "boolean",
                value: false
            },
            loading: {
                type: "boolean",
                value: false
            },
            look: {
                type: "dropdown",
                value: [
                    "default",
                    "primary",
                    "success",
                    "error",
                    "warning",
                    "info",
                    "link",
                    "secondary",
                    "ghost",
                    "outline",
                    "clear"
                ],
                defaultValue: "default"
            },
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "full", "none"],
                defaultValue: "medium"
            },
            selected: {
                type: "boolean",
                value: false
            },
            size: {
                type: "dropdown",
                value: ["medium", "small", "large"],
                defaultValue: "medium"
            },
            toggleable: {
                type: "boolean",
                value: false
            }
        }
    });
    protected readonly metadata = this.getMetadata("ButtonDirective");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    selector: "app-button-wrapper",
    imports: [ButtonDirective, LucideLayers],
    template: `
        <button
            monaButton
            [disabled]="disabled()"
            [iconOnly]="iconOnly()"
            [loading]="loading()"
            [look]="look()"
            [rounded]="rounded()"
            [selected]="selected()"
            [size]="size()"
            [toggleable]="toggleable()">
            @if (iconOnly()) {
                <svg lucideLayers [size]="14"></svg>
            } @else {
                Mona Button
            }
        </button>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: "flex items-center"
    }
})
export class ButtonWrapperComponent implements ComponentInputsAsSignal<ButtonDirective> {
    public readonly ariaDescribedby = input("aria-describedby");
    public readonly ariaLabel = input("Button");
    public readonly ariaLabelledby = input("aria-labelledby");
    public readonly disabled = model(false);
    public readonly iconOnly = input(false);
    public readonly loading = model(false);
    public readonly look = model<ReturnType<ButtonDirective["look"]>>("default");
    public readonly rounded = input<ReturnType<ButtonDirective["rounded"]>>("medium");
    public readonly selected = model<ReturnType<ButtonDirective["selected"]>>(false);
    public readonly size = input<ReturnType<ButtonDirective["size"]>>("medium");
    public readonly toggleable = input<boolean>(false);
}
