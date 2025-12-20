import { TemplateRef } from "@angular/core";

export interface TabItem {
    readonly id: string;
    readonly selected: boolean;
    closable: boolean;
    contentTemplate?: TemplateRef<unknown>;
    disabled: boolean;
    index: number;
    title: string;
    titleTemplate?: TemplateRef<unknown>;
}
