import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, model, signal } from "@angular/core";
import { ButtonDirective, ThemeService } from "mona-ui";
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
    readonly #themeService = inject(ThemeService);
    protected readonly ButtonWrapperComponent = ButtonWrapperComponent;
    protected readonly config = signal<ComponentConfig<ButtonDirective>>({
        inputs: {
            ariaDescribedby: {
                type: "string",
                value: "Aria described by"
            },
            ariaLabel: {
                type: "string",
                value: "Button"
            },
            ariaLabelledby: {
                type: "string",
                value: "Aria labelled by"
            },
            disabled: {
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
                    "outline"
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
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("ButtonDirective");

    // public constructor() {
    //     super();
    //     window.setInterval(() => {
    //         this.#themeService.setTheme(this.#themeService.theme() === "mona" ? "shadcn" : "mona");
    //     }, 4444);
    // }
}

@Component({
    selector: "app-button-wrapper",
    imports: [ButtonDirective],
    template: `
        <button
            monaButton
            [ariaDescribedby]="ariaDescribedby()"
            [ariaLabel]="ariaLabel()"
            [ariaLabelledby]="ariaLabelledby()"
            [disabled]="disabled()"
            [look]="look()"
            [rounded]="rounded()"
            [selected]="selected()"
            [size]="size()"
            [toggleable]="toggleable()">
            Mona Button
        </button>
    `
})
export class ButtonWrapperComponent implements ComponentInputsAsSignal<ButtonDirective> {
    public readonly ariaDescribedby = input("aria-describedby");
    public readonly ariaLabel = input("Button");
    public readonly ariaLabelledby = input("aria-labelledby");
    public readonly disabled = model(false);
    public readonly look = model<ReturnType<ButtonDirective["look"]>>("default");
    public readonly rounded = input<ReturnType<ButtonDirective["rounded"]>>("medium");
    public readonly selected = model<ReturnType<ButtonDirective["selected"]>>(false);
    public readonly size = input<ReturnType<ButtonDirective["size"]>>("medium");
    public readonly toggleable = input<boolean>(false);
}
