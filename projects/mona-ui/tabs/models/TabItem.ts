import { TemplateRef } from "@angular/core";

export interface TabItem {
    closable: boolean;
    contentTemplate?: TemplateRef<unknown>;
    disabled: boolean;
    readonly id: string;
    index: number;
    readonly selected: boolean;
    title: string;
    titleTemplate?: TemplateRef<unknown>;
}
