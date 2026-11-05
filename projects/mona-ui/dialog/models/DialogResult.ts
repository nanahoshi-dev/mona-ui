import type { PopupCloseSource } from "@nanahoshi/mona-ui/popup";
import type { DialogAction } from "./DialogAction";

/**
 * How a dialog closed. Every close produces one: an action button (`viaClose: false`), or anything else
 * (`viaClose: true`): the close button, Escape, a backdrop click, or `close()`.
 */
export type DialogResult<R = unknown> =
    | {
          /** The action that closed the dialog. */
          readonly action: DialogAction;
          readonly via: PopupCloseSource.Action;
          readonly viaClose: false;
      }
    | {
          /** What closed the dialog. */
          readonly via: Exclude<PopupCloseSource, PopupCloseSource.Action>;
          /** The value passed to `close(value)`, when the dialog was closed that way. */
          readonly value?: R;
          readonly viaClose: true;
      };
