import { Orientation } from "@mirei/mona-ui/common";

export interface LabelStyleArgs {
    labelPosition: "before" | "after";
    max: number;
    min: number;
    orientation: Orientation;
    tickCount: number;
}
