import { Directive } from "@angular/core";

export interface SliderHandleTemplateContext {
    readonly $implicit: number;
}

@Directive({
    selector: "ng-template[monaSliderHandleTemplate]"
})
export class SliderHandleTemplateDirective {
    public static ngTemplateContextGuard(
        _directive: SliderHandleTemplateDirective,
        _context: unknown
    ): _context is SliderHandleTemplateContext {
        return true;
    }
}
