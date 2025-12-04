import { TabItem } from "./TabItem";

export class TabCloseEvent {
    public index: number;
    public selected: boolean;

    public constructor(index: number, tab: TabItem) {
        this.index = index;
        this.selected = tab.selected;
    }
}
