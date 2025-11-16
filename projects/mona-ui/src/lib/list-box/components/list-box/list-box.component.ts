import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    effect,
    ElementRef,
    inject,
    input,
    output,
    Signal,
    signal,
    TemplateRef,
    untracked
} from "@angular/core";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
    faAngleDown,
    faAngleLeft,
    faAngleRight,
    faAnglesLeft,
    faAnglesRight,
    faAngleUp,
    faTrash
} from "@fortawesome/free-solid-svg-icons";
import { ImmutableList } from "@mirei/ts-collections";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { ListViewComponent } from "../../../list-view/components/list-view/list-view.component";
import { ListViewItemTemplateDirective } from "../../../list-view/directives/list-view-item-template.directive";
import { ListViewNavigableDirective } from "../../../list-view/directives/list-view-navigable.directive";
import { ListViewNoDataTemplateDirective } from "../../../list-view/directives/list-view-no-data-template.directive";
import { ListViewSelectableDirective } from "../../../list-view/directives/list-view-selectable.directive";
import { ContainsPipe } from "../../../pipes/contains.pipe";
import { ListBoxItemTemplateDirective } from "../../directives/list-box-item-template.directive";
import { ListBoxNoDataTemplateDirective } from "../../directives/list-box-no-data-template.directive";
import { ListBoxActionEvent } from "../../models/ListBoxActionClickEvent";
import { ListBoxItemTemplateContext } from "../../models/ListBoxItemTemplateContext";
import { ListBoxSelectionEvent } from "../../models/ListBoxSelectionEvent";
import { ToolbarAction, ToolbarOptions } from "../../models/ToolbarOptions";
import {
    listBoxBaseThemeVariants,
    listBoxToolbarThemeVariants,
    ListBoxVariantInputs,
    ListBoxVariantProps
} from "../../styles/list-box.styles";
import { ThemeService } from "../../../theme/services/theme.service";
import { ListBoxMoveEvent } from "../../models/ListBoxMoveEvent";
import { ListBoxRemoveEvent } from "../../models/ListBoxRemoveEvent";
import { ListBoxTransferEvent } from "../../models/ListBoxTransferEvent";

@Component({
    selector: "mona-list-box",
    templateUrl: "./list-box.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ListViewComponent,
        ListViewSelectableDirective,
        ListViewItemTemplateDirective,
        NgTemplateOutlet,
        ButtonDirective,
        FontAwesomeModule,
        ContainsPipe,
        ListViewNavigableDirective,
        ListViewNoDataTemplateDirective
    ],
    host: {
        "[class]": "baseClasses()",
        "[style.height]": "listHeight()",
        "[style.width]": "listWidth()"
    }
})
export class ListBoxComponent<T = any> implements ListBoxVariantInputs {
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    protected readonly activeListBox: Signal<ListBoxComponent<T> | null> = computed(() => {
        const selectedItems = this.selectedItems();
        if (selectedItems.any()) {
            return this;
        }
        const connectedList = this.connectedList();
        if (connectedList?.selectedItems().any()) {
            return connectedList;
        }
        return this;
    });
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const toolbarOptions = this.toolbarOptions();
        const position = toolbarOptions?.position ?? "right";
        const direction = position === "left" || position === "right" ? "horizontal" : "vertical";
        const reversed = position === "left" || position === "top";
        return listBoxBaseThemeVariants(theme)({ direction, reversed, rounded, size });
    });
    protected readonly itemTemplate: Signal<TemplateRef<ListBoxItemTemplateContext> | undefined> = contentChild(
        ListBoxItemTemplateDirective,
        { read: TemplateRef }
    );
    protected readonly listHeight = computed(() => {
        const height = this.height();
        return typeof height === "number" ? `${height}px` : height;
    });
    protected readonly listWidth = computed(() => {
        const width = this.width();
        return typeof width === "number" ? `${width}px` : width;
    });
    protected readonly moveDownIcon = faAngleDown;
    protected readonly moveUpIcon = faAngleUp;
    protected readonly noDataTemplate = contentChild(ListBoxNoDataTemplateDirective, { read: TemplateRef });
    protected readonly removeIcon = faTrash;
    protected readonly transferAllFromIcon = faAnglesLeft;
    protected readonly transferAllToIcon = faAnglesRight;
    protected readonly transferFromIcon = faAngleLeft;
    protected readonly transferToIcon = faAngleRight;
    protected readonly toolbarClasses = computed(() => {
        const theme = this.#themeService.theme();
        const toolbarOptions = this.toolbarOptions();
        const position = toolbarOptions?.position ?? "right";
        const direction = position === "left" || position === "right" ? "vertical" : "horizontal";
        return listBoxToolbarThemeVariants(theme)({ direction });
    });
    protected readonly toolbarOptions = computed(() => {
        const toolbar = this.toolbar();
        if (typeof toolbar === "boolean") {
            return toolbar ? this.getDefaultToolbarOptions() : null;
        }
        return this.updateToolbarOptions(toolbar);
    });

    public readonly actionClick = output<ListBoxActionEvent>();
    public readonly connectedList = input<ListBoxComponent<T> | null>(null);

    /**
     * @description Sets the height of the list box.
     * @default 100%
     */
    public readonly height = input<string | number>("100%");
    public readonly items = input<Iterable<T>>([]);
    public readonly listBoxItems = signal(ImmutableList.create<T>());
    public readonly rounded = input<ListBoxVariantProps["rounded"]>("medium");
    public readonly selectionChange = output<ListBoxSelectionEvent>();
    public readonly selectedItems = signal(ImmutableList.create<T>());
    public readonly size = input<ListBoxVariantProps["size"]>("medium");
    public readonly textField = input("");
    public readonly toolbar = input<boolean | Partial<ToolbarOptions>>(true);
    public readonly width = input<string | number>("100%");

    public constructor() {
        effect(() => {
            const items = this.items();
            untracked(() => this.listBoxItems.set(ImmutableList.create(items)));
        });
        effect(() => {
            const connectedList = this.connectedList();
            if (!connectedList) {
                return;
            }
            connectedList.selectionChange.subscribe(() => {
                untracked(() => this.selectedItems.update(list => list.clear()));
            });
        });
    }

    public onMoveClick(direction: Extract<ToolbarAction, "moveDown" | "moveUp">, event: MouseEvent): void {
        const activeListBox = this.getActiveListBox();
        if (!activeListBox) {
            return;
        }

        const selectedItems = activeListBox.selectedItems();
        if (selectedItems.none()) {
            const moveEvent = new ListBoxMoveEvent(direction, [], [], -1, -1, event);
            activeListBox.actionClick.emit(moveEvent);
            return;
        }

        const listBoxItems = activeListBox.listBoxItems();
        const startIndex = listBoxItems.indexOf(selectedItems.elementAt(0));
        const endIndex = listBoxItems.indexOf(selectedItems.elementAt(selectedItems.length - 1));

        let newMoveIndex: number;
        if (direction === "moveDown") {
            if (endIndex >= listBoxItems.length - 1) {
                return;
            }
            newMoveIndex = endIndex + 1;
        } else {
            if (startIndex <= 0) {
                return;
            }
            newMoveIndex = startIndex - 1;
        }

        const selectedIndices = selectedItems.select(item => listBoxItems.indexOf(item)).toArray();
        const moveEvent = new ListBoxMoveEvent(
            direction,
            selectedItems,
            selectedIndices,
            startIndex,
            newMoveIndex,
            event
        );

        activeListBox.actionClick.emit(moveEvent);

        if (!moveEvent.isDefaultPrevented()) {
            activeListBox.scrollToSelectedItem();
        }
    }

    public onRemoveClick(event: MouseEvent): void {
        const listBox = this.activeListBox();
        if (!listBox) {
            return;
        }
        const selectedItems = listBox.selectedItems();
        if (selectedItems.none()) {
            return;
        }
        const removeEvent = new ListBoxRemoveEvent("remove", selectedItems, event);
        listBox.actionClick.emit(removeEvent);
        if (!removeEvent.isDefaultPrevented()) {
            listBox.scrollToSelectedItem();
        }
    }

    public onSelectedItemChange(items: T[]): void {
        const oldSelectedItems = this.selectedItems()
            .toArray()
            .filter(i => !items.includes(i));
        const newSelectedItems = items.filter(i => !oldSelectedItems.includes(i));
        this.selectedItems.update(list => list.clear().addAll(items));
        this.connectedList()?.selectedItems.update(list => list.clear());
        this.activeListBox()?.selectionChange.emit({
            deselectedItems: oldSelectedItems,
            selectedItems: newSelectedItems
        });
    }

    public onTransferClick(
        action: Extract<ToolbarAction, "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo">,
        event: MouseEvent
    ): void {
        const connectedList = this.connectedList();
        if (!connectedList) {
            return;
        }
        const sourceList = this.activeListBox();
        const targetList = this.activeListBox() === connectedList ? this : connectedList;
        if (!sourceList || !targetList) {
            return;
        }
        const selectedItems = sourceList.selectedItems();
        const transferEvent = new ListBoxTransferEvent(action, selectedItems, event);
        if (action === "transferFrom" || action === "transferAllFrom") {
            connectedList.actionClick.emit(transferEvent);
        } else {
            sourceList.actionClick.emit(transferEvent);
        }
        if (!transferEvent.isDefaultPrevented()) {
            sourceList.selectedItems.update(set => set.clear());
            targetList.selectedItems.update(set => set.clear());
            targetList.scrollToSelectedItem();
        }
    }

    private getActiveListBox(): ListBoxComponent<T> | null {
        if (this.selectedItems().any()) {
            return this;
        }
        if (this.connectedList() != null) {
            return this.connectedList()!.getActiveListBox();
        }
        return null;
    }

    private getDefaultToolbarOptions(): ToolbarOptions {
        return {
            actions: ["moveDown", "moveUp", "remove", "transferAllFrom", "transferAllTo", "transferFrom", "transferTo"],
            position: "right"
        };
    }

    private scrollToSelectedItem(): void {
        const selectedItemElement = this.#hostElementRef.nativeElement.querySelector("[data-selected='true']");
        if (selectedItemElement) {
            selectedItemElement.scrollIntoView({ behavior: "auto", block: "center" });
        }
    }

    private updateToolbarOptions(options: boolean | Partial<ToolbarOptions>): ToolbarOptions | null {
        if (typeof options === "boolean") {
            return options ? this.getDefaultToolbarOptions() : null;
        }
        const position = options.position ?? "right";
        let actions: ToolbarAction[];
        if (options.actions && options.actions.length > 0) {
            actions = options.actions;
        } else if (options.actions && options.actions.length === 0) {
            actions = [];
        } else {
            actions = [
                "moveDown",
                "moveUp",
                "remove",
                "transferAllFrom",
                "transferAllTo",
                "transferFrom",
                "transferTo"
            ];
        }
        return { actions, position };
    }
}
