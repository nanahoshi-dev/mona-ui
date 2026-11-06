import { NgTemplateOutlet } from "@angular/common";
import {
    afterRenderEffect,
    booleanAttribute,
    Component,
    computed,
    contentChildren,
    effect,
    input,
    linkedSignal,
    model,
    output,
    untracked,
    viewChild
} from "@angular/core";
import type { ImmutableSet } from "@mirei/ts-collections";
import { select } from "@mirei/ts-collections";
import { twMerge } from "tailwind-merge";
import type { TabCloseEvent } from "../../models/TabCloseEvent";
import type { TabItem } from "../../models/TabItem";
import type { TabSelectEvent } from "../../models/TabSelectEvent";
import type { TabsVariantInput, TabsVariantProps } from "../../styles/tabs.styles";
import { tabContentThemeVariants, tabsBaseThemeVariants } from "../../styles/tabs.styles";
import { TabListComponent } from "../tab-list/tab-list.component";
import { TabComponent } from "../tab/tab.component";

function isEnabled(tab: TabItem): boolean {
    return !tab.disabled;
}

/** The tab to select after the selected one is gone: the one that took its place, else the nearest before it. */
function neighborOf(tabs: readonly TabItem[], removedIndex: number): TabItem | undefined {
    return tabs.slice(removedIndex).find(isEnabled) ?? tabs.slice(0, removedIndex).reverse().find(isEnabled);
}

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
    #flaggedTabId: string | null = null;
    #reportedIndex: number | null = null;
    /**
     * Whether the tabs have rendered. A tab in an `@for` gets its inputs after this component first reads it, so until then
     * a selection is only a first guess, and a tab that turns out to be disabled was never really selected.
     */
    #tabsSettled = false;
    protected readonly baseClass = computed(() => {
        const variantClass = tabsBaseThemeVariants({ position: this.position() });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly contentClass = computed(() => {
        return tabContentThemeVariants();
    });
    protected readonly selectedTabId = linkedSignal<ImmutableSet<TabItem>, string | null>({
        source: () => this.tabList(),
        computation: (tabList, previous) => {
            const tabs = tabList.toArray();
            const previousId = previous?.value ?? null;
            if (previousId === null || !this.#tabsSettled) {
                const requested = tabs[untracked(this.selectedIndex)];
                return (requested && isEnabled(requested) ? requested : tabs.find(isEnabled))?.id ?? null;
            }
            if (tabs.some(tab => tab.id === previousId)) {
                return previousId;
            }
            const removedIndex = previous?.source.toArray().findIndex(tab => tab.id === previousId) ?? 0;
            return neighborOf(tabs, removedIndex)?.id ?? null;
        }
    });
    protected readonly tabList = computed(() => {
        const tabs = this.tabs();
        return select(tabs, t => t.tabItem)
            .tap((t, tx) => (t.index = tx))
            .toImmutableSet();
    });
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
     * @description Emitted with a {@link TabCloseEvent} when a close is requested. The component doesn't remove the tab:
     * remove it from whatever renders the `mona-tab` elements.
     */
    public readonly tabClose = output<TabCloseEvent>();

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

    public constructor() {
        effect(() => {
            const requested = this.selectedIndex();
            untracked(() => this.applyRequestedIndex(requested));
        });
        effect(() => {
            const items = this.tabList().toArray();
            const selectedId = this.selectedTabId();
            untracked(() => this.syncSelection(items, selectedId));
        });
        afterRenderEffect({
            read: () => {
                this.#tabsSettled = this.tabList().length > 0;
            }
        });
    }

    protected handlePanelKeyDown(event: KeyboardEvent): void {
        if (event.key === "Tab" && event.shiftKey) {
            if (event.target !== event.currentTarget) {
                return;
            }
            event.preventDefault();
            this.tabListComponent().focusSelectedTab();
        }
    }

    private applyRequestedIndex(requested: number): void {
        if (requested === this.#reportedIndex) {
            return;
        }
        const items = this.tabList().toArray();
        if (items.length === 0) {
            return; // Tabs may still be on their way, and the linked signal reads the index when they arrive.
        }
        const tab = items[requested];
        if (tab && isEnabled(tab)) {
            this.selectedTabId.set(tab.id);
        }
        this.reportIndex(items, this.selectedTabId());
    }

    private reportIndex(items: readonly TabItem[], selectedId: string | null): void {
        const index = items.findIndex(item => item.id === selectedId);
        if (index !== -1) {
            this.#reportedIndex = index;
            this.selectedIndex.set(index);
        }
    }

    /**
     * Brings the three views of the selection together. A tab newly flagged `selected` from outside wins, and the first
     * one wins when there are several. Every tab's `selected` and the index are then written to match, so a flag that was
     * already seen, or one this method wrote, can't take the selection back.
     */
    private syncSelection(items: readonly TabItem[], selectedId: string | null): void {
        const incoming = items.find(
            item => item.selected && item.id !== this.#flaggedTabId && item.id !== selectedId && isEnabled(item)
        );
        const nextId = incoming?.id ?? selectedId;
        if (incoming) {
            this.selectedTabId.set(incoming.id);
        }
        this.#flaggedTabId = nextId;
        for (const tab of this.tabs()) {
            tab.selected.set(tab.tabItem.id === nextId);
        }
        this.reportIndex(items, nextId);
    }
}
