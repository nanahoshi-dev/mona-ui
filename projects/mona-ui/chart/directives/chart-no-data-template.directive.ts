import { Directive, inject, TemplateRef } from "@angular/core";

@Directive({
    selector: "ng-template[monaChartNoDataTemplate]"
})
export class ChartNoDataTemplateDirective {
    public readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
