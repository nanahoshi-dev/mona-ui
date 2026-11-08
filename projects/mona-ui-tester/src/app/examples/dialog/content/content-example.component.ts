import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { DialogAction, DialogActionEvent } from "@nanahoshi/mona-ui/dialog";
import { DialogComponent, DialogContentTemplateDirective } from "@nanahoshi/mona-ui/dialog";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-dialog-content-example",
    imports: [ButtonDirective, DialogComponent, DialogContentTemplateDirective, TextBoxComponent],
    templateUrl: "./content-example.component.html"
})
export class DialogContentExampleComponent {
    protected readonly actions: DialogAction<string>[] = [
        { data: "cancel", text: "Cancel" },
        { data: "save", default: true, look: "primary", text: "Save" }
    ];
    protected readonly draftName = signal("");
    protected readonly name = signal("Quarterly report");
    protected readonly open = signal(false);

    protected onAction(event: DialogActionEvent): void {
        if (event.action.data === "save" && this.draftName().trim()) {
            this.name.set(this.draftName().trim());
        }
    }

    protected rename(): void {
        this.draftName.set(this.name());
        this.open.set(true);
    }
}
