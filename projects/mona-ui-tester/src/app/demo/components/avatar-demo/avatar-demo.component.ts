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
    protected readonly AvatarComponent = AvatarComponent;
    protected readonly config = signal<ComponentConfig<AvatarComponent>>({
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
                value: "0.35em"
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
}
