import { ChangeDetectionStrategy, Component, computed, inject, input, signal, viewChild } from "@angular/core";
import { LucideBox } from "@lucide/angular";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { CurrencyPipe, NgComponentOutlet } from "@angular/common";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { moveIndices } from "@nanahoshi/mona-ui/common";
import {
    ListBoxActionEvent,
    ListBoxComponent,
    ListBoxFooterTemplateDirective,
    ListBoxHeaderTemplateDirective,
    ListBoxItemTemplateDirective,
    ListBoxNoDataTemplateDirective,
    ListBoxSelectionEvent,
    ToolbarAction,
    ToolbarOptions
} from "@nanahoshi/mona-ui/list-box";
import { ComponentConfig, type ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { dropdownFoodData } from "../../../../assets/dropdown.data";
import { ImmutableSet, toImmutableSet } from "@mirei/ts-collections";

@Component({
    selector: "app-list-box-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./list-box-demo.component.html"
})
export class ListBoxDemoComponent extends AbstractDemoComponent<ListBoxComponent> {
    readonly #injector = createFeatureInjector({
        connectedLists: {
            active: true,
            name: "Connected Lists",
            description: "Display connected lists"
        },
        customizedToolbar: {
            active: false,
            codeVisible: false,
            hasCode: false,
            name: "Customized Toolbar",
            description: "Customize the toolbar",
            subFeatures: {
                clear: {
                    active: true,
                    code: ``,
                    codeVisible: false,
                    hasCode: false,
                    name: "Clear",
                    description: "Display clear button"
                },
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
                    active: true,
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
        },
        footerTemplate: {
            active: false,
            name: "Footer Template",
            description: "Display footer template"
        },
        headerTemplate: {
            active: false,
            name: "Header Template",
            description: "Display header template"
        },
        itemTemplate: {
            active: false,
            name: "Item Template",
            description: "Display item template"
        },
        noDataTemplate: {
            active: false,
            name: "No Data Template",
            description: "This template sets the view when the list box is empty."
        }
    });
    protected readonly config = signal<ComponentConfig<ListBoxComponent>>({
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
            selectBy: {
                type: "dropdown",
                value: ["value"],
                defaultValue: "value"
            },

            selectionMode: {
                type: "dropdown",
                value: ["single", "multiple"],
                defaultValue: "single"
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
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ListBoxComponent");
    protected readonly ListBoxWrapperComponent = ListBoxWrapperComponent;
}

@Component({
    imports: [
        ListBoxComponent,
        ListBoxItemTemplateDirective,
        CurrencyPipe,
        ListBoxNoDataTemplateDirective,
        ListBoxHeaderTemplateDirective,
        ListBoxFooterTemplateDirective,
        LucideBox
    ],
    template: `
        @let featureData = features();
        <mona-list-box
            (actionClick)="onActionClick($event, 'first')"
            [selectBy]="selectBy()"
            [selectionMode]="selectionMode()"
            [selectedKeys]="firstListSelectedKeys()"
            (selectedKeysChange)="onSelectedKeysChange($event, 'first')"
            (selectionChange)="onSelectionChange($event, 'first')"
            [connectedList]="secondListBox() ?? null"
            [height]="height()"
            [items]="viewItems()"
            [rounded]="rounded()"
            [size]="size()"
            [textField]="textField()"
            [toolbar]="toolbarCustomizations()"
            [width]="width()">
            @if (featureData["headerTemplate"].active) {
                <ng-template monaListBoxHeaderTemplate>
                    <div class="px-3 py-2 border-b border-input-border font-medium">Food Items</div>
                </ng-template>
            }
            @if (featureData["footerTemplate"].active) {
                <ng-template monaListBoxFooterTemplate>
                    <div class="px-3 py-2 border-t border-input-border text-sm text-muted-foreground">
                        Total items: {{ viewItems().length }}
                    </div>
                </ng-template>
            }

            @if (featureData["itemTemplate"].active) {
                <ng-template monaListBoxItemTemplate let-item>
                    <div class="flex flex-row w-full">
                        @let color = item.price > 7 ? "text-amber-600" : item.price < 3 ? "text-emerald-700" : "";
                        <span class="flex-1 flex items-center {{ color }}">{{ item.text }}</span>
                        <span class="inline-flex items-center justify-center invert text-xs text-gray-500">{{
                            item.price | currency
                        }}</span>
                    </div>
                </ng-template>
            }
            @if (featureData["noDataTemplate"].active) {
                <ng-template monaListBoxNoDataTemplate>
                    <div class="flex flex-col items-center select-none justify-center w-full h-full gap-2 opacity-30">
                        <svg lucideBox></svg>
                        <span>List box has no items.</span>
                    </div>
                </ng-template>
            }
        </mona-list-box>

        @if (connectedListsVisible()) {
            <mona-list-box
                (actionClick)="onActionClick($event, 'second')"
                [selectBy]="selectBy()"
                [selectionMode]="selectionMode()"
                [selectedKeys]="secondListSelectedKeys()"
                (selectedKeysChange)="onSelectedKeysChange($event, 'second')"
                (selectionChange)="onSelectionChange($event, 'second')"
                [height]="height()"
                [items]="secondListBoxItems()"
                [rounded]="rounded()"
                [size]="size()"
                [textField]="textField()"
                [toolbar]="true"
                [width]="width()"
                #secondList></mona-list-box>
        }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: "flex flex-row! gap-1"
    }
})
class ListBoxWrapperComponent implements ComponentInputsAsSignal<ListBoxComponent> {
    #listData = signal(ImmutableSet.create(dropdownFoodData));
    protected readonly connectedListsVisible = computed(() => {
        const features = this.features();
        return features["connectedLists"].active;
    });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly firstListSelectedKeys = signal(ImmutableSet.create<unknown>([]));
    protected readonly secondListBox = viewChild<ListBoxComponent<(typeof dropdownFoodData)[0]>>("secondList");
    protected readonly secondListBoxItems = signal(ImmutableSet.create<(typeof dropdownFoodData)[0]>());
    protected readonly secondListSelectedKeys = signal(ImmutableSet.create<unknown>([]));
    protected readonly toolbarCustomizations = computed(() => {
        const toolbar = this.toolbar();
        const features = this.features();
        const customizedToolbarActive = features["customizedToolbar"].active;
        const customizedToolbar = features["customizedToolbar"].subFeatures || {};
        if (!customizedToolbarActive) {
            return toolbar;
        }
        const actions: ToolbarAction[] = [];
        if (customizedToolbar["clear"].active) {
            actions.push("clear");
        }
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
    protected readonly viewItems = computed(() => this.#listData());
    public readonly connectedList = input<ReturnType<ListBoxComponent["connectedList"]>>(null);
    public readonly height = input<ReturnType<ListBoxComponent["height"]>>("100%");
    public readonly rounded = input<ReturnType<ListBoxComponent["rounded"]>>("medium");
    public readonly selectBy = input<ReturnType<ListBoxComponent["selectBy"]>>("value");
    public readonly selectionMode = input<ReturnType<ListBoxComponent["selectionMode"]>>("single");
    public readonly size = input<ReturnType<ListBoxComponent["size"]>>("medium");
    public readonly textField = input<ReturnType<ListBoxComponent["textField"]>>("");
    public readonly toolbar = input<ReturnType<ListBoxComponent["toolbar"]>>(true);
    public readonly width = input<ReturnType<ListBoxComponent["width"]>>("100%");

    protected onActionClick(
        event: ListBoxActionEvent<(typeof dropdownFoodData)[0]>,
        listBox: "first" | "second"
    ): void {
        if (event.action === "moveDown" || event.action === "moveUp") {
            const dataToProcess = listBox === "first" ? this.#listData : this.secondListBoxItems;
            dataToProcess.update(data => {
                const newData = [...data];
                return toImmutableSet(
                    moveIndices(newData, event.selectedIndices, event.action === "moveDown" ? 1 : -1)
                );
            });
        } else if (event.action === "transferTo") {
            if (listBox === "first") {
                this.secondListBoxItems.update(set => set.addAll(event.selectedItems));
                this.#listData.update(set => set.removeAll(event.selectedItems));
            } else {
                this.secondListBoxItems.update(set => set.removeAll(event.selectedItems));
            }
        } else if (event.action === "transferFrom") {
            if (listBox === "second") {
                this.#listData.update(set => set.addAll(event.selectedItems));
                this.secondListBoxItems.update(set => set.removeAll(event.selectedItems));
            }
        } else if (event.action === "transferAllTo") {
            if (listBox === "first") {
                this.secondListBoxItems.update(set => set.addAll(this.#listData()));
                this.#listData.update(set => set.clear());
            } else {
                this.secondListBoxItems.update(set => set.clear());
            }
        } else if (event.action === "transferAllFrom") {
            if (listBox === "second") {
                this.#listData.update(set => set.addAll(this.secondListBoxItems()));
                this.secondListBoxItems.update(set => set.clear());
            }
        } else if (event.action === "remove") {
            if (listBox === "first") {
                this.#listData.update(set => set.removeAll(event.selectedItems));
            } else {
                this.secondListBoxItems.update(set => set.removeAll(event.selectedItems));
            }
        }
    }

    protected onSelectedKeysChange(keys: unknown[], listBox: "first" | "second"): void {
        if (listBox === "first") {
            this.firstListSelectedKeys.set(ImmutableSet.create(keys));
        } else {
            this.secondListSelectedKeys.set(ImmutableSet.create(keys));
        }
    }

    protected onSelectionChange(event: ListBoxSelectionEvent, listBox: "first" | "second"): void {
        console.log(listBox, event);
    }
}
