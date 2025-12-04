import { TemplateRef } from "@angular/core";

export interface TabItem {
    closable: boolean;
    contentTemplate?: TemplateRef<unknown>;
    disabled: boolean;
    index: number;
    selected: boolean;
    title: string;
    titleTemplate?: TemplateRef<unknown>;
    uid: string;
}
