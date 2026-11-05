export interface MonaWindowMessages {
    readonly close: string;
    readonly closeWindow: string;
    readonly maximize: string;
    readonly minimize: string;
    /** The title bar's name when the window can be both dragged and resized; it says which keys do each. */
    readonly moveOrResizeWindow: string;
    /** The title bar's name when the window can be dragged but not resized. */
    readonly moveWindow: string;
    /** @deprecated No longer rendered; resize handles are for the pointer, and the title bar resizes with the keyboard. */
    readonly resizeBottom: string;
    /** @deprecated No longer rendered; resize handles are for the pointer, and the title bar resizes with the keyboard. */
    readonly resizeBottomLeft: string;
    /** @deprecated No longer rendered; resize handles are for the pointer, and the title bar resizes with the keyboard. */
    readonly resizeBottomRight: string;
    /** @deprecated No longer rendered; resize handles are for the pointer, and the title bar resizes with the keyboard. */
    readonly resizeLeft: string;
    /** @deprecated No longer rendered; resize handles are for the pointer, and the title bar resizes with the keyboard. */
    readonly resizeRight: string;
    /** @deprecated No longer rendered; resize handles are for the pointer, and the title bar resizes with the keyboard. */
    readonly resizeTop: string;
    /** @deprecated No longer rendered; resize handles are for the pointer, and the title bar resizes with the keyboard. */
    readonly resizeTopLeft: string;
    /** @deprecated No longer rendered; resize handles are for the pointer, and the title bar resizes with the keyboard. */
    readonly resizeTopRight: string;
    /** The title bar's name when the window can be resized but not dragged. */
    readonly resizeWindow: string;
    readonly restore: string;
}

export type WindowMessages = MonaWindowMessages;
