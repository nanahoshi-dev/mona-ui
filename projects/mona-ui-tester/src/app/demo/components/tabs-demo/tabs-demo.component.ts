import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, inject, input, model, signal } from "@angular/core";
import { range } from "@mirei/ts-collections";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { moveItem } from "@nanahoshi/mona-ui/sortable";
import {
    TabCloseEvent,
    TabComponent,
    TabContentTemplateDirective,
    TabReorderEvent,
    TabsComponent,
    TabSelectEvent
} from "@nanahoshi/mona-ui/tabs";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-tabs-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./tabs-demo.component.html"
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
    protected readonly config = computed<ComponentConfig<TabsComponent>>(() => ({
        inputs: deriveInputConfig<TabsComponent>(this.metadata(), {
            ariaLabel: {
                alias: "aria-label",
                type: "string",
                value: ""
            },
            ariaLabelledBy: {
                alias: "aria-labelledby",
                type: "string",
                value: ""
            },
            position: {
                type: "dropdown",
                value: ["top", "bottom", "left", "right"],
                defaultValue: "top"
            },
            selectedIndex: {
                type: "number",
                value: 0,
                min: 0,
                max: 21
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("TabsComponent");
    protected readonly wrapperComponent = TabsWrapperComponent;
}

@Component({
    imports: [TabsComponent, TabComponent, TabContentTemplateDirective, TextBoxComponent, ButtonDirective],
    template: `
        <mona-tabs
            [aria-label]="ariaLabel()"
            [aria-labelledby]="ariaLabelledBy()"
            [closable]="closable()"
            [disabled]="disabled()"
            [keepTabContent]="keepTabContent()"
            [position]="position()"
            [(selectedIndex)]="selectedIndex"
            [size]="size()"
            [sortable]="sortable()"
            (tabClose)="onTabClose($event)"
            (tabReorder)="onTabReorder($event)"
            (tabSelect)="onTabSelect($event)"
            [class]="'w-96 ' + userClass()"
            [class.h-96]="position() === 'left' || position() === 'right'">
            @for (key of tabKeys(); track key) {
                @if (key === "register") {
                    <mona-tab title="Register">
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
                                    <span class="absolute bg-background px-1 text-sm text-muted-foreground"
                                        >OR CONTINUE WITH</span
                                    >
                                </div>
                                <div class="flex flex-col gap-1">
                                    <button monaButton>Custom Login 1</button>
                                    <button monaButton>Custom Login 2</button>
                                </div>
                            </div>
                        </ng-template>
                    </mona-tab>
                } @else if (key === "login") {
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
                } @else {
                    @let tabNumber = key;
                    <mona-tab [title]="'Tab ' + tabNumber">
                        <ng-template monaTabContentTemplate>
                            <div class="p-4">
                                <h3 class="text-lg font-semibold mb-2">Content of Tab {{ tabNumber }}</h3>
                                <p>This is the content area for Tab {{ tabNumber }}.</p>
                            </div>
                        </ng-template>
                    </mona-tab>
                }
            }
        </mona-tabs>
    `
})
export class TabsWrapperComponent implements ComponentInputsAsSignal<TabsComponent> {
    readonly #closedTabNumbers = signal<readonly number[]>([]);
    /** The order the user dragged the tabs into; tabs it doesn't name yet follow, in their own order. */
    readonly #order = signal<readonly (number | string)[]>([]);
    protected readonly features = inject(FeatureConfigHandler).data;
    /** The tabs in the order they're shown: Register, Login and the numbered tabs, as reordered. */
    protected readonly tabKeys = computed<readonly (number | string)[]>(() => {
        const keys = ["register", "login", ...this.tabNumbers()];
        const order = this.#order().filter(key => keys.includes(key));
        return [...order, ...keys.filter(key => !order.includes(key))];
    });
    protected readonly tabNumbers = computed(() => {
        const tabCount = this.features()["tabCount"]?.numericValue ?? 0;
        const closed = this.#closedTabNumbers();
        return range(1, tabCount)
            .where(tabNumber => !closed.includes(tabNumber))
            .toArray();
    });
    public readonly ariaLabel = input("");
    public readonly ariaLabelledBy = input("");
    public readonly closable = input(false, { transform: booleanAttribute });
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly keepTabContent = input(true, { transform: booleanAttribute });
    public readonly position = input<ReturnType<TabsComponent["position"]>>("top");
    public readonly selectedIndex = model(0);
    public readonly size = input<ReturnType<TabsComponent["size"]>>("medium");
    public readonly sortable = input(false, { transform: booleanAttribute });
    public readonly userClass = input<ReturnType<TabsComponent["userClass"]>>("");

    protected onTabClose(event: TabCloseEvent): void {
        console.log("Tab closed", event);
        // The tabs don't remove themselves. Register and Login stay, so there's always something to come back to.
        const tabNumber = this.tabKeys()[event.index];
        if (typeof tabNumber === "number") {
            this.#closedTabNumbers.update(closed => [...closed, tabNumber]);
        }
    }

    protected onTabReorder(event: TabReorderEvent): void {
        // The tabs don't move themselves either: reorder what renders them.
        this.#order.set(moveItem(this.tabKeys(), event.previousIndex, event.currentIndex));
    }

    protected onTabSelect(event: TabSelectEvent): void {
        console.log("Tab selected", event);
    }
}
