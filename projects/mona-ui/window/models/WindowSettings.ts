import { ElementRef, TemplateRef, Type } from "@angular/core";
import { Action } from "@nanahoshi/mona-ui/internal";
import { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { WindowVariantProps } from "../styles/window.styles";
import { WindowActionTemplateContext } from "./WindowActionTemplateContext";

export interface WindowSettings {
    actionTemplate?: TemplateRef<WindowActionTemplateContext>;
    closable?: boolean;
    closeOnEscape?: boolean;
    content?: TemplateRef<unknown> | Type<unknown>;
    draggable?: boolean;
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    footerTemplate?: TemplateRef<unknown>;
    height?: number;
    left?: number;
    look?: WindowVariantProps["look"];
    maxHeight?: number;
    maxWidth?: number;
    maximizable?: boolean;
    minHeight?: number;
    minWidth?: number;
    minimizable?: boolean;
    modal?: boolean;
    preventClose?: Action<PopupCloseEvent, boolean>;
    resizable?: boolean;
    rounded: WindowVariantProps["rounded"];
    title?: string | TemplateRef<unknown>;
    top?: number;
    width?: number;
    windowClass?: string | string[];
}
