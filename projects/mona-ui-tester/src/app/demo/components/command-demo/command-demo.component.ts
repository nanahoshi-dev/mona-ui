import { Component, signal } from "@angular/core";
import {
    CommandComponent,
    CommandEmptyComponent,
    CommandFooterComponent,
    CommandGroupComponent,
    CommandHighlightComponent,
    CommandInputComponent,
    CommandItemComponent,
    CommandListComponent,
    CommandSeparatorComponent,
    CommandShortcutComponent
} from "@nanahoshi/mona-ui/command";

@Component({
    selector: "app-command-demo",
    imports: [
        CommandComponent,
        CommandEmptyComponent,
        CommandFooterComponent,
        CommandGroupComponent,
        CommandHighlightComponent,
        CommandInputComponent,
        CommandItemComponent,
        CommandListComponent,
        CommandSeparatorComponent,
        CommandShortcutComponent
    ],
    templateUrl: "./command-demo.component.html"
})
export class CommandDemoComponent {
    protected readonly lastAction = signal("none");
}
