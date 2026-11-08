/*
 * Public API Surface of @nanahoshi/mona-ui/tooltip
 */

export * from "./components/tooltip/tooltip.component";
export * from "./directives/tooltip.directive";
export type { OverlaySide } from "@nanahoshi/mona-ui/internal";
export type * from "./models/TooltipPosition";

export { tooltipArrowThemeVariants } from "./styles/tooltip.styles";

export { getOffsetForPosition, getPositionConnectionPoints } from "./utils/tooltip.utils";
