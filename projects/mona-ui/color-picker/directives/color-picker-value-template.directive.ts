import { Directive } from "@angular/core";
import type { ColorPickerValueTemplateContext } from "../models/ColorPickerValueTemplateContext";

@Directive({
    selector: "ng-template[monaColorPickerValueTemplate]"
})
export class ColorPickerValueTemplateDirective {
    public static ngTemplateContextGuard(
        _directive: ColorPickerValueTemplateDirective,
        _context: unknown
    ): _context is ColorPickerValueTemplateContext {
        return true;
    }
}
