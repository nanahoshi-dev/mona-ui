import { Directive, forwardRef, inject, TemplateRef } from "@angular/core";
import {
    PopupMenuShortcutTemplateToken,
    PopupMenuTemplateOrigin,
    PopupMenuTemplateType,
    PopupTemplateConfig
} from "@nanahoshi/mona-ui/internal/popup-menu";

@Directive({
    selector: "ng-template[monaPopupMenuShortcutTemplate]",
    providers: [
        {
            provide: PopupMenuShortcutTemplateToken,
            useExisting: forwardRef(() => PopupMenuShortcutTemplateDirective)
        }
    ]
})
export class PopupMenuShortcutTemplateDirective implements PopupTemplateConfig {
    public readonly origin: PopupMenuTemplateOrigin = PopupMenuTemplateOrigin.Popup;
    public readonly template = inject(TemplateRef);
    public readonly type: PopupMenuTemplateType = PopupMenuTemplateType.Shortcut;
}
