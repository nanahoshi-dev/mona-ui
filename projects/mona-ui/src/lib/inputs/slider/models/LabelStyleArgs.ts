import { Orientation } from "../../../models/Orientation";

export interface LabelStyleArgs {
    labelPosition: "before" | "after";
    max: number;
    min: number;
    orientation: Orientation;
    tickCount: number;
}
