import { TemplateRef } from "@angular/core";

export interface TabItem {
    closable: boolean;
    contentTemplate?: TemplateRef<unknown>;
    disabled: boolean;
    /** The key the tab is tracked by. It never changes, unlike the ids the consumer may set. */
    readonly id: string;
    index: number;
    /** The id of the panel the tab controls when the consumer names one. */
    readonly panelId: string | null;
    readonly selected: boolean;
    /** The id of the tab element. */
    readonly tabId: string;
    title: string;
    titleTemplate?: TemplateRef<unknown>;
}

/** The id of the panel `mona-tabs` renders for a tab: the one the consumer named, else one made from the tab's key. */
export function ownPanelId(tab: TabItem): string {
    return tab.panelId ?? `${tab.id}-panel`;
}
