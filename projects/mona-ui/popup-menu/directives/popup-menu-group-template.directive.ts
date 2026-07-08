import { Directive, forwardRef, inject, TemplateRef } from "@angular/core";
import {
    PopupMenuGroupTemplateToken,
    PopupMenuTemplateOrigin,
    PopupMenuTemplateType,
    PopupTemplateConfig
} from "../models/PopupMenuConfig";

@Directive({
    selector: "ng-template[monaPopupMenuGroupTemplate]",
    providers: [
        {
            provide: PopupMenuGroupTemplateToken,
            useExisting: forwardRef(() => PopupMenuGroupTemplateDirective)
        }
    ]
})
export class PopupMenuGroupTemplateDirective implements PopupTemplateConfig {
    public readonly origin: PopupMenuTemplateOrigin = PopupMenuTemplateOrigin.Popup;
    public readonly template = inject(TemplateRef);
    public readonly type = PopupMenuTemplateType.Group;
}
