import { Component, signal } from "@angular/core";
import { LucideClipboardPaste, LucideCopy, LucideScissors } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ContextMenuComponent,
    ContextMenuIconTemplateDirective,
    ContextMenuItemComponent,
    ContextMenuShortcutTemplateDirective
} from "@nanahoshi/mona-ui/contextmenu";

@Component({
    selector: "app-contextmenu-icons-example",
    imports: [
        ButtonDirective,
        ContextMenuComponent,
        ContextMenuIconTemplateDirective,
        ContextMenuItemComponent,
        ContextMenuShortcutTemplateDirective,
        LucideClipboardPaste,
        LucideCopy,
        LucideScissors
    ],
    templateUrl: "./icons-example.component.html"
})
export class ContextMenuIconsExampleComponent {
    protected readonly lastAction = signal("none");
}
