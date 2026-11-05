import type { ElementRef, TemplateRef, Type } from "@angular/core";
import type { WindowMessages } from "@nanahoshi/mona-ui/i18n";
import type { WindowVariantProps } from "../styles/window.styles";
import type { WindowActionTemplateContext } from "./WindowActionTemplateContext";
import type { WindowReference } from "./WindowReference";

export interface WindowInjectorData {
    actionTemplate?: TemplateRef<WindowActionTemplateContext>;
    ariaLabel?: string;
    closable?: boolean;
    closeOnEscape?: boolean;
    content?: TemplateRef<unknown> | Type<unknown>;
    data?: unknown;
    draggable: boolean;
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    footerTemplate?: TemplateRef<unknown>;
    height?: number;
    left?: number;
    look?: WindowVariantProps["look"];
    maxHeight?: number;
    maxWidth?: number;
    maximizable: boolean;
    messages?: Partial<WindowMessages>;
    minHeight: number;
    minWidth: number;
    minimizable: boolean;
    modal?: boolean;
    resizable: boolean;
    rounded: WindowVariantProps["rounded"];
    title?: string;
    titleTemplate?: TemplateRef<unknown>;
    top?: number;
    width?: number;
    windowReference: WindowReference;
}
