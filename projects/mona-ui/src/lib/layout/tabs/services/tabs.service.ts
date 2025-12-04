import { computed, Injectable, signal } from "@angular/core";
import { ImmutableDictionary } from "@mirei/ts-collections";
import { TabItem } from "../models/TabItem";

@Injectable()
export class TabsService {
    public readonly tabDict = signal(ImmutableDictionary.create<string, TabItem>());
    public readonly tabList = computed(() => {
        return this.tabDict()
            .values()
            .orderBy(t => t.index)
            .toImmutableList();
    });

    public addTab(uid: string, tab: TabItem): void {
        this.tabDict.update(tabs => {
            return tabs
                .put(uid, tab)
                .tap((t, tx) => (t.value.index = tx))
                .toImmutableDictionary(
                    e => e.key,
                    e => e.value
                );
        });
    }

    public removeTab(uid: string): void {
        this.tabDict.update(tabs =>
            tabs
                .remove(uid)
                .tap((t, tx) => (t.value.index = tx))
                .toImmutableDictionary(
                    e => e.key,
                    e => e.value
                )
        );
    }

    public updateSelectedTab(uid: string): void {
        this.tabDict.update(tabs =>
            tabs
                .tap(t => (t.value.selected = t.key === uid))
                .toImmutableDictionary(
                    e => e.key,
                    e => e.value
                )
        );
    }
}
