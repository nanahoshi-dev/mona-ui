import { AnimationMetadata } from "@angular/animations";
import { StaticProvider, TemplateRef } from "@angular/core";
import {
    ComponentType,
    ConnectedPosition,
    ConnectionPositionPair,
    FlexibleConnectedPositionStrategyOrigin
} from "@angular/cdk/overlay";
import { ConnectionPoint } from "../utils/connectionPosition";
import { PopupOffset } from "./PopupOffset";
import { Action } from "../../utils/Action";
import { PopupCloseEvent } from "./PopupCloseEvent";

export type PopupAnchor = FlexibleConnectedPositionStrategyOrigin | string;

export interface PopupSettings<T = unknown, C = void> {
    /**
     * The anchor element to which the popup will be connected.
     * Can be an element, ElementRef, or CSS selector string.
     * @type {PopupAnchor}
     */
    anchor: PopupAnchor;

    /**
     * The connection point of the anchor element to which the popup will be connected.
     * @type {ConnectionPoint}
     */
    anchorConnectionPoint?: ConnectionPoint | null;

    /**
     * Animation settings for the popup.
     */
    animation?: boolean | PopupAnimationSettings;

    /**
     * Classes to be applied to the backdrop.
     * @type {string | string[]}
     */
    backdropClass?: string | string[];

    /**
     * The content to display in the popup.
     * @type {TemplateRef | ComponentType}
     */
    content: TemplateRef<C> | ComponentType<C>;

    /**
     * Whether the popup will be closed when the user clicks on the backdrop.
     * Only applies if `hasBackdrop` is true.
     * @type {boolean}
     */
    closeOnBackdropClick?: boolean;

    /**
     * Whether the popup will be closed when the user presses the escape key.
     * Default: true.
     * @type {boolean}
     */
    closeOnEscape?: boolean;

    /**
     * Whether the popup will be closed when the mouse leaves the anchor element.
     * Default: false.
     * @type {boolean}
     */
    closeOnMouseLeave?: boolean;

    /**
     * Whether the popup will be closed when the user clicks outside of it.
     * @type {boolean}
     */
    closeOnOutsideClick?: boolean;

    /**
     * Whether the popup will be closed when the user scrolls.
     * Default: false.
     * @type {boolean}
     */
    closeOnScroll?: boolean;

    /**
     * Optional data to pass to the popup context.
     */
    data?: T;

    /**
     * Whether the popup will have a backdrop.
     * Default: true.
     */
    hasBackdrop?: boolean;

    /**
     * Height of the popup.
     * @type {number | string}
     */
    height?: number | string;

    /**
     * Maximum height of the popup.
     * @type {number | string}
     */
    maxHeight?: number | string;

    /**
     * Maximum width of the popup.
     * @type {number | string}
     */
    maxWidth?: number | string;

    /**
     * Minimum height of the popup.
     * @type {number | string}
     */
    minHeight?: number | string;

    /**
     * Minimum width of the popup.
     * @type {number | string}
     */
    minWidth?: number | string;

    /**
     * Offset of the popup.
     * @type {PopupOffset}
     */
    offset?: PopupOffset;

    /**
     * Classes to be applied to the popup.
     * @type {string | string[]}
     */
    popupClass?: string | string[];

    /**
     * The connection point of the popup element to which the anchor will be connected.
     * @type {ConnectionPoint}
     */
    popupConnectionPoint?: ConnectionPoint | null;

    /**
     * Classes to be applied to the popup wrapper content div.
     */
    popupWrapperClass?: string | string[];

    /**
     * The strategy for positioning the popup.
     * `global` means the popup will be positioned relative to the viewport,
     * `connected` means the popup will be positioned relative to the anchor element.
     * @type {"global" | "connected"}
     */
    positionStrategy?: "global" | "connected";

    /**
     * @description The positions to use for the popup.
     * The popup will try to position itself in the first position that fits.
     * This is only used when `positionStrategy` is set to `connected`.
     */
    positions?: Array<ConnectedPosition | ConnectionPositionPair>;

    preventClose?: Action<PopupCloseEvent, boolean>;

    providers?: StaticProvider[];

    /**
     * Controls focus restoration behavior when the popup is closed.
     * - true: Always restore focus to anchor
     * - false: Never restore focus (recommended for tooltips)
     * - "auto": Only restore focus if anchor was focused when popup opened (smart behavior)
     * Default: "auto".
     * @type {boolean | "auto"}
     */
    restoreFocus?: boolean | "auto";

    /**
     * Width of the popup.
     * @type {number | string}
     */
    width?: number | string;

    withPush?: boolean;

    /**
     * Whether the popup should track scroll events and reposition itself.
     * Default: true.
     * @type {boolean}
     */
    withScrollTracking?: boolean;
}

export interface PopupAnimationSettings {
    /**
     * Animation that will play when the popup is hidden.
     */
    hide?: AnimationMetadata | AnimationMetadata[];

    /**
     * Animation that will play when the popup is shown.
     */
    show?: AnimationMetadata | AnimationMetadata[];
}
