import type { ElementRef, Injector, TemplateRef, Type } from "@angular/core";
import type { WindowMessages } from "@nanahoshi/mona-ui/i18n";
import type { Action } from "@nanahoshi/mona-ui/internal";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import type { WindowVariantProps } from "../styles/window.styles";
import type { WindowActionTemplateContext } from "./WindowActionTemplateContext";

/**
 * @typeParam D the type of `data`
 */
export interface WindowSettings<D = unknown> {
    actionTemplate?: TemplateRef<WindowActionTemplateContext>;
    /** Accessible name for a window without a `title`. */
    ariaLabel?: string;
    closable?: boolean;
    closeOnEscape?: boolean;
    content?: TemplateRef<unknown> | Type<unknown>;
    /**
     * Data for the content: a component injects it with `WINDOW_DATA`, a template gets it as its implicit context
     * (`let-data`).
     */
    data?: D;
    draggable?: boolean;
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    footerTemplate?: TemplateRef<unknown>;
    height?: number;
    /**
     * Parent injector for the window's content. Pass the opener's injector so a component given as `content` can
     * inject what the opener provides. Default: the root injector.
     */
    injector?: Injector;
    left?: number;
    look?: WindowVariantProps["look"];
    maxHeight?: number;
    maxWidth?: number;
    maximizable?: boolean;
    messages?: Partial<WindowMessages>;
    minHeight?: number;
    minWidth?: number;
    minimizable?: boolean;
    modal?: boolean;
    preventClose?: Action<PopupCloseEvent, boolean>;
    resizable?: boolean;
    rounded?: WindowVariantProps["rounded"];
    title?: string | TemplateRef<unknown>;
    top?: number;
    width?: number;
    windowClass?: string | string[];
}
