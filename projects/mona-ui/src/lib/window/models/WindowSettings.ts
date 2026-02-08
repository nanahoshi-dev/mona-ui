import { ElementRef, TemplateRef, Type } from "@angular/core";
import { Action } from "../../utils/Action";
import { WindowVariantProps } from "../styles/window.styles";
import { WindowCloseEvent } from "./WindowCloseEvent";

export interface WindowSettings {
    content: TemplateRef<unknown> | Type<unknown>;
    closeOnEscape?: boolean;
    draggable?: boolean;
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    footerTemplate?: TemplateRef<unknown>;
    height?: number;
    left?: number;
    maxHeight?: number;
    maxWidth?: number;
    minHeight?: number;
    minWidth?: number;
    modal?: boolean;
    preventClose?: Action<WindowCloseEvent, boolean>;
    resizable?: boolean;
    rounded: WindowVariantProps["rounded"];
    title?: string | TemplateRef<unknown>;
    top?: number;
    width?: number;
    windowClass?: string | string[];
}
