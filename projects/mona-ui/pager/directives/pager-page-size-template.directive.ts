import { Directive } from "@angular/core";
import type { PageSizeTemplateContext } from "../models/PageSizeTemplateContext";

@Directive({
    selector: "ng-template[monaPagerPageSizeTemplate]"
})
export class PagerPageSizeTemplateDirective {
    public static ngTemplateContextGuard(
        _directive: PagerPageSizeTemplateDirective,
        _context: unknown
    ): _context is PageSizeTemplateContext {
        return true;
    }
}
