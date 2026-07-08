import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuGroupTemplateDirective,
    PopupMenuGroupTemplateToken,
    PopupMenuTemplateOrigin
} from "@mirei/mona-ui/popup-menu";

@Directive({
    selector: "ng-template[monaSplitButtonMenuGroupTemplate]",
    providers: [
        {
            provide: PopupMenuGroupTemplateToken,
            useExisting: forwardRef(() => SplitButtonMenuGroupTemplateDirective)
        }
    ]
})
export class SplitButtonMenuGroupTemplateDirective extends PopupMenuGroupTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.SplitButton;
}
