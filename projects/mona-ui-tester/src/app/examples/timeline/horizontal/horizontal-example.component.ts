import { Component } from "@angular/core";
import { TimelineComponent } from "@nanahoshi/mona-ui/timeline";

interface Release {
    readonly codename: string;
    readonly date: string;
    readonly highlights: string;
    readonly version: string;
}

@Component({
    selector: "app-timeline-horizontal-example",
    imports: [TimelineComponent],
    templateUrl: "./horizontal-example.component.html"
})
export class TimelineHorizontalExampleComponent {
    protected readonly monthAndYear: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
    protected readonly releases: readonly Release[] = [
        { codename: "Acorn", date: "2025-02-10", highlights: "Buttons, inputs and the theme.", version: "0.1" },
        { codename: "Birch", date: "2025-05-21", highlights: "The grid, with sorting and paging.", version: "0.5" },
        { codename: "Cedar", date: "2025-09-03", highlights: "Date pickers in 18 locales.", version: "0.9" },
        { codename: "Dogwood", date: "2026-01-14", highlights: "Charts, and right-to-left layouts.", version: "1.0" },
        { codename: "Elm", date: "2026-04-28", highlights: "The editor, with tables and images.", version: "1.2" },
        { codename: "Fir", date: "2026-08-19", highlights: "Kanban boards and drag to sort.", version: "1.4" }
    ];
}
