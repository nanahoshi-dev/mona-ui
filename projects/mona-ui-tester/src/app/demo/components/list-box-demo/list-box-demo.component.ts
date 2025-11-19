import { ChangeDetectionStrategy, Component, computed, inject, input, signal, viewChild } from "@angular/core";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { CurrencyPipe, NgComponentOutlet } from "@angular/common";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import {
    ListBoxActionEvent,
    ListBoxComponent,
    ListBoxItemTemplateDirective,
    ListBoxNoDataTemplateDirective,
    ListBoxSelectionEvent,
    moveIndices,
    ToolbarAction,
    ToolbarOptions
} from "mona-ui";
import { ComponentConfig, type ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { dropdownFoodData } from "../../../../assets/dropdown.data";
import { ImmutableSet, toImmutableSet } from "@mirei/ts-collections";
import { Box, LucideAngularModule } from "lucide-angular";

@Component({
    selector: "app-list-box-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./list-box-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListBoxDemoComponent extends AbstractDemoComponent<ListBoxComponent> {
    readonly #injector = createFeatureInjector({
        connectedLists: {
            active: true,
            code: ``,
            codeVisible: false,
            hasCode: false,
            name: "Connected Lists",
            description: "Display connected lists"
        },
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
        },
        itemTemplate: {
            active: false,
            code: ``,
            codeVisible: false,
            hasCode: false,
            name: "Item Template",
            description: "Display item template"
        },
        noDataTemplate: {
            active: false,
            code: ``,
            codeVisible: false,
            hasCode: false,
            name: "No Data Template",
            description: "This template sets the view when the list box is empty."
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
        outputs: {
            actionClick: {
                type: "event"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ListBoxComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly ListBoxWrapperComponent = ListBoxWrapperComponent;
}

@Component({
    imports: [
        ListBoxComponent,
        ListBoxItemTemplateDirective,
        CurrencyPipe,
        ListBoxNoDataTemplateDirective,
        LucideAngularModule
    ],
    template: `
        @let featureData = features();
        <mona-list-box
            (actionClick)="onActionClick($event, 'first')"
            [selectBy]="'value'"
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
                        <lucide-angular [name]="boxIcon"></lucide-angular>
                        <span>List box has no items.</span>
                    </div>
                </ng-template>
            }
        </mona-list-box>

        @if (connectedListsVisible()) {
            <mona-list-box
                (actionClick)="onActionClick($event, 'second')"
                [selectedKeys]="secondListSelectedKeys()"
                (selectedKeysChange)="onSelectedKeysChange($event, 'second')"
                (selectionChange)="onSelectionChange($event, 'second')"
                [connectedList]="thirdList"
                [height]="height()"
                [items]="secondListBoxItems()"
                [rounded]="rounded()"
                [size]="size()"
                [textField]="textField()"
                [toolbar]="true"
                [width]="width()"
                #secondList></mona-list-box>

            <mona-list-box
                (actionClick)="onActionClick($event, 'third')"
                (selectionChange)="onSelectionChange($event, 'third')"
                [height]="height()"
                [items]="thirdListBoxItems()"
                [rounded]="rounded()"
                [size]="size()"
                [textField]="textField()"
                [toolbar]="false"
                [width]="width()"
                #thirdList></mona-list-box>
        }
    `,
    host: {
        class: "flex gap-1"
    }
})
class ListBoxWrapperComponent implements ComponentInputsAsSignal<ListBoxComponent> {
    #listData = signal(ImmutableSet.create(dropdownFoodData));
    protected readonly boxIcon = Box;
    protected readonly connectedListsVisible = computed(() => {
        const features = this.features();
        return features["connectedLists"].active;
    });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly firstListSelectedKeys = signal(ImmutableSet.create<unknown>([2, 4]));
    protected readonly secondListBox = viewChild<ListBoxComponent<(typeof dropdownFoodData)[0]>>("secondList");
    protected readonly secondListBoxItems = signal(ImmutableSet.create<(typeof dropdownFoodData)[0]>());
    protected readonly secondListSelectedKeys = signal(ImmutableSet.create<unknown>([]));
    protected readonly thirdListBoxItems = signal(ImmutableSet.create<(typeof dropdownFoodData)[0]>());
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
    protected readonly viewItems = computed(() => this.#listData());
    public readonly connectedList = input<ReturnType<ListBoxComponent["connectedList"]>>(null);
    public readonly height = input<ReturnType<ListBoxComponent["height"]>>("100%");
    public readonly rounded = input<ReturnType<ListBoxComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<ListBoxComponent["size"]>>("medium");
    public readonly textField = input<ReturnType<ListBoxComponent["textField"]>>("");
    public readonly toolbar = input<ReturnType<ListBoxComponent["toolbar"]>>(true);
    public readonly width = input<ReturnType<ListBoxComponent["width"]>>("100%");

    protected onActionClick(
        event: ListBoxActionEvent<(typeof dropdownFoodData)[0]>,
        listBox: "first" | "second" | "third"
    ): void {
        console.log(event);
        if (event.action === "moveDown" || event.action === "moveUp") {
            const dataToProcess =
                listBox === "first"
                    ? this.#listData
                    : listBox === "second"
                      ? this.secondListBoxItems
                      : this.thirdListBoxItems;
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
            } else if (listBox === "second") {
                this.thirdListBoxItems.update(set => set.addAll(event.selectedItems));
                this.secondListBoxItems.update(set => set.removeAll(event.selectedItems));
            }
        } else if (event.action === "transferFrom") {
            if (listBox === "second") {
                this.#listData.update(set => set.addAll(event.selectedItems));
                this.secondListBoxItems.update(set => set.removeAll(event.selectedItems));
            } else if (listBox === "third") {
                this.secondListBoxItems.update(set => set.addAll(event.selectedItems));
                this.thirdListBoxItems.update(set => set.removeAll(event.selectedItems));
            }
        } else if (event.action === "transferAllTo") {
            if (listBox === "first") {
                this.secondListBoxItems.update(set => set.addAll(this.#listData()));
                this.#listData.update(set => set.clear());
            } else if (listBox === "second") {
                this.thirdListBoxItems.update(set => set.addAll(this.secondListBoxItems()));
                this.secondListBoxItems.update(set => set.clear());
            }
        } else if (event.action === "transferAllFrom") {
            if (listBox === "second") {
                this.#listData.update(set => set.addAll(this.secondListBoxItems()));
                this.secondListBoxItems.update(set => set.clear());
            } else if (listBox === "third") {
                this.secondListBoxItems.update(set => set.addAll(this.thirdListBoxItems()));
                this.thirdListBoxItems.update(set => set.clear());
            }
        } else if (event.action === "remove") {
            if (listBox === "first") {
                this.#listData.update(set => set.removeAll(event.selectedItems));
            } else if (listBox === "second") {
                this.secondListBoxItems.update(set => set.removeAll(event.selectedItems));
            } else if (listBox === "third") {
                this.thirdListBoxItems.update(set => set.removeAll(event.selectedItems));
            }
        }
    }

    protected onSelectedKeysChange(keys: unknown[], listBox: "first" | "second" | "third"): void {
        console.log(listBox, keys);
        if (listBox === "first") {
            this.firstListSelectedKeys.set(ImmutableSet.create(keys));
        } else if (listBox === "second") {
            this.secondListSelectedKeys.set(ImmutableSet.create(keys));
        }
    }

    protected onSelectionChange(event: ListBoxSelectionEvent, listBox: "first" | "second" | "third"): void {
        console.log(listBox, event);
    }
}
