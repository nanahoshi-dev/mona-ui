import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuIconTemplateDirective,
    PopupMenuIconTemplateToken,
    PopupMenuTemplateOrigin
} from "@mirei/mona-ui/popup-menu";

@Directive({
    selector: "ng-template[monaSplitButtonMenuItemIconTemplate]",
    providers: [
        {
            provide: PopupMenuIconTemplateToken,
            useExisting: forwardRef(() => SplitButtonMenuItemIconTemplateDirective)
        }
    ]
})
export class SplitButtonMenuItemIconTemplateDirective extends PopupMenuIconTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.SplitButton;
}
