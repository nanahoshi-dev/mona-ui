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
    /** Template rendered next to the minimize/maximize/close buttons. */
    actionTemplate?: TemplateRef<WindowActionTemplateContext>;
    /** Accessible name for a window without a `title`. */
    ariaLabel?: string;
    /**
     * Whether the title bar shows a close button.
     * @default true
     */
    closable?: boolean;
    /**
     * Whether pressing Escape closes the window.
     * @default true
     */
    closeOnEscape?: boolean;
    /** The window's content — a template reference or a component class. */
    content?: TemplateRef<unknown> | Type<unknown>;
    /**
     * Data for the content: a component injects it with `WINDOW_DATA`, a template gets it as its implicit context
     * (`let-data`).
     */
    data?: D;
    /**
     * Whether the user can move the window by its title bar. Unlike the `WindowComponent` input, this defaults to
     * `false`.
     * @default false
     */
    draggable?: boolean;
    /**
     * The element that receives focus when the window opens: an element, an element reference, or a CSS selector
     * matched inside the window.
     */
    focusedElement?: HTMLElement | ElementRef<HTMLElement> | string | null;
    /** Template rendered in the window's footer area. */
    footerTemplate?: TemplateRef<unknown>;
    /** Height in pixels. When omitted, the window fits its content. */
    height?: number;
    /**
     * Parent injector for the window's content. Pass the opener's injector so a component given as `content` can
     * inject what the opener provides. Default: the root injector.
     */
    injector?: Injector;
    /** Distance from the viewport's left edge in pixels. When omitted, the window is centered horizontally. */
    left?: number;
    /**
     * The title bar's color scheme.
     * @default "default"
     */
    look?: WindowVariantProps["look"];
    /** Maximum height in pixels, also the limit for resizing. When omitted, the viewport's height is the limit. */
    maxHeight?: number;
    /** Maximum width in pixels, also the limit for resizing. When omitted, the viewport's width is the limit. */
    maxWidth?: number;
    /**
     * Whether the title bar shows a maximize button.
     * @default true
     */
    maximizable?: boolean;
    /** Overrides for the window's messages, such as the title bar button labels. */
    messages?: Partial<WindowMessages>;
    /** Minimum height in pixels. Resizing stops at it, or at 50 pixels when omitted. */
    minHeight?: number;
    /** Minimum width in pixels. Resizing stops at it, or at 50 pixels when omitted. */
    minWidth?: number;
    /**
     * Whether the title bar shows a minimize button.
     * @default true
     */
    minimizable?: boolean;
    /**
     * Whether the window is modal: a backdrop, `aria-modal="true"`, focus kept inside, page scroll locked, and the
     * rest of the page inert.
     * @default false
     */
    modal?: boolean;
    /** Return `true` to cancel a close. See `preventClose` is service-only. */
    preventClose?: Action<PopupCloseEvent, boolean>;
    /**
     * Whether the user can resize the window by its edges and corners, or from the title bar with the keyboard.
     * @default false
     */
    resizable?: boolean;
    /**
     * Border-radius preset for the window.
     * @default "medium"
     */
    rounded?: WindowVariantProps["rounded"];
    /** The window's title — a plain string or a template reference. */
    title?: string | TemplateRef<unknown>;
    /** Distance from the viewport's top edge in pixels. When omitted, the window is centered vertically. */
    top?: number;
    /** Width in pixels. When omitted, the window fits its content. */
    width?: number;
    /** Class(es) applied to the window's overlay element. */
    windowClass?: string | string[];
}
