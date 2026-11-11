import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { SidebarComponent } from "@nanahoshi/mona-ui/sidebar";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { SidebarOverviewDemoComponent } from "./sidebar-overview-demo.component";

describe("SidebarOverviewDemoComponent", () => {
    let fixture: ComponentFixture<SidebarOverviewDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SidebarOverviewDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarOverviewDemoComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;
    const code = (): string => (container() as unknown as { generatedCode: () => string }).generatedCode();

    it("renders a sidebar with a panel for the layout and the sidebar", () => {
        expect(fixture.debugElement.query(By.directive(SidebarComponent))).toBeTruthy();
        const panels = container()
            .parts()
            .filter(part => part.panel !== false);
        expect(panels.map(part => part.id)).toEqual(["layout", "sidebar"]);
        for (const part of panels) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("writes the header first, the content, the footer and rail last, and the inset after the sidebar", () => {
        const sample = code();
        expect(sample).toMatch(/^<mona-sidebar-layout class="h-112" modalScope="layout">/);
        expect(sample).toContain(`[collapsible]="'icon'"`);
        const order = [
            "monaSidebarHeader",
            "monaSidebarSeparator",
            "monaSidebarContent",
            "monaSidebarFooter",
            "monaSidebarRail",
            "monaSidebarInset"
        ].map(marker => sample.indexOf(marker));
        expect(order.every(index => index >= 0)).toBe(true);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
        expect(sample.trimEnd().endsWith("</mona-sidebar-layout>")).toBe(true);
    });

    it("applies a changed input to the sidebar and its code sample", async () => {
        container().values.update(values => ({ ...values, sidebar: { ...values["sidebar"], variant: "floating" } }));
        fixture.detectChanges();
        await fixture.whenStable();
        const sidebar: SidebarComponent = fixture.debugElement.query(By.directive(SidebarComponent)).componentInstance;
        expect(sidebar.variant()).toBe("floating");
        expect(code()).toContain(`[variant]="'floating'"`);
    });
});
