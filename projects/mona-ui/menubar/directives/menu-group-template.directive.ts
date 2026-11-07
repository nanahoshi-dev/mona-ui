import { Directive, forwardRef } from "@angular/core";
import { PopupMenuGroupTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuGroupTemplateToken, PopupMenuTemplateOrigin } from "@nanahoshi/mona-ui/internal/popup-menu";

/** Customizes a group header's content. */
@Directive({
    selector: "ng-template[monaMenuGroupTemplate]",
    providers: [
        {
            provide: PopupMenuGroupTemplateToken,
            useExisting: forwardRef(() => MenuGroupTemplateDirective)
        }
    ]
})
export class MenuGroupTemplateDirective extends PopupMenuGroupTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.MenubarMenu;
}
