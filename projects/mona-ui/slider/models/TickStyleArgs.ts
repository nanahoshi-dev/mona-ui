import { Orientation } from "@mirei/mona-ui/common";

export interface TickStyleArgs {
    largeTickStep: number | null;
    max: number;
    min: number;
    orientation: Orientation;
    smallTickStep: number;
}
