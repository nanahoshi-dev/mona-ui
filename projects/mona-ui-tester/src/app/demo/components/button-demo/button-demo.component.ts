import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { ButtonDirective, ThemeService } from "mona-ui";
import { ComponentConfig } from "../../utils/componentConfig";
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
                value: ["default", "destructive", "link", "secondary", "ghost", "outline"],
                defaultValue: "default"
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
            [look]="$any(look())"
            [selected]="selected()"
            [size]="$any(size())"
            [toggleable]="toggleable()">
            TEST
        </button>
    `
})
export class ButtonWrapperComponent {
    public readonly ariaDescribedby = input<string>("aria-describedby");
    public readonly ariaLabel = input<string>("Button");
    public readonly ariaLabelledby = input<string>("aria-labelledby");
    public readonly disabled = input<boolean>(false);
    public readonly look = input<string>("default");
    public readonly selected = input<boolean>(false);
    public readonly size = input<string>("default");
    public readonly toggleable = input<boolean>(false);
}
