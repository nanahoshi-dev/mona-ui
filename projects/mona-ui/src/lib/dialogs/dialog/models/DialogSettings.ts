import { ElementRef, TemplateRef } from "@angular/core";
import { DialogVariantProps } from "../styles/dialog.styles";
import { ActionsLayout } from "./ActionsLayout";
import { DialogAction } from "./DialogAction";

export interface DialogSettings {
    actions?: Iterable<DialogAction>;
    actionsLayout?: ActionsLayout;
    closable?: boolean;
    closeOnEscape?: boolean;
    content?: TemplateRef<any>;
    description?: string;
    descriptionTemplate?: TemplateRef<any>;
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    footerTemplate?: TemplateRef<any>;
    height?: number;
    left?: number;
    maxHeight?: number;
    maxWidth?: number;
    minHeight?: number;
    minWidth?: number;
    modal?: boolean;
    rounded?: DialogVariantProps["rounded"];
    text?: string;
    title?: string;
    titleTemplate?: TemplateRef<any>;
    top?: number;
    type?: DialogVariantProps["type"];
    width?: number;
}
