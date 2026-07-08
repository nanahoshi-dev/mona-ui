import { Pipe, PipeTransform } from "@angular/core";
import { SliderTick } from "../models/SliderTick";
import { LabelStyleArgs } from "../models/LabelStyleArgs";
import { valueToPosition } from "../utils/valueToPosition";

@Pipe({
    name: "labelStyle"
})
export class LabelStylePipe implements PipeTransform {
    public transform(tick: SliderTick, args: LabelStyleArgs): Partial<CSSStyleDeclaration> {
        const styles: Partial<CSSStyleDeclaration> = {};
        const { labelPosition, min, max, orientation } = args;

        const valuePosition = valueToPosition(tick.value, min, max);

        if (orientation === "horizontal") {
            styles.left = `${valuePosition}%`;
            styles[labelPosition === "before" ? "bottom" : "top"] = "100%";
            styles.transform = "translateX(-50%)";
        } else {
            styles.bottom = `${valuePosition}%`;
            styles[labelPosition === "before" ? "right" : "left"] = "100%";
            styles.transform = "translateY(50%)";
        }

        return styles;
    }
}
