import { Orientation } from "@nanahoshi/mona-ui/common";

export interface LabelStyleArgs {
    direction: "ltr" | "rtl";
    labelPosition: "before" | "after";
    max: number;
    min: number;
    orientation: Orientation;
    tickCount: number;
}

