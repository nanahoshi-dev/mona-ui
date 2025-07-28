import { TemplateRef } from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { MenuItem } from "./MenuItem";

export interface MenuItemGroupConfig {
    groupTemplate: TemplateRef<any> | null;
    items: ImmutableSet<MenuItem>;
}
