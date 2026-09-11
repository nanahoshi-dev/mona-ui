import { Pipe, PipeTransform } from "@angular/core";
import { LabelStyleArgs } from "../models/LabelStyleArgs";
import { SliderTick } from "../models/SliderTick";
import { valueToPosition } from "../utils/valueToPosition";

@Pipe({
    name: "labelStyle"
})
export class LabelStylePipe implements PipeTransform {
    public transform(tick: SliderTick, args: LabelStyleArgs): Partial<CSSStyleDeclaration> {
        const styles: Partial<CSSStyleDeclaration> = {};
        const { labelPosition, min, max, orientation } = args;

        const valuePosition = valueToPosition(tick.value, min, max);

        const isRtl = args.direction === "rtl";

        if (orientation === "horizontal") {
            if (isRtl) {
                styles.right = `${valuePosition}%`;
                styles.transform = "translateX(50%)";
            } else {
                styles.left = `${valuePosition}%`;
                styles.transform = "translateX(-50%)";
            }
            styles[labelPosition === "before" ? "bottom" : "top"] = "100%";
        } else {
            styles.bottom = `${valuePosition}%`;
            const side = isRtl
                ? labelPosition === "before"
                    ? "left"
                    : "right"
                : labelPosition === "before"
                  ? "right"
                  : "left";
            styles[side] = "100%";
            styles.transform = "translateY(50%)";
        }

        return styles;
    }
}
