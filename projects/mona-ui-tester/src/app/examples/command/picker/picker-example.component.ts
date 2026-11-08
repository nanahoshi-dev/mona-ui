import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CommandComponent,
    CommandEmptyComponent,
    CommandHighlightComponent,
    CommandInputComponent,
    CommandItemComponent,
    CommandListComponent
} from "@nanahoshi/mona-ui/command";
import { PopoverComponent } from "@nanahoshi/mona-ui/popover";

@Component({
    selector: "app-command-picker-example",
    imports: [
        ButtonDirective,
        CommandComponent,
        CommandEmptyComponent,
        CommandHighlightComponent,
        CommandInputComponent,
        CommandItemComponent,
        CommandListComponent,
        PopoverComponent
    ],
    templateUrl: "./picker-example.component.html"
})
export class CommandPickerExampleComponent {
    protected readonly assignee = signal("nobody");
    protected readonly people = ["Ada Lovelace", "Grace Hopper", "José Martí", "Katherine Johnson", "Linus Torvalds"];
}
