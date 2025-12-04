import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-tabs-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./tabs-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsDemoComponent extends AbstractDemoComponent<TabsComponent> {
    readonly #injector = createFeatureInjector({});
    protected readonly config = signal<ComponentConfig<TabsComponent>>({
        code: ``,
        inputs: {
            closable: {
                type: "boolean",
                value: false
            },
            keepTabContent: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "large"
            }
        },
        outputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("TabsComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata(["TabComponent"]);
    protected readonly TabsWrapperComponent = TabsWrapperComponent;
}

@Component({
    imports: [TabsComponent, TabComponent, TabContentTemplateDirective],
    template: `
        <mona-tabs [closable]="closable()" [keepTabContent]="keepTabContent()" [rounded]="rounded()">
            <mona-tab [title]="'Tab 1'">
                <ng-template monaTabContentTemplate> Content for Tab 1 </ng-template>
            </mona-tab>
            <mona-tab [title]="'Tab 2'" [selected]="true">
                <ng-template monaTabContentTemplate> Content for Tab 2 </ng-template>
            </mona-tab>
            <mona-tab [title]="'Tab 3'">
                <ng-template monaTabContentTemplate> Content for Tab 3 </ng-template>
            </mona-tab>
        </mona-tabs>
    `
})
export class TabsWrapperComponent implements ComponentInputsAsSignal<TabsComponent> {
    public readonly closable = input<ReturnType<TabsComponent["closable"]>>(false);
    public readonly keepTabContent = input<ReturnType<TabsComponent["keepTabContent"]>>(false);
    public readonly rounded = input<ReturnType<TabsComponent["rounded"]>>("large");
}
