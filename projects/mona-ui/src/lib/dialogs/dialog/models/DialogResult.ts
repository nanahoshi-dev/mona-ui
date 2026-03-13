import { DialogAction } from "./DialogAction";

export type DialogResult =
    | { viaClose: true }
    | {
          viaClose: false;
          action: DialogAction;
      };
