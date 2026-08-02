export type TabScrollDirection = "previous" | "next";

export interface ScrollIntent {
    direction: TabScrollDirection;
    element: HTMLElement;
    type: "single" | "continuous";
}
