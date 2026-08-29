import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input, model } from "@angular/core";
import { LucideLayers } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-button-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./button-demo.component.html"
})
export class ButtonDemoComponent extends AbstractDemoComponent<ButtonDirective> {
    protected readonly ButtonWrapperComponent = ButtonWrapperComponent;
    protected readonly config = computed<ComponentConfig<ButtonDirective>>(() => ({
        inputs: deriveInputConfig<ButtonDirective>(this.metadata(), {
            ariaHasPopup: {
                alias: "aria-haspopup",
                type: "string",
                value: "false"
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
            size: {
                type: "dropdown",
                value: ["medium", "small", "large"],
                defaultValue: "medium"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("ButtonDirective");
}

@Component({
    selector: "app-button-wrapper",
    imports: [ButtonDirective, LucideLayers],
    template: `
        <button
            monaButton
            [aria-haspopup]="ariaHasPopup()"
            [disabled]="disabled()"
            [iconOnly]="iconOnly()"
            [loading]="loading()"
            [look]="look()"
            [rounded]="rounded()"
            [selected]="selected()"
            [size]="size()"
            [tabindex]="tabindex()"
            [toggleable]="toggleable()"
            [type]="type()"
            [class]="userClass()">
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
    public readonly ariaHasPopup = input<ReturnType<ButtonDirective["ariaHasPopup"]>>("false");
    public readonly ariaLabel = input("Button");
    public readonly ariaLabelledby = input("aria-labelledby");
    public readonly disabled = model(false);
    public readonly iconOnly = input(false);
    public readonly loading = model(false);
    public readonly look = model<ReturnType<ButtonDirective["look"]>>("default");
    public readonly rounded = input<ReturnType<ButtonDirective["rounded"]>>("medium");
    public readonly selected = model<ReturnType<ButtonDirective["selected"]>>(false);
    public readonly size = input<ReturnType<ButtonDirective["size"]>>("medium");
    public readonly tabindex = input<number, number | string>(0, {
        transform: (value: number | string) => (typeof value === "string" ? parseInt(value, 10) : value)
    });
    public readonly toggleable = input<boolean>();
    public readonly type = input<ReturnType<ButtonDirective["type"]>>("button");
    public readonly userClass = input<ReturnType<ButtonDirective["userClass"]>>("");
}
