import { Pipe, PipeTransform } from "@angular/core";
import { SliderTick } from "../../models/SliderTick";
import { TickStyleArgs } from "../models/TickStyleArgs";
import { valueToPosition } from "../utils/valueToPosition";

@Pipe({
    name: "tickStyle"
})
export class TickStylePipe implements PipeTransform {
    public transform(tick: SliderTick, args: TickStyleArgs): Partial<CSSStyleDeclaration> {
        const { largeTickStep, min, max, orientation, smallTickStep } = args;
        const position = valueToPosition(tick.value, min, max);
        const height = this.getHeight(tick, smallTickStep, largeTickStep, orientation);
        const width = this.getWidth(tick, smallTickStep, largeTickStep, orientation);

        if (orientation === "horizontal") {
            return {
                position: "absolute",
                left: `${position}%`,
                top: "50%",
                transform: "translateX(-50%) translateY(-50%) translateZ(0)",
                width: "1px",
                height: `${height}px`,
                backfaceVisibility: "hidden",
                willChange: "transform"
            };
        } else {
            return {
                position: "absolute",
                bottom: `${position}%`,
                left: "50%",
                transform: "translateX(-50%) translateY(50%) translateZ(0)",
                width: `${width}px`,
                height: "1px",
                backfaceVisibility: "hidden"
            };
        }
    }

    private getHeight(
        tick: SliderTick,
        smallStep: number,
        largeStep: number | null,
        orientation: "horizontal" | "vertical"
    ): number {
        if (orientation === "vertical") {
            return 8;
        }
        if (smallStep === 1 && largeStep === null) {
            return 16;
        }
        if (smallStep === 1 && largeStep !== null) {
            return tick.index % largeStep !== 0 ? 16 : 24;
        }
        if (smallStep > 1 && largeStep === null) {
            return tick.index % smallStep !== 0 ? 0 : 16;
        }
        if (smallStep > 1 && largeStep !== null) {
            return tick.index % smallStep !== 0 ? 0 : tick.index % largeStep !== 0 ? 16 : 24;
        }
        return 8;
    }

    private getWidth(
        tick: SliderTick,
        smallStep: number,
        largeStep: number | null,
        orientation: "horizontal" | "vertical"
    ): number {
        if (orientation === "vertical") {
            if (smallStep === 1) {
                return 16; // Default width for vertical orientation with no step
            }
            return tick.index % smallStep !== 0 ? 0 : 16;
        }
        return 8; // Default width for horizontal orientation
    }
}
