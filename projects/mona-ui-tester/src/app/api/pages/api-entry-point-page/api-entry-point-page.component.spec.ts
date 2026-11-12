import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import axe from "axe-core";
import { type Observable, of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import { PageService } from "../../../layout/services/page.service";
import type { ApiEntryPointReference } from "../../api-model";
import { ApiReferenceService } from "../../api-reference.service";
import { ApiEntryPointPageComponent } from "./api-entry-point-page.component";

const REFERENCE: ApiEntryPointReference = {
    links: {},
    name: "chart",
    pages: [{ path: "chart", title: "Chart Overview" }],
    symbols: [
        { description: "Renders a chart. With much more.", kind: "component", name: "ChartComponent" },
        { description: "", kind: "type", name: "ChartCurve" },
        { description: "A point.", kind: "interface", name: "ChartPoint" },
        { description: "An axis.", kind: "interface", name: "ChartAxis" }
    ]
};

describe("ApiEntryPointPageComponent", () => {
    let page: HTMLElement;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                PageService,
                provideRouter([{ component: ApiEntryPointPageComponent, path: "api/:entryPoint" }]),
                {
                    provide: ApiReferenceService,
                    useValue: { entryPoint: (): Observable<ApiEntryPointReference> => of(REFERENCE) }
                }
            ]
        });
        const harness = await RouterTestingHarness.create();
        await harness.navigateByUrl("/api/chart");
        harness.detectChanges();
        page = harness.routeNativeElement as HTMLElement;
    });

    it("names the import path and links its guide", () => {
        expect(page.querySelector("h1")?.textContent?.trim()).toBe("@nanahoshi/mona-ui/chart");
        expect(page.querySelector("a[href='/components/chart']")?.textContent?.trim()).toBe("Chart Overview");
    });

    it("groups the exports by kind, in order, each by name with its first sentence", () => {
        expect(Array.from(page.querySelectorAll("h2")).map(heading => heading.textContent?.trim())).toEqual([
            "Components",
            "Interfaces",
            "Type aliases"
        ]);
        const interfaces = Array.from(page.querySelectorAll("#interfaces + ul a")).map(link =>
            link.textContent?.trim()
        );
        expect(interfaces).toEqual(["ChartAxis", "ChartPoint"]);
        expect(page.querySelector("a[href='/api/chart/ChartComponent']")?.closest("li")?.textContent).toContain(
            "Renders a chart."
        );
        expect(page.textContent).not.toContain("With much more.");
    });

    it("passes axe", async () => {
        const results = await axe.run(page, { rules: { "color-contrast": { enabled: false } } });

        expect(results.violations).toEqual([]);
    });
});
