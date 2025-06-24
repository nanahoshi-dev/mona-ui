import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { ButtonDirective } from "mona-ui";
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
    protected readonly ButtonWrapperComponent = ButtonWrapperComponent;
    public readonly config = signal<ComponentConfig<ButtonDirective>>({
        ariaDescribedby: {
            type: "string",
            description:
                "Sets the aria-describedby attribute for the button, which provides additional descriptive text for screen readers.",
            value: "Aria described by"
        },
        ariaLabel: {
            type: "string",
            description:
                "Sets the aria-label attribute for the button, which provides a label for screen readers when the button does not have visible text.",
            value: "Button"
        },
        ariaLabelledby: {
            type: "string",
            description:
                "Sets the aria-labelledby attribute for the button, which references another element that labels the button for screen readers.",
            value: "Aria labelled by"
        },
        disabled: {
            type: "boolean",
            description: "Disables the button, preventing user interaction.",
            value: false
        },
        look: {
            type: "dropdown",
            description: "Sets the visual style of the button.",
            value: ["default", "destructive", "link", "secondary", "ghost", "outline"],
            defaultValue: "default"
        },
        selected: {
            type: "boolean",
            description:
                "Sets the selected state of the button, which can be used to indicate an active or chosen state.",
            value: false
        },
        size: {
            type: "dropdown",
            description: "Sets the size of the button.",
            value: ["default", "small", "large"],
            defaultValue: "default"
        },
        toggleable: {
            type: "boolean",
            description:
                "If set to true, the button will toggle its selected state on click, allowing it to be used as a toggle button.",
            value: false
        }
    });
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
