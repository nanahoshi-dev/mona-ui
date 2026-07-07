/*
 * Public API Surface of @mirei/mona-ui/dialog
 */

export * from "./dialogs/dialog/components/dialog/dialog.component";
export * from "./dialogs/dialog/directives/dialog-content-template.directive";
export * from "./dialogs/dialog/directives/dialog-description-template.directive";
export * from "./dialogs/dialog/directives/dialog-footer-template.directive";
export * from "./dialogs/dialog/directives/dialog-icon-template.directive";
export * from "./dialogs/dialog/directives/dialog-title-template.directive";

export * from "./dialogs/dialog/services/dialog.service";

export type { ActionsLayout } from "./dialogs/dialog/models/ActionsLayout";
export * from "./dialogs/dialog/models/DialogAction";
export * from "./dialogs/dialog/models/DialogActionEvent";
export * from "./dialogs/dialog/models/DialogRef";
export type { DialogResult } from "./dialogs/dialog/models/DialogResult";
export * from "./dialogs/dialog/models/DialogSettings";
export type { DialogVariantProps } from "./dialogs/dialog/styles/dialog.styles";

export type { ButtonVariantProps } from "./buttons/button/styles/button.styles";
export { PopupCloseEvent, PopupCloseSource } from "./popup/models/PopupCloseEvent";
export type { PopupCloseEventOptions } from "./popup/models/PopupCloseEvent";
export { PreventableEvent } from "./utils/PreventableEvent";
