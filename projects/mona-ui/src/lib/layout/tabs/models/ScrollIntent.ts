import { ScrollDirection } from "../../../models/ScrollDirection";

export interface ScrollIntent {
    direction: ScrollDirection;
    element: HTMLElement;
    type: "single" | "continuous";
}
