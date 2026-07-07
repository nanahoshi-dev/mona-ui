/*
 * Public API Surface of @mirei/mona-ui/pager
 */

export * from "./pager/components/pager/pager.component";

export * from "./pager/directives/pager-focusable.directive";
export * from "./pager/directives/pager-info-template.directive";
export * from "./pager/directives/pager-numeric-buttons-template.directive";
export * from "./pager/directives/pager-navigation-buttons-template.directive";
export * from "./pager/directives/pager-page-size-template.directive";

export * from "./pager/models/InfoTemplateContext";
export * from "./pager/models/NavigationButtonsTemplateContext";
export * from "./pager/models/NumericButtonsTemplateContext";
export * from "./pager/models/Page";
export * from "./pager/models/PageChangeEvent";
export * from "./pager/models/PagerType";
export * from "./pager/models/PageSizeChangeEvent";

export { PreventableEvent } from "./utils/PreventableEvent";
