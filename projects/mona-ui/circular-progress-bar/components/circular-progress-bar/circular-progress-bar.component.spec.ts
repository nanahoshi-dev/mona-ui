import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CircularProgressBarComponent } from "./circular-progress-bar.component";

describe("CircularProgressBarComponent", () => {
    let component: CircularProgressBarComponent;
    let fixture: ComponentFixture<CircularProgressBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CircularProgressBarComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CircularProgressBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses a muted trail while retaining primary as the default progress color", () => {
        const host = fixture.nativeElement as HTMLElement;
        const progressCircle = host.querySelector("circle:not([data-stroke-trail])") as SVGCircleElement;

        expect(host.classList.contains("[&_svg_circle]:data-[stroke-trail='true']:stroke-surface-muted")).toBe(true);
        expect(progressCircle.getAttribute("stroke")).toBe("var(--mona-indicator-color, var(--color-primary))");
        expect(host.classList.contains("text-foreground")).toBe(true);
    });

    describe("lineCap", () => {
        const circumference = 2 * Math.PI * 47;

        function arc(): SVGCircleElement {
            return (fixture.nativeElement as HTMLElement).querySelector(
                "circle:not([data-stroke-trail])"
            ) as SVGCircleElement;
        }

        function dashArray(): number[] {
            return (arc().getAttribute("stroke-dasharray") ?? "").split(" ").map(Number);
        }

        it("draws round ends by default", () => {
            fixture.componentRef.setInput("value", 50);
            fixture.detectChanges();

            expect(arc().getAttribute("stroke-linecap")).toBe("round");
        });

        it("cuts flat ends straight across the full dash", () => {
            fixture.componentRef.setInput("lineCap", "flat");
            fixture.componentRef.setInput("value", 50);
            fixture.detectChanges();

            expect(arc().getAttribute("stroke-linecap")).toBe("butt");
            expect(dashArray()).toEqual([circumference]);
            expect(Number(arc().getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference / 2);
        });

        it("shortens the dash by the thickness so the round ends stay within the value", () => {
            fixture.componentRef.setInput("lineCap", "round");
            fixture.componentRef.setInput("value", 50);
            fixture.detectChanges();

            const [dash, gap] = dashArray();
            expect(arc().getAttribute("stroke-linecap")).toBe("round");
            expect(dash).toBeCloseTo(circumference / 2 - 6);
            expect(gap).toBeCloseTo(circumference);
            expect(Number(arc().getAttribute("stroke-dashoffset"))).toBe(-3);
        });

        it("draws no dot for an empty ring", () => {
            fixture.componentRef.setInput("lineCap", "round");
            fixture.componentRef.setInput("value", 0);
            fixture.detectChanges();

            expect(arc().getAttribute("stroke-linecap")).toBe("butt");
            expect(dashArray()[0]).toBe(0);
        });

        it("closes a full ring without a seam", () => {
            fixture.componentRef.setInput("lineCap", "round");
            fixture.componentRef.setInput("value", 100);
            fixture.detectChanges();

            expect(dashArray()[0]).toBeCloseTo(circumference);
            expect(Number(arc().getAttribute("stroke-dashoffset"))).toBe(0);
        });

        it("draws a dot no wider than the thickness for a sliver of progress", () => {
            fixture.componentRef.setInput("lineCap", "round");
            fixture.componentRef.setInput("value", 1);
            fixture.detectChanges();

            expect(dashArray()[0]).toBe(0);
            expect(Number(arc().getAttribute("stroke-dashoffset"))).toBeCloseTo(-circumference / 200);
        });
    });
});
