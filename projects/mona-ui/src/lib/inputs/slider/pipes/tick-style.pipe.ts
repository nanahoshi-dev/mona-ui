import { Pipe, PipeTransform } from "@angular/core";
import { SliderTick } from "mona-ui/inputs/models/SliderTick";
import { TickStyleArgs } from "mona-ui/inputs/slider/models/TickStyleArgs";
import { valueToPosition } from "mona-ui/inputs/slider/utils/valueToPosition";

@Pipe({
    name: "tickStyle"
})
export class TickStylePipe implements PipeTransform {
    public transform(tick: SliderTick, args: TickStyleArgs): Partial<CSSStyleDeclaration> {
        const { min, max, orientation, tickStep } = args;
        const position = valueToPosition(tick.value, min, max);
        const height = orientation === "horizontal" ? (tick.index % tickStep === 0 ? 28 : 20) : 8;
        const width = orientation === "horizontal" ? 8 : tick.index % tickStep === 0 ? 28 : 20;

        if (orientation === "horizontal") {
            return {
                position: "absolute",
                left: `${position}%`,
                top: "50%",
                transform: "translateX(-75%) translateY(-50%) translateZ(0)",
                width: "1px",
                height: `${height}px`,
                backfaceVisibility: "hidden"
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
}
