import { Orientation } from "mona-ui/models/Orientation";

export interface TickStyleArgs {
    largeTickStep: number | null;
    max: number;
    min: number;
    orientation: Orientation;
    smallTickStep: number;
}
