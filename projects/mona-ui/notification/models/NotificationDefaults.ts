/**
 * @description Application-wide settings for notifications, given with `provideNotificationDefaults()`.
 */
export interface NotificationDefaults {
    /**
     * @description Whether notifications with a `duration` close on their own. Turn it off to leave every
     * notification open until the user closes it (WCAG 2.2.1).
     * @default true
     */
    readonly autoHide: boolean;

    /**
     * @description A factor applied to every `duration`, for example `2` to keep notifications twice as long.
     * @default 1
     */
    readonly durationScale: number;

    /**
     * @description The most notifications shown at once at each position. The oldest closes to make room for a new
     * one. Without it, there is no limit.
     */
    readonly maxVisible?: number;

    /**
     * @description Whether the countdown pauses while the browser window doesn't have focus.
     * @default true
     */
    readonly pauseOnWindowBlur: boolean;
}
