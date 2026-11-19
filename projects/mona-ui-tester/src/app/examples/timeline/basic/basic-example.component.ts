import { Component } from "@angular/core";
import { TimelineComponent } from "@nanahoshi/mona-ui/timeline";

interface Milestone {
    readonly date: string;
    readonly description: string;
    readonly subtitle: string;
    readonly title: string;
}

@Component({
    selector: "app-timeline-basic-example",
    imports: [TimelineComponent],
    templateUrl: "./basic-example.component.html"
})
export class TimelineBasicExampleComponent {
    protected readonly milestones: readonly Milestone[] = [
        {
            date: "2026-01-12",
            description: "Interviews with twelve customers set the goals for the new app.",
            subtitle: "Discovery team",
            title: "Research"
        },
        {
            date: "2026-03-02",
            description: "Wireframes and a clickable prototype, tested with five users.",
            subtitle: "Product design",
            title: "Design"
        },
        {
            date: "2026-06-15",
            description: "The first build goes out to 200 testers.",
            subtitle: "Engineering",
            title: "Beta"
        },
        {
            date: "2026-09-01",
            description: "The app ships to the App Store and Google Play.",
            subtitle: "Everyone",
            title: "Launch"
        }
    ];
}
