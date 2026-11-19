import { DatePipe } from "@angular/common";
import { Component } from "@angular/core";
import { LucideCheck, LucideTruck } from "@lucide/angular";
import {
    TimelineBodyTemplateDirective,
    TimelineComponent,
    TimelineDateTemplateDirective,
    TimelineMarkerTemplateDirective
} from "@nanahoshi/mona-ui/timeline";

interface OrderStep {
    readonly detail: string;
    readonly place?: string;
    readonly status: "current" | "done" | "upcoming";
    readonly time: Date;
    readonly title: string;
}

@Component({
    selector: "app-timeline-templates-example",
    imports: [
        DatePipe,
        LucideCheck,
        LucideTruck,
        TimelineBodyTemplateDirective,
        TimelineComponent,
        TimelineDateTemplateDirective,
        TimelineMarkerTemplateDirective
    ],
    templateUrl: "./templates-example.component.html"
})
export class TimelineTemplatesExampleComponent {
    protected readonly statusText: Readonly<Record<OrderStep["status"], string>> = {
        current: "In progress",
        done: "Done",
        upcoming: "Not yet"
    };
    protected readonly steps: readonly OrderStep[] = [
        {
            detail: "We've received your order and your payment.",
            status: "done",
            time: new Date(2026, 10, 16, 9, 12),
            title: "Ordered"
        },
        {
            detail: "Your order is packed and labeled.",
            place: "Warehouse, Rotterdam",
            status: "done",
            time: new Date(2026, 10, 16, 15, 40),
            title: "Packed"
        },
        {
            detail: "On its way with the courier.",
            place: "Antwerp sorting center",
            status: "current",
            time: new Date(2026, 10, 17, 7, 5),
            title: "Shipped"
        },
        {
            detail: "Handed to you, or left in a safe place.",
            status: "upcoming",
            time: new Date(2026, 10, 19),
            title: "Delivered"
        }
    ];
}
