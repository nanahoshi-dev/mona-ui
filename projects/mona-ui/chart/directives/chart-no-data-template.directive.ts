import { Directive, inject, TemplateRef } from "@angular/core";

@Directive({
    selector: "ng-template[monaChartNoDataTemplate]"
})
export class ChartNoDataTemplateDirective {
    public readonly templateRef = inject<TemplateRef<void>>(TemplateRef);

    public static ngTemplateContextGuard(
        _dir: ChartNoDataTemplateDirective,
        _ctx: unknown
    ): _ctx is Record<string, never> {
        return true;
    }
}
