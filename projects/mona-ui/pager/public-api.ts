/*
 * Public API Surface of @nanahoshi/mona-ui/pager
 */

export * from "./components/pager/pager.component";

export * from "./directives/pager-info-template.directive";
export * from "./directives/pager-numeric-buttons-template.directive";
export * from "./directives/pager-navigation-buttons-template.directive";
export * from "./directives/pager-page-size-template.directive";

export type * from "./models/InfoTemplateContext";
export type * from "./models/NavigationButtonsTemplateContext";
export type * from "./models/NumericButtonsTemplateContext";
export * from "./models/PageChangeEvent";
export type * from "./models/PagerContext";
export type * from "./models/PagerType";
export type * from "./models/PageSizeTemplateContext";
export * from "./models/PageSizeChangeEvent";

export * from "./i18n/pager.default-messages";
