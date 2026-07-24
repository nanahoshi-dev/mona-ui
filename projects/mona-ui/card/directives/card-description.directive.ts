import { Directive, inject, TemplateRef } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";

@Directive({
    selector: "[monaCardDescription]"
})
export class CardDescriptionDirective {
    public readonly id = createElementControlId();
    public readonly templateRef = inject(TemplateRef);
}
