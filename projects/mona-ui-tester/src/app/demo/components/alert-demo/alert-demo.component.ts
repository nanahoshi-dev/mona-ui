import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, input } from "@angular/core";
import { AlertComponent } from "@nanahoshi/mona-ui/alert";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-alert-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./alert-demo.component.html"
})
export class AlertDemoComponent extends AbstractDemoComponent<AlertComponent> {
    protected readonly config = computed<ComponentConfig<AlertComponent>>(() => ({
        inputs: deriveInputConfig<AlertComponent>(this.metadata(), {
            announce: {
                type: "dropdown",
                value: ["off", "polite", "assertive"],
                defaultValue: "off"
            },
            look: {
                type: "dropdown",
                value: ["info", "success", "warning", "error", "neutral"],
                defaultValue: "info"
            },
            title: {
                type: "string",
                value: "Scheduled maintenance"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("AlertComponent");
    protected readonly wrapperComponent = AlertWrapperComponent;
}

@Component({
    imports: [AlertComponent],
    templateUrl: "./alert-demo-wrapper.component.html",
    host: {
        class: "w-full max-w-xl"
    }
})
class AlertWrapperComponent implements ComponentInputsAsSignal<AlertComponent> {
    public readonly announce = input<ReturnType<AlertComponent["announce"]>>("off");
    public readonly dismissLabel = input("");
    public readonly dismissible = input(false, { transform: booleanAttribute });
    public readonly look = input<ReturnType<AlertComponent["look"]>>("info");
    public readonly showIcon = input(true, { transform: booleanAttribute });
    public readonly title = input("Scheduled maintenance");
    public readonly userClass = input<string, ClassInputType>("", {
        transform: value => classInputToClass(value)
    });
}
