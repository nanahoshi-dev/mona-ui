import { Component, computed, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TimelineComponent } from "@nanahoshi/mona-ui/timeline";

interface Change {
    readonly date: string;
    readonly notes: string;
    readonly summary: string;
    readonly version: string;
}

@Component({
    selector: "app-timeline-collapsible-example",
    imports: [ButtonDirective, TimelineComponent],
    templateUrl: "./collapsible-example.component.html"
})
export class TimelineCollapsibleExampleComponent {
    protected readonly changes: readonly Change[] = [
        {
            date: "2026-11-18",
            notes: "Paste or drop an image into the editor to upload it.\nWord and character counts, with a soft limit.",
            summary: "Editor uploads and counts",
            version: "2.4.0"
        },
        {
            date: "2026-10-30",
            notes: "The date picker no longer opens a second time after a quick Escape.",
            summary: "Date picker fix",
            version: "2.3.1"
        },
        {
            date: "2026-10-02",
            notes: "Bottom sheets for drop-downs on small screens.\nA tree in a drop-down, with multi-selection.",
            summary: "Drop-down trees and sheets",
            version: "2.3.0"
        }
    ];
    protected readonly openCount = computed(() => this.openVersions().length);
    protected readonly openVersions = signal<readonly unknown[]>(["2.4.0"]);

    protected collapseAll(): void {
        this.openVersions.set([]);
    }

    protected expandAll(): void {
        this.openVersions.set(this.changes.map(change => change.version));
    }
}
