import { Orientation } from "mona-ui/models/Orientation";

export interface LabelStyleArgs {
    labelPosition: "before" | "after";
    max: number;
    min: number;
    orientation: Orientation;
    tickCount: number;
}
