import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { SparklineComponent } from "../components/sparkline/sparkline.component";
import type { SparklineCurve } from "../models/SparklineCurve";
import type { SparklineMarker } from "../models/SparklineMarker";
import type { SparklineType } from "../models/SparklineType";

@Component({
    template: `
        <p>
            Sales
            <mona-sparkline
                [aria-label]="label()"
                [aria-describedby]="describedBy()"
                [class]="userClass()"
                [color]="color()"
                [curve]="curve()"
                [data]="data()"
                [decorative]="decorative()"
                [format]="format()"
                [markers]="markers()"
                [negativeColor]="negativeColor()"
                [referenceValue]="referenceValue()"
                [type]="type()"></mona-sparkline>
        </p>
        <span id="sales-note">Updated daily</span>
    `,
    imports: [SparklineComponent]
})
class SparklineHostComponent {
    public readonly color = signal("");
    public readonly curve = signal<SparklineCurve>("linear");
    public readonly data = signal<readonly (number | null)[]>([6, 4, null, 18, 15]);
    public readonly decorative = signal(false);
    public readonly describedBy = signal("");
    public readonly format = signal<Intl.NumberFormatOptions | null>(null);
    public readonly label = signal("Weekly sales");
    public readonly markers = signal<readonly SparklineMarker[]>([]);
    public readonly negativeColor = signal("");
    public readonly referenceValue = signal<number | null>(null);
    public readonly type = signal<SparklineType>("line");
    public readonly userClass = signal("");
}

describe("SparklineComponent", () => {
    let fixture: ComponentFixture<SparklineHostComponent>;

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
    });

    async function create(): Promise<SparklineHostComponent> {
        await TestBed.configureTestingModule({ imports: [SparklineHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(SparklineHostComponent);
        document.body.append(fixture.nativeElement as HTMLElement);
        await stable();
        return fixture.componentInstance;
    }

    async function stable(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function getHost(): HTMLElement {
        return (fixture.nativeElement as HTMLElement).querySelector("mona-sparkline") as HTMLElement;
    }

    function getDescription(): string | null {
        const ids = (getHost().getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
        return ids.map(id => document.getElementById(id)?.textContent?.trim() ?? "").join(" ") || null;
    }

    it("is an image named by its label and described by a summary of its values", async () => {
        await create();
        const host = getHost();
        expect(host.getAttribute("role")).toBe("img");
        expect(host.getAttribute("aria-label")).toBe("Weekly sales");
        expect(getDescription()).toBe("4 values, first 6, last 15, lowest 4, highest 18");
        // The description is in the page, but not shown.
        expect(document.getElementById(host.getAttribute("aria-describedby") ?? "")?.hidden).toBe(true);
    });

    it("takes the summary as its name without a label", async () => {
        const host = await create();
        host.label.set("");
        await stable();
        expect(getHost().getAttribute("aria-label")).toBe("4 values, first 6, last 15, lowest 4, highest 18");
        expect(getHost().hasAttribute("aria-describedby")).toBe(false);
    });

    it("adds the summary after the descriptions the application gives", async () => {
        const host = await create();
        host.describedBy.set("sales-note");
        await stable();
        expect(getDescription()).toBe("Updated daily 4 values, first 6, last 15, lowest 4, highest 18");
    });

    it("formats the values of the summary as asked, in the locale", async () => {
        const host = await create();
        host.data.set([1200.5, 980]);
        host.format.set({ currency: "EUR", style: "currency" });
        await stable();
        expect(getDescription()).toBe("2 values, first €1,200.50, last €980.00, lowest €980.00, highest €1,200.50");

        TestBed.inject(MonaI18nService).use({
            direction: "ltr",
            id: "de-DE",
            messages: {
                sparkline: {
                    noData: "Keine Daten",
                    summary: (count: number, first: string, last: string) => `${count} Werte, ${first} bis ${last}`,
                    winLossSummary: (wins: number) => `${wins} Siege`
                }
            }
        });
        await stable();
        // German puts a no-break space before the currency sign.
        expect(getDescription()?.replace(/\s/g, " ")).toBe("2 Werte, 1.200,50 € bis 980,00 €");
    });

    it("counts wins, losses and draws on a win-loss sparkline", async () => {
        const host = await create();
        host.type.set("win-loss");
        host.data.set([1, -2, 0, 3, null, 1]);
        await stable();
        expect(getDescription()).toBe("3 wins, 1 loss, 1 draw");
        expect(getHost().querySelectorAll("rect")).toHaveLength(5);
    });

    it("says it has no data when it has no values", async () => {
        const host = await create();
        host.data.set([null]);
        await stable();
        expect(getDescription()).toBe("No data");
        expect(getHost().querySelector("path")).toBeNull();
    });

    it("hides itself from assistive technology when decorative", async () => {
        const host = await create();
        host.decorative.set(true);
        await stable();
        const element = getHost();
        expect(element.getAttribute("aria-hidden")).toBe("true");
        expect(element.hasAttribute("role")).toBe(false);
        expect(element.hasAttribute("aria-label")).toBe(false);
        expect(element.hasAttribute("aria-describedby")).toBe(false);
        expect(element.querySelector("span[hidden]")).toBeNull();
    });

    it("draws a line, an area under it, columns or win-loss bars", async () => {
        const host = await create();
        const drawing = (): SVGSVGElement => getHost().querySelector("svg") as SVGSVGElement;
        expect(drawing().getAttribute("aria-hidden")).toBe("true");
        expect(drawing().getAttribute("preserveAspectRatio")).toBe("none");
        expect(drawing().querySelectorAll("path")).toHaveLength(1);
        expect(drawing().querySelector("path")?.getAttribute("vector-effect")).toBe("non-scaling-stroke");

        host.type.set("area");
        await stable();
        expect(drawing().querySelectorAll("path")).toHaveLength(2);
        expect(drawing().querySelector("path")?.getAttribute("class")).toContain("[fill-opacity:0.2]");

        host.type.set("column");
        host.data.set([3, -2, 5]);
        await stable();
        const bars = Array.from(drawing().querySelectorAll("rect"));
        expect(bars).toHaveLength(3);
        expect(bars[1].getAttribute("class")).toContain("fill-(--mona-sparkline-negative-color)");
        // Values on both sides of zero draw a baseline.
        expect(drawing().querySelectorAll("line")).toHaveLength(1);
    });

    it("joins the values of a line with the curve it's given", async () => {
        const host = await create();
        host.curve.set("step-after");
        await stable();
        expect(getHost().querySelector("path")?.getAttribute("d")).toBe(
            "M0,85.71L25,85.71L25,100M75,0L100,0L100,21.43"
        );
    });

    it("marks values with dots, padded to stay inside its box", async () => {
        const host = await create();
        host.markers.set(["min", "max", "last"]);
        await stable();
        const paths = getHost().querySelectorAll("path");
        expect(paths).toHaveLength(2);
        expect(paths[1].getAttribute("d")).toBe("M25 100h0M75 0h0M100 21.43h0");
        expect(getHost().classList).toContain("p-[3px]");

        host.type.set("column");
        await stable();
        expect(getHost().classList).not.toContain("p-[3px]");
    });

    it("draws a dashed reference line", async () => {
        const host = await create();
        host.referenceValue.set(10);
        await stable();
        const line = getHost().querySelector("line") as SVGLineElement;
        expect(line.getAttribute("class")).toContain("[stroke-dasharray:3_2]");
        expect(line.getAttribute("y1")).toBe("57.14");
    });

    it("takes its colors and size from its inputs and classes", async () => {
        const host = await create();
        expect(getHost().classList).toContain("w-24");
        host.color.set("rebeccapurple");
        host.negativeColor.set("#b91c1c");
        host.userClass.set("w-40 h-8");
        await stable();
        const element = getHost();
        expect(element.style.getPropertyValue("--mona-sparkline-color")).toBe("rebeccapurple");
        expect(element.style.getPropertyValue("--mona-sparkline-negative-color")).toBe("#b91c1c");
        expect(element.classList).toContain("w-40");
        expect(element.classList).not.toContain("w-24");
    });

    it("has no axe violations, named or not", async () => {
        const host = await create();
        let results = await axe.run(fixture.nativeElement as HTMLElement, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);

        host.label.set("");
        host.type.set("win-loss");
        await stable();
        results = await axe.run(fixture.nativeElement as HTMLElement, { rules: { region: { enabled: false } } });
        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });
});
