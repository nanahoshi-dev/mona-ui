import type { ModelSignal, Signal, WritableSignal } from "@angular/core";
import { afterRenderEffect, computed, effect, linkedSignal, untracked } from "@angular/core";
import type { ImmutableSet } from "@mirei/ts-collections";
import { select } from "@mirei/ts-collections";
import type { TabComponent } from "../components/tab/tab.component";
import type { TabItem } from "../models/TabItem";

function isEnabled(tab: TabItem): boolean {
    return !tab.disabled;
}

/** The tab to select after the selected one is gone: the one that took its place, else the nearest before it. */
function neighborOf(tabs: readonly TabItem[], removedIndex: number): TabItem | undefined {
    return tabs.slice(removedIndex).find(isEnabled) ?? tabs.slice(0, removedIndex).reverse().find(isEnabled);
}

/**
 * The selection of a group of `mona-tab` elements, kept in step three ways: the selected tab, the group's
 * `selectedIndex`, and each tab's `selected`. `mona-tabs` and `mona-tab-strip` share it. Create it in an injection
 * context. It reads the tabs and the index through functions, so a component can create it before its own fields exist.
 */
export class TabSelection {
    readonly #selectedIndex: () => ModelSignal<number>;
    readonly #tabs: () => readonly TabComponent[];
    #flaggedTabId: string | null = null;
    #reportedIndex: number | null = null;
    /**
     * Whether the tabs have rendered. A tab in an `@for` gets its inputs after the group first reads it, so until then
     * a selection is only a first guess, and a tab that turns out to be disabled was never really selected.
     */
    #tabsSettled = false;
    public readonly selectedTabId: WritableSignal<string | null>;
    public readonly tabList: Signal<ImmutableSet<TabItem>>;

    public constructor(tabs: () => readonly TabComponent[], selectedIndex: () => ModelSignal<number>) {
        this.#tabs = tabs;
        this.#selectedIndex = selectedIndex;
        this.tabList = computed(() => {
            return select(this.#tabs(), t => t.tabItem)
                .tap((t, tx) => (t.index = tx))
                .toImmutableSet();
        });
        this.selectedTabId = linkedSignal<ImmutableSet<TabItem>, string | null>({
            source: () => this.tabList(),
            computation: (tabList, previous) => {
                const items = tabList.toArray();
                const previousId = previous?.value ?? null;
                if (previousId === null || !this.#tabsSettled) {
                    const requested = items[untracked(this.#selectedIndex())];
                    return (requested && isEnabled(requested) ? requested : items.find(isEnabled))?.id ?? null;
                }
                if (items.some(tab => tab.id === previousId)) {
                    return previousId;
                }
                const removedIndex = previous?.source.toArray().findIndex(tab => tab.id === previousId) ?? 0;
                return neighborOf(items, removedIndex)?.id ?? null;
            }
        });
        effect(() => {
            const requested = this.#selectedIndex()();
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
            this.#selectedIndex().set(index);
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
        for (const tab of this.#tabs()) {
            tab.selected.set(tab.tabItem.id === nextId);
        }
        this.reportIndex(items, nextId);
    }
}
