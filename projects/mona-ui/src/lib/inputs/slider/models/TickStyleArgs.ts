import { Orientation } from "../../../models/Orientation";

export interface TickStyleArgs {
    largeTickStep: number | null;
    max: number;
    min: number;
    orientation: Orientation;
    smallTickStep: number;
}
