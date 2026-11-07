/**
 * What `mona-button-group` reports about a clicked button.
 */
export interface ButtonGroupClickEvent<T = unknown> {
    /** The button's element. */
    readonly button: HTMLButtonElement;
    /** Whether the button is selected now that the group has applied its selection. */
    readonly selected: boolean;
    /** The button's `value`, if it has one. */
    readonly value: T | undefined;
}
