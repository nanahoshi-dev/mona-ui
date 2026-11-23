import { NgTemplateOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, contentChildren, input, model, output, viewChild } from "@angular/core";
import { twMerge } from "tailwind-merge";
import type { TabCloseEvent } from "../../models/TabCloseEvent";
import type { TabItem } from "../../models/TabItem";
import { ownPanelId } from "../../models/TabItem";
import type { TabReorderEvent } from "../../models/TabReorderEvent";
import type { TabSelectEvent } from "../../models/TabSelectEvent";
import type { TabsVariantInput, TabsVariantProps } from "../../styles/tabs.styles";
import { tabContentThemeVariants, tabsBaseThemeVariants } from "../../styles/tabs.styles";
import { TabSelection } from "../../utils/tab-selection";
import { TabListComponent } from "../tab-list/tab-list.component";
import { TabComponent } from "../tab/tab.component";

@Component({
    selector: "mona-tabs",
    templateUrl: "./tabs.component.html",
    imports: [NgTemplateOutlet, TabListComponent],
    host: {
        "[class]": "baseClass()",
        // The name belongs to the tab list. Left on a host with no role, it would name nothing.
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null"
    }
})
export class TabsComponent implements TabsVariantInput {
    readonly #selection = new TabSelection(
        () => this.tabs(),
        () => this.selectedIndex
    );
    protected readonly baseClass = computed(() => {
        const variantClass = tabsBaseThemeVariants({ position: this.position() });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly contentClass = computed(() => {
        return tabContentThemeVariants();
    });
    protected readonly selectedTabId = this.#selection.selectedTabId;
    protected readonly tabList = this.#selection.tabList;
    protected readonly tabListComponent = viewChild.required(TabListComponent);
    protected readonly tabs = contentChildren(TabComponent);

    /**
     * @description Accessible name for the tab list.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description The id of an element that names the tab list. Takes precedence over `aria-label`.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Displays a close button on each tab. A tab's own `closable` can add a button, not remove this one.
     * @default false
     */
    public readonly closable = input(false, { transform: booleanAttribute });

    /**
     * @description Renders every tab with reduced visual emphasis and removes pointer and keyboard interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Keeps a tab's content in the DOM after it is deselected instead of removing it.
     * @default true
     */
    public readonly keepTabContent = input(true, { transform: booleanAttribute });

    /**
     * @description How the selected tab is marked: `"line"` draws an indicator along the strip's edge, and `"pill"`
     * raises the tab on a rounded background, `--mona-tab-pill-background` when it's set.
     * @default "line"
     */
    public readonly look = input<TabsVariantProps["look"]>("line");

    /**
     * @description Placement of the tab list relative to the tab content.
     * @default "top"
     */
    public readonly position = input<TabsVariantProps["position"]>("top");

    /**
     * @description The zero-based index of the selected tab. Writing it selects that tab, unless it's disabled or out of
     * range, in which case the value goes back to the selected tab's index. It also changes when the component moves the
     * selection itself, such as when the selected tab is removed.
     * @default 0
     */
    public readonly selectedIndex = model(0);

    /**
     * @description Size preset controlling the tabs' dimensions.
     * @default "medium"
     */
    public readonly size = input<TabsVariantProps["size"]>("medium");

    /**
     * @description Lets the user reorder the tabs: by dragging them, or with Control+Shift and the arrow keys along the
     * strip, Home or End (Command+Shift on macOS). The component emits `tabReorder` and doesn't move the tabs itself.
     * @default false
     */
    public readonly sortable = input(false, { transform: booleanAttribute });

    /**
     * @description Emitted with a {@link TabCloseEvent} when a close is requested: by the close button, Delete or
     * Backspace, or a middle-click on the tab. The component doesn't remove the tab: remove it from whatever renders the
     * `mona-tab` elements.
     */
    public readonly tabClose = output<TabCloseEvent>();

    /**
     * @description Emitted with a {@link TabReorderEvent} when a tab of a `sortable` strip is moved. The component doesn't
     * reorder the tabs: move the tab in whatever renders the `mona-tab` elements. The selected tab stays selected.
     */
    public readonly tabReorder = output<TabReorderEvent>();

    /**
     * @description Emitted with a {@link TabSelectEvent} before a click or key selects a tab. This event is preventable.
     * It doesn't fire for selections made through `selectedIndex` or `selected`, or when the selected tab is removed.
     */
    public readonly tabSelect = output<TabSelectEvent>();

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    protected handlePanelKeyDown(event: KeyboardEvent): void {
        if (event.key === "Tab" && event.shiftKey) {
            if (event.target !== event.currentTarget) {
                return;
            }
            event.preventDefault();
            this.tabListComponent().focusSelectedTab();
        }
    }

    protected panelIdOf(tab: TabItem): string {
        return ownPanelId(tab);
    }
}
