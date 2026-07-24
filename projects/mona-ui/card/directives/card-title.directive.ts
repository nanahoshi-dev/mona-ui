import { Directive, inject, TemplateRef } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";

@Directive({
    selector: "[monaCardTitle]"
})
export class CardTitleDirective {
    public readonly id = createElementControlId();
    public readonly templateRef = inject(TemplateRef);
}
