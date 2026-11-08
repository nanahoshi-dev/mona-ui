export interface MonaDialogMessages {
    /** The label of the Cancel button that `confirm()` and a `"confirm"` dialog without `actions` add. */
    readonly cancel: string;
    /** The accessible name of the close button in the dialog header. */
    readonly closeDialog: string;
    /** The label of the OK button that `alert()`, `confirm()` and a dialog without `actions` add. */
    readonly ok: string;
}

export type DialogMessages = MonaDialogMessages;

