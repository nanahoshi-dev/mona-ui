import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { NgComponentOutlet } from "@angular/common";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { ListBoxComponent, ToolbarAction, ToolbarOptions } from "mona-ui";
import { ComponentConfig, type ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { dropdownFoodData } from "../../../../assets/dropdown.data";

@Component({
    selector: "app-list-box-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./list-box-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListBoxDemoComponent extends AbstractDemoComponent<ListBoxComponent> {
    readonly #injector = createFeatureInjector({
        customizedToolbar: {
            active: false,
            code: ``,
            codeVisible: false,
            hasCode: false,
            name: "Customized Toolbar",
            description: "Customize the toolbar",
            subFeatures: {
                moveDown: {
                    active: true,
                    code: ``,
                    codeVisible: false,
                    hasCode: false,
                    name: "Move Down",
                    description: "Display move down button"
                },
                moveUp: {
                    active: true,
                    code: ``,
                    codeVisible: false,
                    hasCode: false,
                    name: "Move Up",
                    description: "Display move up button"
                },
                position: {
                    active: false,
                    code: ``,
                    codeVisible: false,
                    hasCode: false,
                    name: "Position",
                    description: "Set the position of the toolbar",
                    type: "dropdown",
                    dropdownDataSource: ["left", "right", "top", "bottom"],
                    dropdownValue: "right"
                },
                remove: {
                    active: false,
                    code: ``,
                    codeVisible: false,
                    hasCode: false,
                    name: "Remove",
                    description: "Display remove button"
                },
                transferAllFrom: {
                    active: true,
                    code: ``,
                    codeVisible: false,
                    hasCode: false,
                    name: "Transfer All From",
                    description: "Display transfer all from button"
                },
                transferAllTo: {
                    active: true,
                    code: ``,
                    codeVisible: false,
                    hasCode: false,
                    name: "Transfer All To",
                    description: "Display transfer all to button"
                },
                transferFrom: {
                    active: true,
                    code: ``,
                    codeVisible: false,
                    hasCode: false,
                    name: "Transfer From",
                    description: "Display transfer from button"
                },
                transferTo: {
                    active: true,
                    code: ``,
                    codeVisible: false,
                    hasCode: false,
                    name: "Transfer To",
                    description: "Display transfer to button"
                }
            }
        }
    });
    protected readonly config = signal<ComponentConfig<ListBoxComponent>>({
        code: ``,
        inputs: {
            connectedList: {
                type: "object"
            },
            height: {
                type: "string",
                value: "320px"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            textField: {
                type: "string",
                value: "text"
            },
            toolbar: {
                type: "dropdown",
                value: [true, false],
                defaultValue: true
            },
            width: {
                type: "string",
                value: "280px"
            }
        },
        outputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ListBoxComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly ListBoxWrapperComponent = ListBoxWrapperComponent;
}

@Component({
    imports: [ListBoxComponent],
    template: `
        <mona-list-box
            [connectedList]="connectedList"
            [height]="height()"
            [items]="viewItems()"
            [rounded]="rounded()"
            [size]="size()"
            [textField]="textField()"
            [toolbar]="toolbarCustomizations()"
            [width]="width()"></mona-list-box>

        <mona-list-box
            [height]="height()"
            [rounded]="rounded()"
            [size]="size()"
            [textField]="textField()"
            [toolbar]="false"
            [width]="width()"
            #connectedList></mona-list-box>
    `,
    host: {
        class: "flex gap-1"
    }
})
class ListBoxWrapperComponent implements ComponentInputsAsSignal<ListBoxComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly toolbarCustomizations = computed(() => {
        const toolbar = this.toolbar();
        const features = this.features();
        const customizedToolbarActive = features["customizedToolbar"].active;
        const customizedToolbar = features["customizedToolbar"].subFeatures || {};
        if (!customizedToolbarActive) {
            return toolbar;
        }
        const actions: ToolbarAction[] = [];
        if (customizedToolbar["moveDown"].active) {
            actions.push("moveDown");
        }
        if (customizedToolbar["moveUp"].active) {
            actions.push("moveUp");
        }
        if (customizedToolbar["remove"].active) {
            actions.push("remove");
        }
        if (customizedToolbar["transferAllFrom"].active) {
            actions.push("transferAllFrom");
        }
        if (customizedToolbar["transferAllTo"].active) {
            actions.push("transferAllTo");
        }
        if (customizedToolbar["transferFrom"].active) {
            actions.push("transferFrom");
        }
        if (customizedToolbar["transferTo"].active) {
            actions.push("transferTo");
        }
        const position = customizedToolbar["position"].dropdownValue;
        return { actions, position } as ToolbarOptions;
    });
    protected readonly viewItems = computed(() => dropdownFoodData);
    public readonly connectedList = input<ReturnType<ListBoxComponent["connectedList"]>>(null);
    public readonly height = input<ReturnType<ListBoxComponent["height"]>>("100%");
    // public readonly items = input<ReturnType<ListBoxComponent["items"]>>(new List());
    public readonly rounded = input<ReturnType<ListBoxComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<ListBoxComponent["size"]>>("medium");
    public readonly textField = input<ReturnType<ListBoxComponent["textField"]>>("");
    public readonly toolbar = input<ReturnType<ListBoxComponent["toolbar"]>>(true);
    public readonly width = input<ReturnType<ListBoxComponent["width"]>>("100%");
}
