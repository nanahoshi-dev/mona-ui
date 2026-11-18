import { Component, signal } from "@angular/core";
import {
    LucideBold,
    LucideItalic,
    LucideLink,
    LucideRedo2,
    LucideRemoveFormatting,
    LucideStrikethrough,
    LucideUnderline,
    LucideUndo2
} from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SeparatorComponent } from "@nanahoshi/mona-ui/separator";
import { ToolbarComponent, ToolbarItemDirective } from "@nanahoshi/mona-ui/toolbar";

@Component({
    selector: "app-toolbar-editor-example",
    imports: [
        ButtonDirective,
        LucideBold,
        LucideItalic,
        LucideLink,
        LucideRedo2,
        LucideRemoveFormatting,
        LucideStrikethrough,
        LucideUnderline,
        LucideUndo2,
        SeparatorComponent,
        ToolbarComponent,
        ToolbarItemDirective
    ],
    templateUrl: "./editor-example.component.html"
})
export class ToolbarEditorExampleComponent {
    protected readonly bold = signal(false);
    protected readonly italic = signal(false);
    protected readonly lastAction = signal("");
    protected readonly strikethrough = signal(false);
    protected readonly underline = signal(false);

    protected clearFormatting(): void {
        this.bold.set(false);
        this.italic.set(false);
        this.strikethrough.set(false);
        this.underline.set(false);
        this.lastAction.set("Formatting cleared.");
    }
}
