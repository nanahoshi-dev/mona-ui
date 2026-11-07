import { Directive, inject, TemplateRef } from "@angular/core";

@Directive({
    selector: "ng-template[monaCardContent]"
})
export class CardContentDirective {
    public readonly templateRef = inject(TemplateRef);
}
