import { Directive, forwardRef, inject, TemplateRef } from "@angular/core";
import {
    PopupMenuIconTemplateToken,
    PopupMenuTemplateOrigin,
    PopupMenuTemplateType,
    PopupTemplateConfig
} from "../models/PopupMenuConfig";

@Directive({
    selector: "ng-template[monaPopupMenuIconTemplate]",
    providers: [
        {
            provide: PopupMenuIconTemplateToken,
            useExisting: forwardRef(() => PopupMenuIconTemplateDirective)
        }
    ]
})
export class PopupMenuIconTemplateDirective implements PopupTemplateConfig {
    public readonly origin: PopupMenuTemplateOrigin = PopupMenuTemplateOrigin.Popup;
    public readonly template = inject(TemplateRef);
    public readonly type: PopupMenuTemplateType = PopupMenuTemplateType.Icon;
}
