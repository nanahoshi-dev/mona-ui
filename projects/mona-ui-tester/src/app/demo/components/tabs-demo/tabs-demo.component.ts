import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { range } from "@mirei/ts-collections";

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
        <mona-tabs [closable]="closable()" [keepTabContent]="keepTabContent()" [rounded]="rounded()" class="w-full">
            @for (tabNumber of tabNumbers; track $index) {
                <mona-tab [title]="'Tab ' + tabNumber" [selected]="tabNumber === 1">
                    <ng-template monaTabContentTemplate>
                        <div class="p-4">
                            <h3 class="text-lg font-semibold mb-2">Content of Tab {{ tabNumber }}</h3>
                            <p>This is the content area for Tab {{ tabNumber }}.</p>
                        </div>
                    </ng-template>
                </mona-tab>
            }
        </mona-tabs>
    `,
    host: {
        class: "w-full flex items-center justify-center"
    }
})
export class TabsWrapperComponent implements ComponentInputsAsSignal<TabsComponent> {
    protected readonly tabNumbers = range(1, 20).toImmutableSet();
    public readonly closable = input<ReturnType<TabsComponent["closable"]>>(false);
    public readonly keepTabContent = input<ReturnType<TabsComponent["keepTabContent"]>>(false);
    public readonly rounded = input<ReturnType<TabsComponent["rounded"]>>("large");
}
