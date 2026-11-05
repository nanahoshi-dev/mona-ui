import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { ChartComponent } from "../components/chart/chart.component";
import { ChartBrushComponent } from "../components/chart-brush/chart-brush.component";
import { ChartLegendComponent } from "../components/chart-legend/chart-legend.component";
import { ChartSelectionComponent } from "../components/chart-selection/chart-selection.component";
import { ChartTooltipComponent } from "../components/chart-tooltip/chart-tooltip.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { ChartKeyboardNavigation } from "../internal/interaction/chart-keyboard-navigation";
import type { ChartPointEvent } from "../models/chart-event.models";
import type { ChartBrushChangeEvent } from "../models/chart-brush.models";
import type { ChartSelectionChangeEvent } from "../models/chart-selection.models";
import type { ChartNavigationInput } from "../models/chart-viewport.models";

@Component({
    imports: [
        ChartComponent,
        BarSeriesComponent,
        LineSeriesComponent,
        ChartLegendComponent,
        ChartSelectionComponent,
        ChartTooltipComponent,
        ChartBrushComponent
    ],
    template: `
        <mona-chart
            [animation]="false"
            [style.width.px]="600"
            [style.height.px]="400"
            [data]="data()"
            xField="x"
            [title]="title()"
            [landmark]="landmark()"
            [dataTable]="dataTable()"
            [navigation]="navigation()"
            (pointClick)="clicks.push($event)">
            <mona-bar-series name="Revenue" field="revenue" />
            <mona-line-series name="Cost" field="cost" />
            <mona-chart-legend />
            <mona-chart-tooltip />
            @if (selection()) {
                <mona-chart-selection (selectionChange)="selections.push($event)" />
            }
            @if (brush()) {
                <mona-chart-brush mode="x" (brushChange)="brushes.push($event)" />
            }
        </mona-chart>
        @if (second()) {
            <mona-chart [animation]="false" [style.width.px]="300" [style.height.px]="200" [data]="data()" xField="x">
                <mona-bar-series name="Revenue" field="revenue" />
            </mona-chart>
        }
    `
})
class ChartHostComponent {
    public readonly brush = signal(false);
    public readonly brushes: ChartBrushChangeEvent[] = [];
    public readonly chart = viewChild.required(ChartComponent);
    public readonly clicks: ChartPointEvent[] = [];
    public readonly data = signal<readonly { cost: number; revenue: number; x: string }[]>([
        { cost: 5, revenue: 10, x: "A" },
        { cost: 8, revenue: 30, x: "B" },
        { cost: 6, revenue: 20, x: "C" }
    ]);
    public readonly dataTable = signal(false);
    public readonly landmark = signal(false);
    public readonly navigation = signal<ChartNavigationInput>(false);
    public readonly second = signal(false);
    public readonly selection = signal(false);
    public readonly selections: ChartSelectionChangeEvent[] = [];
    public readonly title = signal("Sales");
}

function render(setup?: (host: ChartHostComponent) => void): ComponentFixture<ChartHostComponent> {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 600, 400));
    TestBed.configureTestingModule({ imports: [ChartHostComponent] });
    const fixture = TestBed.createComponent(ChartHostComponent);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    return fixture;
}

function chartHost(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector("mona-chart") as HTMLElement;
}

function liveText(fixture: ComponentFixture<unknown>): string {
    return chartHost(fixture).querySelector('[aria-live="polite"]')?.textContent?.trim() ?? "";
}

function description(fixture: ComponentFixture<unknown>): string {
    const id = chartHost(fixture).getAttribute("aria-describedby") ?? "";
    return document.getElementById(id)?.textContent ?? "";
}

function press(
    fixture: ComponentFixture<unknown>,
    key: string,
    options: KeyboardEventInit = {},
    target: HTMLElement = chartHost(fixture)
): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...options });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Chart host semantics", () => {
    it("is a named application that screen readers call a chart, described by its data and keys", () => {
        const fixture = render();
        const host = chartHost(fixture);

        expect(host.getAttribute("role")).toBe("application");
        expect(host.getAttribute("aria-roledescription")).toBe("chart");
        expect(host.getAttribute("aria-label")).toBe("Sales");
        expect(host.hasAttribute("aria-description")).toBe(false);
        const text = description(fixture);
        expect(text).toContain("2 series: Revenue, Cost.");
        expect(text).toContain("From A to C.");
        expect(text).toContain("Revenue: lowest 10, highest 30.");
        expect(text).toContain("Cost: lowest 5, highest 8.");
        expect(text).toContain("Use the arrow keys");
    });

    it("becomes a region landmark on request", () => {
        const fixture = render(host => host.landmark.set(true));
        const host = chartHost(fixture);

        expect(host.getAttribute("role")).toBe("region");
        expect(host.hasAttribute("aria-roledescription")).toBe(false);
    });

    it("hides axis tick labels from screen readers", () => {
        const fixture = render();
        const labels = [...chartHost(fixture).querySelectorAll('[data-mona-chart-export-role="axis-label"]')];

        expect(labels.length).toBeGreaterThan(0);
        expect(labels.every(label => label.getAttribute("aria-hidden") === "true")).toBe(true);
    });

    it("passes axe with two unnamed charts on the page", async () => {
        const fixture = render(host => {
            host.title.set("");
            host.second.set(true);
        });
        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false } }
        });

        expect(results.violations.map(v => v.id)).toEqual([]);
    });
});

describe("Chart data table", () => {
    it("renders no table unless asked", () => {
        const fixture = render();
        expect(chartHost(fixture).querySelector("table")).toBeNull();
    });

    it("renders a visually hidden table of the data, browsable inside the application", () => {
        const fixture = render(host => host.dataTable.set(true));
        const table = chartHost(fixture).querySelector("table") as HTMLTableElement;
        const headers = [...table.querySelectorAll("thead th")].map(th => th.textContent?.trim());
        const rows = [...table.querySelectorAll("tbody tr")].map(tr =>
            [...tr.children].map(cell => cell.textContent?.trim())
        );

        expect(table.closest('[role="document"]')).not.toBeNull();
        expect(table.querySelector("caption")?.textContent?.trim()).toBe("Sales");
        expect(headers).toEqual(["Category", "Revenue", "Cost"]);
        expect(rows).toEqual([
            ["A", "10", "5"],
            ["B", "30", "8"],
            ["C", "20", "6"]
        ]);
    });

    it("caps the table at 100 rows and says how many there are", () => {
        const fixture = render(host => {
            host.dataTable.set(true);
            host.data.set(Array.from({ length: 150 }, (_, i) => ({ cost: i, revenue: i * 2, x: `P${i}` })));
        });
        const host = chartHost(fixture);

        expect(host.querySelectorAll("tbody tr").length).toBe(100);
        expect(host.querySelector("table + p")?.textContent?.trim()).toBe("Showing the first 100 of 150 rows.");
    });
});

describe("Chart keyboard", () => {
    it("announces the point's position, and reads it again at an edge", () => {
        const fixture = render();

        press(fixture, "ArrowRight");
        expect(liveText(fixture)).toBe("Revenue: A, 10, 1 of 3");

        const atEdge = press(fixture, "Home");
        expect(atEdge.defaultPrevented).toBe(true);
        expect(liveText(fixture)).toBe("Revenue: A, 10, 1 of 3");
        const raw = chartHost(fixture).querySelector('[aria-live="polite"]')?.textContent ?? "";
        // The text changed (a trailing no-break space), so screen readers read the region again.
        expect(raw.includes(" ")).toBe(true);
    });

    it("reads the focused point again when navigation finds nowhere to go", () => {
        const fixture = render();
        press(fixture, "ArrowRight");
        vi.spyOn(ChartKeyboardNavigation, "handleKeyDown").mockReturnValue(null);

        const event = press(fixture, "PageDown");

        expect(event.defaultPrevented).toBe(true);
        expect(chartHost(fixture).querySelector('[aria-live="polite"]')?.textContent).toContain(" ");
        expect(liveText(fixture)).toBe("Revenue: A, 10, 1 of 3");
    });

    it("leaves keys inside the legend to the legend", () => {
        const fixture = render();
        press(fixture, "ArrowRight");
        const legendButton = chartHost(fixture).querySelector("mona-chart-legend button") as HTMLButtonElement;

        const enter = press(fixture, "Enter", {}, legendButton);
        const space = press(fixture, " ", {}, legendButton);
        press(fixture, "ArrowRight", {}, legendButton);

        expect(enter.defaultPrevented).toBe(false);
        expect(space.defaultPrevented).toBe(false);
        expect(fixture.componentInstance.clicks.length).toBe(0);
        expect(liveText(fixture)).toBe("Revenue: A, 10, 1 of 3");
    });

    it("announces a legend toggle", () => {
        const fixture = render();
        (chartHost(fixture).querySelector("mona-chart-legend button") as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(liveText(fixture)).toBe("Revenue hidden");
    });

    it("activates the focused point with Enter and with Space when there is no selection", () => {
        const fixture = render();
        press(fixture, "ArrowRight");

        press(fixture, "Enter");
        press(fixture, " ");

        expect(fixture.componentInstance.clicks.map(c => c.seriesName)).toEqual(["Revenue", "Revenue"]);
    });

    it("toggles the selection with Space instead of activating, when the chart has a selection", () => {
        const fixture = render(host => host.selection.set(true));
        press(fixture, "ArrowRight");

        press(fixture, " ");

        expect(fixture.componentInstance.clicks.length).toBe(0);
        expect(fixture.componentInstance.selections.length).toBe(1);
        expect(liveText(fixture)).toContain("selected");
    });

    it("leaves Enter, Space and Escape alone when there is nothing to act on", () => {
        const fixture = render();

        expect(press(fixture, "Enter").defaultPrevented).toBe(false);
        expect(press(fixture, " ").defaultPrevented).toBe(false);
        expect(press(fixture, "Escape").defaultPrevented).toBe(false);

        press(fixture, "ArrowRight");
        expect(press(fixture, "Escape").defaultPrevented).toBe(true);
        expect(liveText(fixture)).toBe("");
    });

    it("pans vertically with Shift+ArrowUp after arrowing to a point", () => {
        const fixture = render(host => host.navigation.set({ clampToData: false, pan: true }));
        press(fixture, "ArrowRight");

        const event = press(fixture, "ArrowUp", { shiftKey: true });

        expect(event.defaultPrevented).toBe(true);
        expect(liveText(fixture)).toBe("Panned up");
    });
});

describe("Chart keyboard brush", () => {
    it("extends a brush with Shift+arrows and commits it with Enter", () => {
        const fixture = render(host => host.brush.set(true));
        const brushes = fixture.componentInstance.brushes;
        press(fixture, "ArrowRight");

        press(fixture, "ArrowRight", { shiftKey: true });
        expect(liveText(fixture)).toBe("Brush from A to B");
        press(fixture, "ArrowRight", { shiftKey: true });
        expect(liveText(fixture)).toBe("Brush from A to C");
        press(fixture, "Enter");

        expect(brushes.map(b => b.phase)).toEqual(["start", "update", "update", "end"]);
        const end = brushes.at(-1) as ChartBrushChangeEvent;
        expect(new Set(end.matchedPoints?.map(p => p.seriesName))).toEqual(new Set(["Revenue", "Cost"]));
        expect(end.matchedPoints?.length).toBe(6);
        expect(liveText(fixture)).toBe("Brush applied, 6 points");
        expect(fixture.componentInstance.clicks.length).toBe(0);
    });

    it("cancels a keyboard brush with Escape and keeps the focused point", () => {
        const fixture = render(host => host.brush.set(true));
        const brushes = fixture.componentInstance.brushes;
        press(fixture, "ArrowRight");
        press(fixture, "ArrowRight", { shiftKey: true });

        press(fixture, "Escape");

        expect(brushes.at(-1)?.phase).toBe("cancel");
        expect(brushes.at(-1)?.cancelReason).toBe("escape");
        expect(liveText(fixture)).toBe("Brush cleared");
        press(fixture, "Enter");
        expect(fixture.componentInstance.clicks.length).toBe(1);
    });
});

describe("Chart hover tooltip", () => {
    it("is dismissed by Escape anywhere on the page", async () => {
        const fixture = render();
        const chart = fixture.componentInstance.chart();
        const bounds = chart.scene()?.hitTargets.find(h => h.bounds)?.bounds;
        const point = bounds ? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 } : { x: 100, y: 100 };
        const canvas = chartHost(fixture).querySelector("canvas") as HTMLCanvasElement;

        canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: point.x, clientY: point.y }));
        await new Promise(resolve => requestAnimationFrame(resolve));
        fixture.detectChanges();
        expect(chart.tooltipContext()).not.toBeNull();

        document.body.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
        fixture.detectChanges();

        expect(chart.tooltipContext()).toBeNull();
    });
});
