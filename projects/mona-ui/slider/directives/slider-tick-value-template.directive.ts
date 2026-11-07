import { Directive } from "@angular/core";

export interface SliderTickValueTemplateContext {
    readonly $implicit: number;
}

@Directive({
    selector: "ng-template[monaSliderTickValueTemplate]"
})
export class SliderTickValueTemplateDirective {
    public static ngTemplateContextGuard(
        _directive: SliderTickValueTemplateDirective,
        _context: unknown
    ): _context is SliderTickValueTemplateContext {
        return true;
    }
}
