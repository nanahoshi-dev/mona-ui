import { Directive, TemplateRef, inject } from "@angular/core";

export interface OtpInputSeparatorContext {
    $implicit: number;
    groupIndex: number;
}

@Directive({
    selector: "ng-template[monaOtpInputSeparatorTemplate]"
})
export class OtpInputSeparatorTemplateDirective {
    public readonly templateRef = inject(TemplateRef<OtpInputSeparatorContext>);
    public static ngTemplateContextGuard(
        _directive: OtpInputSeparatorTemplateDirective,
        context: unknown
    ): context is OtpInputSeparatorContext {
        return true;
    }
}
