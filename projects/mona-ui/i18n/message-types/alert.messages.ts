/**
 * The alert's dismiss button.
 */
export interface MonaAlertMessages {
    /** Name of the button that dismisses the alert, with the alert's title when it has one. */
    dismissLabel(title?: string): string;
}
