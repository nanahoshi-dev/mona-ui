import { Directive, inject, TemplateRef } from "@angular/core";

@Directive({
    selector: "ng-template[monaCardAction]"
})
export class CardActionDirective {
    public readonly templateRef = inject(TemplateRef);
}
