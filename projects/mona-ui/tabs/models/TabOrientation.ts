import type { TabsPosition } from "./TabsPosition";

export type TabOrientation = "horizontal" | "vertical";

export function getTabOrientation(position: TabsPosition): TabOrientation {
    return position === "left" || position === "right"
        ? "vertical"
        : "horizontal";
}
