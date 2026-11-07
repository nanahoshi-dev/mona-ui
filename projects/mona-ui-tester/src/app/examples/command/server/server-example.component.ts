import { Component, resource, signal } from "@angular/core";
import {
    CommandComponent,
    CommandEmptyComponent,
    CommandFooterComponent,
    CommandHighlightComponent,
    CommandInputComponent,
    CommandItemComponent,
    CommandListComponent,
    CommandLoadingComponent
} from "@nanahoshi/mona-ui/command";

const CITIES = ["Ankara", "Berlin", "Buenos Aires", "Cairo", "Kyoto", "Lagos", "Lima", "Oslo", "Seoul", "Toronto"];

/** Stands in for a server: it answers slowly, and more slowly for short queries, so answers can arrive out of order. */
const searchCities = (query: string, abortSignal: AbortSignal): Promise<string[]> =>
    new Promise(resolve => {
        const timer = setTimeout(
            () => resolve(CITIES.filter(city => city.toLowerCase().includes(query.toLowerCase()))),
            1200 / Math.max(query.length, 1) + 200
        );
        abortSignal.addEventListener("abort", () => {
            clearTimeout(timer);
            resolve([]);
        });
    });

@Component({
    selector: "app-command-server-example",
    imports: [
        CommandComponent,
        CommandEmptyComponent,
        CommandFooterComponent,
        CommandHighlightComponent,
        CommandInputComponent,
        CommandItemComponent,
        CommandListComponent,
        CommandLoadingComponent
    ],
    templateUrl: "./server-example.component.html"
})
export class CommandServerExampleComponent {
    protected readonly chosen = signal("none");
    protected readonly query = signal("");
    protected readonly results = resource({
        defaultValue: [],
        loader: ({ abortSignal, params }) => searchCities(params, abortSignal),
        params: () => this.query()
    });
}
