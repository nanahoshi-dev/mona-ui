import { Component } from "@angular/core";
import { TimelineComponent } from "@nanahoshi/mona-ui/timeline";

interface Chapter {
    readonly description: string;
    readonly title: string;
    readonly year: string;
}

@Component({
    selector: "app-timeline-alternate-example",
    imports: [TimelineComponent],
    templateUrl: "./alternate-example.component.html"
})
export class TimelineAlternateExampleComponent {
    protected readonly history: readonly Chapter[] = [
        { description: "Two friends start the studio in a spare room in Lisbon.", title: "Founded", year: "2014" },
        {
            description: "Our first app, a recipe planner, reaches 100,000 users.",
            title: "First product",
            year: "2016"
        },
        {
            description: "A second office opens in Osaka, and the team grows to 40.",
            title: "Osaka office",
            year: "2019"
        },
        {
            description: "Every product can now be used with a screen reader.",
            title: "Accessible by default",
            year: "2022"
        },
        { description: "The design system goes open source.", title: "Open source", year: "2025" }
    ];
    protected readonly yearOnly: Intl.DateTimeFormatOptions = { year: "numeric" };
}
