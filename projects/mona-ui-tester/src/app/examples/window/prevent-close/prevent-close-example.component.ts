import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { WindowComponent, WindowFooterTemplateDirective } from "@nanahoshi/mona-ui/window";

@Component({
    selector: "app-window-prevent-close-example",
    imports: [ButtonDirective, LabelComponent, TextBoxComponent, WindowComponent, WindowFooterTemplateDirective],
    templateUrl: "./prevent-close-example.component.html"
})
export class WindowPreventCloseExampleComponent {
    protected readonly message = signal("");
    protected readonly name = signal("Ada");
    protected readonly open = signal(false);
    protected readonly saved = signal("Ada");

    /** Keeps the window open while there are unsaved changes. */
    protected confirmClose(event: PopupCloseEvent): void {
        if (this.name() !== this.saved()) {
            event.preventDefault();
            this.message.set("Save or undo your changes before closing.");
        }
    }

    protected save(): void {
        this.saved.set(this.name());
        this.message.set("Saved.");
    }
}
