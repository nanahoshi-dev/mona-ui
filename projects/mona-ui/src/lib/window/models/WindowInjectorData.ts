import { ElementRef, TemplateRef, Type } from "@angular/core";
import { Action } from "../../utils/Action";
import { WindowVariantProps } from "../styles/window.styles";
import { WindowCloseEvent } from "./WindowCloseEvent";
import { WindowReference } from "./WindowReference";

export interface WindowInjectorData {
    closeOnEscape?: boolean;
    content: TemplateRef<unknown> | Type<unknown>;
    draggable: boolean;
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    footerTemplate?: TemplateRef<unknown>;
    height?: number;
    left?: number;
    maxHeight: number;
    maxWidth: number;
    minHeight: number;
    minWidth: number;
    preventClose?: Action<WindowCloseEvent, boolean>;
    resizable: boolean;
    rounded: WindowVariantProps["rounded"];
    title?: string;
    titleTemplate?: TemplateRef<unknown>;
    top?: number;
    width?: number;
    windowReference: WindowReference;
}
