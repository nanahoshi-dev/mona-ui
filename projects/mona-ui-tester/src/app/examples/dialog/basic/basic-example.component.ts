import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { DialogAction, DialogActionEvent } from "@nanahoshi/mona-ui/dialog";
import { DialogComponent } from "@nanahoshi/mona-ui/dialog";

@Component({
    selector: "app-dialog-basic-example",
    imports: [ButtonDirective, DialogComponent],
    templateUrl: "./basic-example.component.html"
})
export class DialogBasicExampleComponent {
    protected readonly actions: DialogAction<string>[] = [
        { data: "keep", default: true, text: "Keep editing" },
        { data: "discard", look: "error", text: "Discard" }
    ];
    protected readonly lastChoice = signal("none");
    protected readonly open = signal(false);

    protected onAction(event: DialogActionEvent): void {
        this.lastChoice.set(event.action.text);
    }
}
