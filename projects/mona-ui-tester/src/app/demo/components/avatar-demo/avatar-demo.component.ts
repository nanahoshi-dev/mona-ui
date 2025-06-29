import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { AvatarComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-avatar-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./avatar-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarDemoComponent extends AbstractDemoComponent<AvatarComponent> {
    protected readonly AvatarWrapperComponent = AvatarWrapperComponent;
    protected readonly config = signal<ComponentConfig<AvatarComponent>>({
        code: `
            <mona-avatar
                [backgroundColor]="backgroundColor()"
                [borderColor]="borderColor()"
                [borderRadius]="borderRadius()"
                [borderWidth]="borderWidth()"
                [height]="height()"
                [image]="image()"
                [label]="label()"
                [labelColor]="labelColor()"
                [labelFontSize]="labelFontSize()"
                [labelFontWeight]="labelFontWeight()"
                [width]="width()"></mona-avatar>
        `,
        inputs: {
            backgroundColor: {
                type: "color",
                value: "#f0f0f0"
            },
            borderColor: {
                type: "color",
                value: "#121315"
            },
            borderRadius: {
                type: "number",
                value: "50%"
            },
            borderWidth: {
                type: "number",
                value: "0.15em"
            },
            height: {
                type: "number",
                value: "100px"
            },
            image: {
                type: "string",
                value: "https://photos.smugmug.com/photos/i-fgmzcP4/0/LcnnHTpqhgGgTjHtbmvtjgmLWrVH2JhVGckRnpZqq/Th/i-fgmzcP4-Th.png"
            },
            label: {
                type: "string",
                value: "User Name"
            },
            labelColor: {
                type: "color",
                value: "#000000"
            },
            labelFontSize: {
                type: "string",
                value: "1.2em"
            },
            labelFontWeight: {
                type: "string",
                value: "normal"
            },
            width: {
                type: "string",
                value: "100px"
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("AvatarComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [AvatarComponent],
    template: `
        <mona-avatar
            [backgroundColor]="backgroundColor()"
            [borderColor]="borderColor()"
            [borderRadius]="borderRadius()"
            [borderWidth]="borderWidth()"
            [height]="height()"
            [image]="image()"
            [label]="label()"
            [labelColor]="labelColor()"
            [labelFontSize]="labelFontSize()"
            [labelFontWeight]="labelFontWeight()"
            [width]="width()"></mona-avatar>
    `
})
export class AvatarWrapperComponent implements ComponentInputsAsSignal<AvatarComponent> {
    public readonly backgroundColor = input("#f0f0f0");
    public readonly borderColor = input("#121315");
    public readonly borderRadius = input("0", {
        transform: (value: string | number) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });
    public readonly borderWidth = input("1px", {
        transform: (value: string | number) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });
    public readonly height = input("64px", {
        transform: (value: string | number) => {
            if (typeof value === "string") {
                return value;
            }
            return `${value}px`;
        }
    });
    public readonly image = input(
        "https://photos.smugmug.com/photos/i-fgmzcP4/0/LcnnHTpqhgGgTjHtbmvtjgmLWrVH2JhVGckRnpZqq/Th/i-fgmzcP4-Th.png"
    );
    public readonly label = input("User Name");
    public readonly labelColor = input("#000000");
    public readonly labelFontSize = input("1.2em");
    public readonly labelFontWeight = input("normal");
    public readonly width = input("64px", {
        transform: (value: string | number) => {
            if (typeof value === "string") {
                return value;
            }
            return `${value}px`;
        }
    });
}
