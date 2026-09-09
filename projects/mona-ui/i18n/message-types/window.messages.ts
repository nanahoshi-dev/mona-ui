export interface MonaWindowMessages {
    readonly close: string;
    readonly closeWindow: string;
    readonly maximize: string;
    readonly minimize: string;
    readonly moveWindow: string;
    readonly resizeBottom: string;
    readonly resizeBottomLeft: string;
    readonly resizeBottomRight: string;
    readonly resizeLeft: string;
    readonly resizeRight: string;
    readonly resizeTop: string;
    readonly resizeTopLeft: string;
    readonly resizeTopRight: string;
    readonly restore: string;
}

export type WindowMessages = MonaWindowMessages;
