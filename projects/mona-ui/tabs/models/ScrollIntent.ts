import { ScrollDirection } from "@mirei/mona-ui/common";

export interface ScrollIntent {
    direction: ScrollDirection;
    element: HTMLElement;
    type: "single" | "continuous";
}
