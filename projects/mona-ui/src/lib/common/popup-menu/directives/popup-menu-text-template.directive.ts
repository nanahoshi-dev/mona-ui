import { Directive, forwardRef, inject, TemplateRef } from "@angular/core";
import {
    PopupMenuTemplateOrigin,
    PopupMenuTemplateType,
    PopupMenuTextTemplateToken,
    PopupTemplateConfig
} from "../models/PopupMenuConfig";

@Directive({
    selector: "ng-template[monaPopupMenuTextTemplate]",
    providers: [
        {
            provide: PopupMenuTextTemplateToken,
            useExisting: forwardRef(() => PopupMenuTextTemplateDirective)
        }
    ]
})
export class PopupMenuTextTemplateDirective implements PopupTemplateConfig {
    public readonly origin: PopupMenuTemplateOrigin = PopupMenuTemplateOrigin.Popup;
    public readonly template = inject(TemplateRef);
    public readonly type: PopupMenuTemplateType = PopupMenuTemplateType.Text;
}
