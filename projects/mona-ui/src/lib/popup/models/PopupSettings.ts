import { AnimationMetadata } from "@angular/animations";
import { StaticProvider, TemplateRef } from "@angular/core";
import {
    ComponentType,
    ConnectedPosition,
    ConnectionPositionPair,
    FlexibleConnectedPositionStrategyOrigin
} from "@angular/cdk/overlay";
import { ConnectionPoint } from "mona-ui/popup/utils/connectionPosition";
import { PopupOffset } from "./PopupOffset";
import { Action } from "../../utils/Action";
import { PopupCloseEvent } from "./PopupCloseEvent";

export interface PopupSettings<T = unknown, C = void> {
    /**
     * The anchor element to which the popup will be connected.
     * @type {FlexibleConnectedPositionStrategyOrigin}
     */
    anchor: FlexibleConnectedPositionStrategyOrigin;

    /**
     * The connection point of the anchor element to which the popup will be connected.
     * @type {ConnectionPoint}
     */
    anchorConnectionPoint?: ConnectionPoint;

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

    closeOnBackdropClick?: boolean;

    /**
     * Whether the popup will be closed when the user presses the escape key.
     * Default: true.
     * @type {boolean}
     */
    closeOnEscape?: boolean;

    /**
     * Whether the popup will be closed when the user clicks outside of it.
     * @type {boolean}
     */
    closeOnOutsideClick?: boolean;

    /**
     * Optional data to pass to the popup context.
     */
    data?: T;

    /**
     * Disable the default animation of the popup.
     */
    disableAnimation?: boolean;

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
    popupConnectionPoint?: ConnectionPoint;

    /**
     * Classes to be applied to the popup wrapper content div.
     */
    popupWrapperClass?: string | string[];

    positionStrategy?: "global" | "connected";

    positions?: Array<ConnectedPosition | ConnectionPositionPair>;

    preventClose?: Action<PopupCloseEvent, boolean>;

    providers?: StaticProvider[];

    /**
     * Width of the popup.
     * @type {number | string}
     */
    width?: number | string;
    withPush?: boolean;
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
