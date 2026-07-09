import { ScrollDirection } from "@nanahoshi/mona-ui/common";

export interface ScrollIntent {
    direction: ScrollDirection;
    element: HTMLElement;
    type: "single" | "continuous";
}
