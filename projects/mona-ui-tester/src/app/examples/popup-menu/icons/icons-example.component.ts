import { Component, signal } from "@angular/core";
import { LucideCopy, LucideFolderOpen, LucideSave } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    PopupMenuComponent,
    PopupMenuIconTemplateDirective,
    PopupMenuItemComponent,
    PopupMenuShortcutTemplateDirective
} from "@nanahoshi/mona-ui/popup-menu";

@Component({
    selector: "app-popup-menu-icons-example",
    imports: [
        ButtonDirective,
        LucideCopy,
        LucideFolderOpen,
        LucideSave,
        PopupMenuComponent,
        PopupMenuIconTemplateDirective,
        PopupMenuItemComponent,
        PopupMenuShortcutTemplateDirective
    ],
    templateUrl: "./icons-example.component.html"
})
export class PopupMenuIconsExampleComponent {
    protected readonly open = signal(false);
}
