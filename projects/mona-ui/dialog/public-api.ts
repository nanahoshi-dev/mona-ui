/*
 * Public API Surface of @nanahoshi/mona-ui/dialog
 */

export * from "./components/dialog/dialog.component";
export * from "./directives/dialog-content-template.directive";
export * from "./directives/dialog-description-template.directive";
export * from "./directives/dialog-footer-template.directive";
export * from "./directives/dialog-icon-template.directive";
export * from "./directives/dialog-title-template.directive";

export * from "./services/dialog.service";

export type { ActionsLayout } from "./models/ActionsLayout";
export * from "./models/DialogAction";
export * from "./models/DialogActionEvent";
export * from "./models/DialogRef";
export type { DialogResult } from "./models/DialogResult";
export * from "./models/DialogSettings";
export type { DialogVariantProps } from "./styles/dialog.styles";
