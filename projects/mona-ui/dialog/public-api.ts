/*
 * Public API Surface of @mirei/mona-ui/dialog
 */

export * from "../src/lib/dialogs/dialog/components/dialog/dialog.component";
export * from "../src/lib/dialogs/dialog/directives/dialog-content-template.directive";
export * from "../src/lib/dialogs/dialog/directives/dialog-description-template.directive";
export * from "../src/lib/dialogs/dialog/directives/dialog-footer-template.directive";
export * from "../src/lib/dialogs/dialog/directives/dialog-icon-template.directive";
export * from "../src/lib/dialogs/dialog/directives/dialog-title-template.directive";

export * from "../src/lib/dialogs/dialog/services/dialog.service";

export type { ActionsLayout } from "../src/lib/dialogs/dialog/models/ActionsLayout";
export * from "../src/lib/dialogs/dialog/models/DialogAction";
export * from "../src/lib/dialogs/dialog/models/DialogActionEvent";
export * from "../src/lib/dialogs/dialog/models/DialogRef";
export type { DialogResult } from "../src/lib/dialogs/dialog/models/DialogResult";
export * from "../src/lib/dialogs/dialog/models/DialogSettings";
export type { DialogVariantProps } from "../src/lib/dialogs/dialog/styles/dialog.styles";

export type { ButtonVariantProps } from "../src/lib/buttons/button/styles/button.styles";
export { PopupCloseEvent, PopupCloseSource } from "../src/lib/popup/models/PopupCloseEvent";
export type { PopupCloseEventOptions } from "../src/lib/popup/models/PopupCloseEvent";
export { PreventableEvent } from "../src/lib/utils/PreventableEvent";
