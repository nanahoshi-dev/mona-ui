import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { AvatarComponent } from "mona-ui";
import { ComponentConfig } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-avatar-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./avatar-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarDemoComponent extends AbstractDemoComponent<AvatarComponent> {
    protected readonly config = signal<ComponentConfig<AvatarComponent>>({
        backgroundColor: {
            type: "color",
            description: "Background color of the avatar",
            value: "#f0f0f0"
        },
        borderColor: {
            type: "color",
            description: "Border color of the avatar",
            value: "#121315"
        },
        borderRadius: {
            type: "number",
            description: "Border radius of the avatar",
            value: 50
        },
        borderWidth: {
            type: "number",
            description: "Border width of the avatar",
            value: 4
        },
        height: {
            type: "number",
            description: "Height of the avatar in pixels",
            value: 100
        },
        image: {
            type: "string",
            description: "Image URL for the avatar",
            value: "https://photos.smugmug.com/photos/i-fgmzcP4/0/LcnnHTpqhgGgTjHtbmvtjgmLWrVH2JhVGckRnpZqq/Th/i-fgmzcP4-Th.png"
        },
        label: {
            type: "string",
            description: "Label for the avatar",
            value: "User Name"
        },
        labelColor: {
            type: "color",
            description: "Color of the label text",
            value: "#000000"
        },
        labelFontSize: {
            type: "string",
            description: "Font size of the label text in pixels",
            value: "16"
        },
        labelFontWeight: {
            type: "string",
            description: "Font weight of the label text",
            value: "normal"
        },
        width: {
            type: "number",
            description: "Width of the avatar in pixels",
            value: 100
        }
    });
    protected readonly AvatarComponent = AvatarComponent;
}
