import { Directive } from "@angular/core";

export interface SwitchHandleContentTemplateContext {
    readonly $implicit: boolean;
}

@Directive({
    selector: "ng-template[monaSwitchHandleContentTemplate]"
})
export class SwitchHandleContentTemplateDirective {
    public static ngTemplateContextGuard(
        _directive: SwitchHandleContentTemplateDirective,
        _context: unknown
    ): _context is SwitchHandleContentTemplateContext {
        return true;
    }
}
