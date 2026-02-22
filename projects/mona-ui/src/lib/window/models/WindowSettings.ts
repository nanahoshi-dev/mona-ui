import { ElementRef, TemplateRef, Type } from "@angular/core";
import { Action } from "../../utils/Action";
import { WindowVariantProps } from "../styles/window.styles";
import { WindowActionTemplateContext } from "./WindowActionTemplateContext";
import { WindowCloseEvent } from "./WindowCloseEvent";
import { WindowRef } from "./WindowRef";

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
    preventClose?: Action<WindowCloseEvent, boolean>;
    resizable?: boolean;
    rounded: WindowVariantProps["rounded"];
    title?: string | TemplateRef<unknown>;
    top?: number;
    width?: number;
    windowClass?: string | string[];
}
