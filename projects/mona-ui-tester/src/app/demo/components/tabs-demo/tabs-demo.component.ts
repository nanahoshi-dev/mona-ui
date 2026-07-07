import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import {
    TabCloseEvent,
    TabComponent,
    TabContentTemplateDirective,
    TabSelectEvent,
    TabsComponent
} from "mona-ui/tabs";
import { TextBoxComponent } from "mona-ui/text-box";
import { ButtonDirective } from "mona-ui/button";
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
    readonly #injector = createFeatureInjector({
        tabCount: {
            code: ``,
            active: false,
            name: "Tab Count",
            description: "The number of tabs to display in the tab panel.",
            type: "number",
            numericMin: 0,
            numericMax: 20,
            numericNullable: false,
            numericValue: 0
        }
    });
    protected readonly config = signal<ComponentConfig<TabsComponent>>({
        code: ``,
        inputs: {
            closable: {
                type: "boolean",
                value: false
            },
            keepTabContent: {
                type: "boolean",
                value: true
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "large"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("TabsComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata(["TabComponent"]);
    protected readonly TabsWrapperComponent = TabsWrapperComponent;
}

@Component({
    imports: [TabsComponent, TabComponent, TabContentTemplateDirective, TextBoxComponent, ButtonDirective],
    template: `
        <mona-tabs
            [closable]="closable()"
            [keepTabContent]="keepTabContent()"
            [rounded]="rounded()"
            [size]="size()"
            (tabClose)="onTabClose($event)"
            (tabSelect)="onTabSelect($event)"
            class="w-full max-w-90">
            <mona-tab title="Register" [selected]="true">
                <ng-template monaTabContentTemplate>
                    <div class="p-4 flex flex-col gap-3">
                        <div class="p-4 flex flex-col gap-1 items-center justify-center">
                            <h1 class="text-lg font-extrabold">Create an account</h1>
                            <span class="text-sm">Enter your email below to create your account.</span>
                        </div>
                        <div class="flex flex-col gap-2">
                            <mona-text-box placeholder="user@email.com"></mona-text-box>
                            <button monaButton look="primary">Register</button>
                        </div>
                        <div class="flex items-center justify-center py-1 relative">
                            <div class="flex shrink-0 h-px border-b border-border/90 w-full"></div>
                            <span class="absolute bg-background px-1 text-sm text-gray-400">OR CONTINUE WITH</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <button monaButton>Custom Login 1</button>
                            <button monaButton>Custom Login 2</button>
                        </div>
                    </div>
                </ng-template>
            </mona-tab>
            <mona-tab title="Login">
                <ng-template monaTabContentTemplate>
                    <div class="p-4 pt-8 flex flex-col gap-3">
                        <div class="flex flex-col gap-1 items-center justify-center">
                            <h1 class="text-lg font-extrabold">Login</h1>
                        </div>
                        <div class="flex flex-col gap-2">
                            <mona-text-box placeholder="user@email.com"></mona-text-box>
                            <mona-text-box placeholder="Password" type="password"></mona-text-box>
                            <button monaButton look="primary">Login</button>
                            <button monaButton>Register</button>
                        </div>
                    </div>
                </ng-template>
            </mona-tab>
            @for (tabNumber of tabNumbers(); track $index) {
                <mona-tab [title]="'Tab ' + tabNumber">
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
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: "w-full flex items-center justify-center"
    }
})
export class TabsWrapperComponent implements ComponentInputsAsSignal<TabsComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly tabNumbers = computed(() => {
        const tabCount = this.features()["tabCount"]?.numericValue ?? 0;
        return range(1, tabCount).toImmutableSet();
    });
    public readonly closable = input<ReturnType<TabsComponent["closable"]>>(false);
    public readonly keepTabContent = input<ReturnType<TabsComponent["keepTabContent"]>>(true);
    public readonly rounded = input<ReturnType<TabsComponent["rounded"]>>("large");
    public readonly size = input<ReturnType<TabsComponent["size"]>>("medium");

    protected onTabClose(event: TabCloseEvent): void {
        console.log("Tab closed", event);
    }

    protected onTabSelect(event: TabSelectEvent): void {
        console.log("Tab selected", event);
    }
}
