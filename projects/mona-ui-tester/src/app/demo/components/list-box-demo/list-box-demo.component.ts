import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { NgComponentOutlet } from "@angular/common";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { ListBoxComponent } from "mona-ui";
import { ComponentConfig, type ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { List } from "@mirei/ts-collections";
import { dropdownFoodData } from "../../../../assets/dropdown.data";

@Component({
    selector: "app-list-box-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./list-box-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListBoxDemoComponent extends AbstractDemoComponent<ListBoxComponent> {
    readonly #injector = createFeatureInjector({});
    protected readonly config = signal<ComponentConfig<ListBoxComponent>>({
        code: ``,
        inputs: {
            connectedList: {
                type: "object"
            },
            height: {
                type: "string",
                value: "300px"
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
                value: "200px"
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
            [height]="height()"
            [items]="viewItems()"
            [rounded]="rounded()"
            [size]="size()"
            [textField]="textField()"
            [toolbar]="toolbar()"
            [width]="width()"></mona-list-box>
    `
})
class ListBoxWrapperComponent implements ComponentInputsAsSignal<ListBoxComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
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
