export interface MonaNotificationMessages {
    readonly close: string;
    readonly error: string;
    readonly info: string;
    /** The name of the region that holds the notifications at one position. */
    readonly region: string;
    readonly success: string;
    readonly warning: string;
}

export type NotificationMessages = MonaNotificationMessages;
