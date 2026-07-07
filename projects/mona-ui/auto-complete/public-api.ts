/*
 * Public API Surface of @mirei/mona-ui/auto-complete
 */

export * from "../src/lib/dropdowns/auto-complete/components/auto-complete.component";

export * from "../src/lib/dropdowns/directives/drop-down-footer-template.directive";
export * from "../src/lib/dropdowns/directives/drop-down-group-header-template.directive";
export * from "../src/lib/dropdowns/directives/drop-down-header-template.directive";
export * from "../src/lib/dropdowns/directives/drop-down-item-template.directive";
export * from "../src/lib/dropdowns/directives/drop-down-no-data-template.directive";
export * from "../src/lib/dropdowns/directives/dropdown-prefix-template.directive";
export * from "../src/lib/dropdowns/directives/dropdown-suffix-template.directive";
export * from "../src/lib/dropdowns/directives/drop-down-filterable.directive";
export * from "../src/lib/dropdowns/directives/drop-down-groupable.directive";
export * from "../src/lib/dropdowns/directives/drop-down-virtual-scroll.directive";

export type { AutoCompleteVariantProps } from "../src/lib/dropdowns/auto-complete/styles/auto-complete.styles";

export type {
    DropdownFieldPredicateType,
    DropdownFieldSelectorType
} from "../src/lib/dropdowns/models/DropdownFieldTypes";
export type { ListSizeInputType } from "../src/lib/common/list/models/ListSizeType";
export type { FilterableOptions } from "../src/lib/common/models/FilterableOptions";
export type { VirtualScrollOptions } from "../src/lib/common/models/VirtualScrollOptions";
export type { GroupableOptions } from "../src/lib/common/list/models/GroupableOptions";
export { FilterChangeEvent } from "../src/lib/common/filter-input/models/FilterChangeEvent";
export { PopupCloseEvent, PopupCloseSource } from "../src/lib/popup/models/PopupCloseEvent";
export type { PopupCloseEventOptions } from "../src/lib/popup/models/PopupCloseEvent";
export { PreventableEvent } from "../src/lib/utils/PreventableEvent";
