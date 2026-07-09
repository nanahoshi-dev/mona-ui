import { Orientation } from "@nanahoshi/mona-ui/common";

export interface TickStyleArgs {
    largeTickStep: number | null;
    max: number;
    min: number;
    orientation: Orientation;
    smallTickStep: number;
}
