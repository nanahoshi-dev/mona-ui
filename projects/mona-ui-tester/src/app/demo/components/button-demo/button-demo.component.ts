import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { ButtonDirective } from "mona-ui";
import { ComponentConfig } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { ConfigComponent } from "../config/config.component";

@Component({
    selector: "app-button-demo",
    imports: [ConfigComponent, NgComponentOutlet],
    templateUrl: "./button-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonDemoComponent extends AbstractDemoComponent<ButtonDirective> {
    public readonly config = signal<ComponentConfig<ButtonDirective>>({
        ariaDescribedby: {
            type: "single",
            value: "Aria described by"
        },
        disabled: {
            type: "single",
            value: true
        },
        look: {
            type: "dropdown",
            value: ["default", "destructive", "link", "secondary", "ghost", "outline"]
        },
        size: {
            type: "dropdown",
            value: ["default", "small", "large"]
        }
    });
    protected readonly ButtonWrapperComponent = ButtonWrapperComponent;
}

@Component({
    selector: "app-button-wrapper",
    imports: [ButtonDirective],
    template: `
        <button
            monaButton
            [ariaDescribedby]="ariaDescribedby()"
            [disabled]="disabled()"
            [look]="$any(look())"
            [size]="$any(size())">
            TEST
        </button>
    `
})
export class ButtonWrapperComponent {
    public readonly ariaDescribedby = input<string>("aria-describedby");
    public readonly disabled = input<boolean>(false);
    public readonly look = input<string>("default");
    public readonly size = input<string>("default");
}
