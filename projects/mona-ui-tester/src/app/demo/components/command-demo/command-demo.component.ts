import { Component, resource, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CommandComponent,
    CommandDialogComponent,
    CommandDialogContentDirective,
    CommandEmptyComponent,
    CommandFooterComponent,
    CommandGroupComponent,
    CommandHighlightComponent,
    CommandInputComponent,
    CommandItemComponent,
    CommandListComponent,
    CommandLoadingComponent,
    CommandSeparatorComponent,
    CommandShortcutComponent
} from "@nanahoshi/mona-ui/command";
import { PopoverComponent } from "@nanahoshi/mona-ui/popover";

const CITIES = ["Ankara", "Berlin", "Buenos Aires", "Cairo", "Kyoto", "Lagos", "Lima", "Oslo", "Seoul", "Toronto"];

/** Stands in for a server: answers slowly, and more slowly for short queries, so answers can arrive out of order. */
const searchCities = (query: string, signal: AbortSignal): Promise<string[]> =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => resolve(CITIES.filter(city => city.toLowerCase().includes(query.toLowerCase()))),
            1200 / Math.max(query.length, 1) + 200
        );
        signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(signal.reason);
        });
    });

@Component({
    selector: "app-command-demo",
    imports: [
        ButtonDirective,
        CommandComponent,
        CommandDialogComponent,
        CommandDialogContentDirective,
        CommandEmptyComponent,
        CommandFooterComponent,
        CommandGroupComponent,
        CommandHighlightComponent,
        CommandInputComponent,
        CommandItemComponent,
        CommandListComponent,
        CommandLoadingComponent,
        CommandSeparatorComponent,
        CommandShortcutComponent,
        PopoverComponent
    ],
    templateUrl: "./command-demo.component.html"
})
export class CommandDemoComponent {
    protected readonly assignee = signal("nobody");
    protected readonly city = signal("none");
    protected readonly lastAction = signal("none");
    protected readonly open = signal(false);
    protected readonly people = ["Ada Lovelace", "Grace Hopper", "José Martí", "Katherine Johnson", "Linus Torvalds"];
    protected readonly query = signal("");
    protected readonly results = resource({
        defaultValue: [],
        loader: ({ abortSignal, params }) => searchCities(params, abortSignal),
        params: () => this.query()
    });

    protected run(action: string): void {
        this.lastAction.set(action);
        this.open.set(false);
    }
}
