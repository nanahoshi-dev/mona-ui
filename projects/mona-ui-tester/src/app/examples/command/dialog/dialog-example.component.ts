import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CommandComponent,
    CommandDialogComponent,
    CommandDialogContentDirective,
    CommandEmptyComponent,
    CommandHighlightComponent,
    CommandInputComponent,
    CommandItemComponent,
    CommandListComponent,
    CommandShortcutComponent
} from "@nanahoshi/mona-ui/command";

@Component({
    selector: "app-command-dialog-example",
    imports: [
        ButtonDirective,
        CommandComponent,
        CommandDialogComponent,
        CommandDialogContentDirective,
        CommandEmptyComponent,
        CommandHighlightComponent,
        CommandInputComponent,
        CommandItemComponent,
        CommandListComponent,
        CommandShortcutComponent
    ],
    templateUrl: "./dialog-example.component.html"
})
export class CommandDialogExampleComponent {
    protected readonly actions = ["Go to settings", "Invite a teammate", "Sign out"];
    protected readonly lastAction = signal("none");
    protected readonly open = signal(false);

    protected run(action: string): void {
        this.lastAction.set(action);
        this.open.set(false);
    }
}
