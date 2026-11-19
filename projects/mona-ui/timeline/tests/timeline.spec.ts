import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { TimelineComponent } from "../components/timeline/timeline.component";
import { TimelineBodyTemplateDirective } from "../directives/timeline-body-template.directive";
import { TimelineDateTemplateDirective } from "../directives/timeline-date-template.directive";
import { TimelineHeaderTemplateDirective } from "../directives/timeline-header-template.directive";
import { TimelineMarkerTemplateDirective } from "../directives/timeline-marker-template.directive";
import type { TimelineOrientation } from "../models/TimelineOrientation";

interface Milestone {
    readonly description?: string;
    readonly id: number;
    readonly name: string;
    readonly place?: string;
    readonly when: Date | number | string | null;
}

const MILESTONES: readonly Milestone[] = [
    { description: "The team meets for the first time.", id: 1, name: "Kickoff", place: "Berlin", when: "2026-03-02" },
    { description: "The first build goes to testers.", id: 2, name: "Beta", when: new Date(2026, 5, 15) },
    { id: 3, name: "Launch", place: "Online", when: "2026-11-03T14:30:00" }
];

@Component({
    imports: [TimelineComponent],
    template: `
        <h2 id="history-title">History</h2>
        <mona-timeline
            dateField="when"
            subtitleField="place"
            titleField="name"
            [alternate]="alternate()"
            [aria-label]="label()"
            [collapsible]="collapsible()"
            [data]="milestones()"
            [dateFormat]="dateFormat()"
            [descriptionField]="descriptionField()"
            [headingLevel]="headingLevel()"
            [keyField]="keyField()"
            [orientation]="orientation()"
            [(expandedKeys)]="expandedKeys" />
    `
})
class TimelineHostComponent {
    public readonly alternate = signal(false);
    public readonly collapsible = signal(false);
    public readonly dateFormat = signal<Intl.DateTimeFormatOptions>({ dateStyle: "medium" });
    public readonly descriptionField = signal("description");
    public readonly expandedKeys = signal<readonly unknown[]>([]);
    public readonly headingLevel = signal<number | null>(3);
    public readonly keyField = signal("");
    public readonly label = signal("Project history");
    public readonly milestones = signal<readonly Milestone[]>(MILESTONES);
    public readonly orientation = signal<TimelineOrientation>("vertical");
}

@Component({
    imports: [
        TimelineBodyTemplateDirective,
        TimelineComponent,
        TimelineDateTemplateDirective,
        TimelineHeaderTemplateDirective,
        TimelineMarkerTemplateDirective
    ],
    template: `
        <mona-timeline
            aria-label="Releases"
            titleField="name"
            dateField="when"
            [collapsible]="true"
            [data]="milestones">
            <ng-template
                monaTimelineHeaderTemplate
                [monaTimelineHeaderTemplateOf]="milestones"
                let-event
                let-index="index">
                <span class="header">{{ index + 1 }}. {{ event.name }}</span>
            </ng-template>
            <ng-template monaTimelineBodyTemplate let-event let-expanded="expanded">
                <span class="body">{{ event.id }} {{ expanded ? "open" : "closed" }}</span>
            </ng-template>
            <ng-template monaTimelineDateTemplate let-date="date">
                <span class="date">{{ date ? date.getFullYear() : "none" }}</span>
            </ng-template>
            <ng-template monaTimelineMarkerTemplate let-event>
                <span class="marker">{{ event.id }}</span>
            </ng-template>
        </mona-timeline>
    `
})
class TemplateHostComponent {
    public readonly milestones = MILESTONES;
}

describe("TimelineComponent", () => {
    let fixture: ComponentFixture<TimelineHostComponent>;

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
    });

    async function create(): Promise<TimelineHostComponent> {
        await TestBed.configureTestingModule({ imports: [TimelineHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(TimelineHostComponent);
        document.body.append(fixture.nativeElement as HTMLElement);
        await stable();
        return fixture.componentInstance;
    }

    async function stable(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function query<E extends Element = HTMLElement>(selector: string): E[] {
        return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<E>(selector));
    }

    /** The element's text nodes, joined by spaces as a browser joins its blocks, which jsdom doesn't lay out. */
    function text(element: Element | undefined): string {
        if (element == null) {
            return "";
        }
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const parts: string[] = [];
        for (let node = walker.nextNode(); node != null; node = walker.nextNode()) {
            parts.push(node.textContent ?? "");
        }
        return parts.join(" ").replace(/\s+/g, " ").trim();
    }

    it("is an ordered list of the events, in the order of the data, named by its label", async () => {
        await create();
        const host = query("mona-timeline")[0];
        const list = query("ol")[0];

        expect(host.hasAttribute("aria-label")).toBe(false);
        expect(list.getAttribute("aria-label")).toBe("Project history");
        expect(list.hasAttribute("tabindex")).toBe(false);
        expect(query("li").map(item => text(item.querySelector("[role=heading]") ?? undefined))).toEqual([
            "Kickoff",
            "Beta",
            "Launch"
        ]);
    });

    it("shows each event's date, title as a heading, subtitle and description, the date first", async () => {
        await create();
        const [kickoff, beta, launch] = query("li");

        expect(text(kickoff.querySelector("time") ?? undefined)).toBe("Mar 2, 2026");
        expect(kickoff.querySelector("time")?.getAttribute("datetime")).toBe("2026-03-02");
        expect(kickoff.querySelector("[role=heading]")?.getAttribute("aria-level")).toBe("3");
        expect(text(kickoff)).toBe("Mar 2, 2026 Kickoff Berlin The team meets for the first time.");
        expect(text(beta)).toBe("Jun 15, 2026 Beta The first build goes to testers.");
        expect(text(launch)).toBe("Nov 3, 2026 Launch Online");
        expect(launch.querySelector("p")).toBeNull();
    });

    it("formats the dates with dateFormat in the locale, with the time in datetime when it shows one", async () => {
        const host = await create();
        host.dateFormat.set({ month: "long", year: "numeric" });
        await stable();
        expect(query("time").map(time => text(time))).toEqual(["March 2026", "June 2026", "November 2026"]);

        host.dateFormat.set({ dateStyle: "medium", timeStyle: "short" });
        await stable();
        const launch = query("time")[2];
        expect(text(launch)).toBe("Nov 3, 2026, 2:30 PM");
        expect(launch.getAttribute("datetime")).toMatch(/^2026-11-03T14:30:00(?:Z|[+-]\d{2}:\d{2})$/);

        TestBed.inject(MonaI18nService).use({ ...TestBed.inject(MonaI18nService).locale(), id: "de-DE" });
        host.dateFormat.set({ dateStyle: "long" });
        await stable();
        expect(text(query("time")[0])).toBe("2. März 2026");
    });

    it("shows no date for an event whose date is missing or invalid", async () => {
        const host = await create();
        host.milestones.set([
            { id: 1, name: "Someday", when: null },
            { id: 2, name: "Never", when: "not a date" },
            { id: 3, name: "Epoch", when: 0 }
        ]);
        await stable();

        expect(query("time").length).toBe(1);
        expect(query("li")[2].querySelector("time")?.getAttribute("datetime")).toMatch(/^19(?:69|70)-/);
    });

    it("sets the heading level, or leaves out the headings", async () => {
        const host = await create();
        host.headingLevel.set(2);
        await stable();
        expect(query("[role=heading]").map(heading => heading.getAttribute("aria-level"))).toEqual(["2", "2", "2"]);

        host.headingLevel.set(null);
        await stable();
        expect(query("[role=heading]").length).toBe(0);
        expect(query("[aria-level]").length).toBe(0);
    });

    describe("collapsible", () => {
        async function createCollapsible(): Promise<TimelineHostComponent> {
            const host = await create();
            host.collapsible.set(true);
            await stable();
            return host;
        }

        function buttons(): HTMLButtonElement[] {
            return query<HTMLButtonElement>("button");
        }

        it("makes the header of each event with details a closed disclosure button inside its heading", async () => {
            await createCollapsible();
            const [kickoff, beta] = buttons();

            expect(buttons().length).toBe(2);
            expect(kickoff.closest("[role=heading]")?.getAttribute("aria-level")).toBe("3");
            expect(text(kickoff)).toBe("Kickoff Berlin");
            expect(kickoff.getAttribute("aria-expanded")).toBe("false");
            const details = document.getElementById(kickoff.getAttribute("aria-controls") ?? "");
            expect(text(details ?? undefined)).toBe("The team meets for the first time.");
            expect(details?.hasAttribute("inert")).toBe(true);
            expect(beta.getAttribute("aria-controls")).not.toBe(kickoff.getAttribute("aria-controls"));
            // Launch has no details, so its header stays a heading.
            expect(text(query("li")[2].querySelector("[role=heading]") ?? undefined)).toBe("Launch");
        });

        it("opens and closes an event's details, binding the open events two-way", async () => {
            const host = await createCollapsible();
            buttons()[1].click();
            await stable();

            expect(host.expandedKeys()).toEqual([MILESTONES[1]]);
            expect(buttons()[1].getAttribute("aria-expanded")).toBe("true");
            expect(
                document.getElementById(buttons()[1].getAttribute("aria-controls") ?? "")?.hasAttribute("inert")
            ).toBe(false);

            buttons()[0].click();
            await stable();
            expect(host.expandedKeys()).toEqual([MILESTONES[1], MILESTONES[0]]);

            buttons()[1].click();
            await stable();
            expect(host.expandedKeys()).toEqual([MILESTONES[0]]);
            expect(buttons()[1].getAttribute("aria-expanded")).toBe("false");
        });

        it("opens the events whose keys it's given, by keyField, also after the data is copied", async () => {
            const host = await createCollapsible();
            host.keyField.set("id");
            host.expandedKeys.set([2]);
            await stable();
            expect(buttons().map(button => button.getAttribute("aria-expanded"))).toEqual(["false", "true"]);

            host.milestones.set(MILESTONES.map(milestone => ({ ...milestone })));
            await stable();
            expect(buttons().map(button => button.getAttribute("aria-expanded"))).toEqual(["false", "true"]);

            buttons()[0].click();
            await stable();
            expect(host.expandedKeys()).toEqual([2, 1]);
        });

        it("passes axe, open and closed", async () => {
            const host = await createCollapsible();
            host.expandedKeys.set([MILESTONES[0]]);
            await stable();
            const results = await axe.run(fixture.nativeElement as HTMLElement);

            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });
    });

    describe("horizontal", () => {
        it("takes focus, so the arrow keys scroll it, and passes axe", async () => {
            const host = await create();
            host.orientation.set("horizontal");
            host.alternate.set(true);
            await stable();

            expect(query("ol")[0].getAttribute("tabindex")).toBe("0");
            const results = await axe.run(fixture.nativeElement as HTMLElement);
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });
    });

    it("draws the line between the markers, and none for a single event", async () => {
        const host = await create();
        expect(query("li").map(item => item.querySelectorAll("span.absolute").length)).toEqual([1, 1, 1]);

        host.milestones.set([MILESTONES[0]]);
        await stable();
        expect(query("li")[0].querySelectorAll("span.absolute").length).toBe(0);
    });

    it("lays out an alternating vertical timeline by its own width", async () => {
        const host = await create();
        const timeline = query("mona-timeline")[0];
        expect(timeline.classList).not.toContain("@container");

        host.alternate.set(true);
        await stable();
        expect(timeline.classList).toContain("@container");

        host.orientation.set("horizontal");
        await stable();
        expect(timeline.classList).not.toContain("@container");
    });

    it("passes axe", async () => {
        await create();
        const results = await axe.run(fixture.nativeElement as HTMLElement);

        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });
});

describe("TimelineComponent templates", () => {
    it("renders the header, body, date and marker templates with each event's context", async () => {
        await TestBed.configureTestingModule({ imports: [TemplateHostComponent] }).compileComponents();
        const fixture = TestBed.createComponent(TemplateHostComponent);
        document.body.append(fixture.nativeElement as HTMLElement);
        fixture.detectChanges();
        await fixture.whenStable();
        const element = fixture.nativeElement as HTMLElement;
        const texts = (selector: string): string[] =>
            Array.from(element.querySelectorAll(selector), node => node.textContent?.trim() ?? "");

        expect(texts(".header")).toEqual(["1. Kickoff", "2. Beta", "3. Launch"]);
        // With a body template, every event has details, so every header is a button.
        expect(element.querySelectorAll("button").length).toBe(3);
        expect(element.querySelector("button .header")).not.toBeNull();
        expect(texts(".body")).toEqual(["1 closed", "2 closed", "3 closed"]);
        expect(texts(".date")).toEqual(["2026", "2026", "2026"]);
        expect(texts(".marker")).toEqual(["1", "2", "3"]);
        expect(element.querySelector("time")).toBeNull();

        element.querySelector("button")?.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(texts(".body")).toEqual(["1 open", "2 closed", "3 closed"]);
        element.remove();
    });
});
