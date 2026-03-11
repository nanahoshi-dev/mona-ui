import { DialogAction } from "./DialogAction";

// export interface DialogResult {
//     action?: DialogAction;
//     value?: string | number | null;
//     viaClose?: boolean;
// }

export type DialogResult =
    | { viaClose: true }
    | {
          viaClose: false;
          action: DialogAction;
      };
