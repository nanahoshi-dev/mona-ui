import { ElementRef, TemplateRef } from "@angular/core";
import { DialogMessages } from "@nanahoshi/mona-ui/i18n";
import { DialogVariantProps } from "../styles/dialog.styles";
import { ActionsLayout } from "./ActionsLayout";
import { DialogAction } from "./DialogAction";
import { DialogReference } from "./DialogReference";

export interface DialogInjectorData {
    actions?: Iterable<DialogAction>;
    actionsLayout: ActionsLayout;
    closable?: boolean;
    closeOnEscape?: boolean;
    content?: TemplateRef<unknown>;
    description?: string;
    descriptionTemplate?: TemplateRef<unknown>;
    dialogReference: DialogReference;
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    footerTemplate?: TemplateRef<unknown>;
    height?: number;
    iconTemplate?: TemplateRef<unknown>;
    left?: number;
    messages?: Partial<DialogMessages>;
    modal?: boolean;
    rounded: DialogVariantProps["rounded"];
    text?: string;
    title?: string;
    titleTemplate?: TemplateRef<unknown>;
    top?: number;
    type?: DialogVariantProps["type"];
    width?: number;
}
