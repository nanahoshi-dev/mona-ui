import { PreventableEvent } from "../../../utils/PreventableEvent";
import { DialogAction } from "./DialogAction";

/**
 * @description Emitted when the user clicks a dialog action button. Call `preventDefault()` to keep the dialog open.
 */
export class DialogActionEvent<T = unknown> extends PreventableEvent {
    readonly #action: DialogAction<T>;

    public constructor(action: DialogAction<T>) {
        super("dialogAction");
        this.#action = action;
    }

    /**
     * @description The action that was clicked.
     */
    public get action(): DialogAction<T> {
        return this.#action;
    }
}
