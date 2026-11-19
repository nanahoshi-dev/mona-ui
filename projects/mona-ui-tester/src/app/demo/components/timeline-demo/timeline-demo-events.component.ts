import { booleanAttribute, Component, input, model } from "@angular/core";
import { type TimelineOrientation, TimelineComponent } from "@nanahoshi/mona-ui/timeline";
import type { ComponentInputsAsSignal } from "../../utils/componentConfig";

interface Trip {
    readonly date: string;
    readonly description: string;
    readonly place: string;
    readonly title: string;
}

/** The playground's timeline: the stops of a trip through Japan. */
@Component({
    imports: [TimelineComponent],
    templateUrl: "./timeline-demo-events.component.html"
})
export class TimelineDemoEventsComponent implements ComponentInputsAsSignal<TimelineComponent> {
    protected readonly trip: readonly Trip[] = [
        {
            date: "2026-04-02T10:30",
            description: "Landing at Haneda, then the monorail into the city.",
            place: "Tokyo",
            title: "Arrival"
        },
        {
            date: "2026-04-04T08:15",
            description: "The early shinkansen, with Mount Fuji on the right.",
            place: "Tokyo to Kyoto",
            title: "Bullet train"
        },
        {
            date: "2026-04-05T06:00",
            description: "The thousand gates of Fushimi Inari before the crowds.",
            place: "Kyoto",
            title: "Shrines at dawn"
        },
        {
            date: "2026-04-07T12:00",
            description: "Deer, temples and a long lunch.",
            place: "Nara",
            title: "Day trip"
        },
        {
            date: "2026-04-09T18:45",
            description: "Street food along the canal in Dotonbori.",
            place: "Osaka",
            title: "Last night"
        }
    ];

    public readonly alternate = input(false, { transform: booleanAttribute });
    public readonly collapsible = input(false, { transform: booleanAttribute });
    public readonly dateFormat = input<Intl.DateTimeFormatOptions>({ dateStyle: "medium" });
    public readonly expandedKeys = model<readonly unknown[]>([]);
    public readonly headingLevel = input<number | null, unknown>(2, { transform: value => value as number | null });
    public readonly orientation = input<TimelineOrientation>("vertical");
    public readonly userClass = input("");
}
