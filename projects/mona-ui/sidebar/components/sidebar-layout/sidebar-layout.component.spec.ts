import { Component, signal, viewChild, ViewEncapsulation } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";

import { SidebarComponent } from "../sidebar/sidebar.component";
import { SidebarInsetDirective } from "../../directives/sidebar-inset.directive";
import { SidebarTriggerDirective } from "../../directives/sidebar-trigger.directive";
import { SidebarService } from "../../services/sidebar.service";
import {
    resolveSidebarLayoutBaseClass,
    resolveSidebarLayoutReverse,
    SidebarLayoutComponent
} from "./sidebar-layout.component";

@Component({
    template: `
        <mona-sidebar-layout>
            <mona-sidebar [(expanded)]="expanded" [side]="side()" [width]="width()">
                <div class="sidebar-body">Navigation</div>
            </mona-sidebar>
            <main monaSidebarInset class="inset">
                <button monaSidebarTrigger class="trigger">Toggle</button>
            </main>
        </mona-sidebar-layout>
    `,
    imports: [SidebarLayoutComponent, SidebarComponent, SidebarInsetDirective, SidebarTriggerDirective]
})
class SidebarLayoutHostComponent {
    public readonly expanded = signal(true);
    public readonly layout = viewChild.required(SidebarLayoutComponent);
    public readonly side = signal<"left" | "right">("left");
    public readonly width = signal<string | number>("16rem");
}

@Component({
    template: `
        <div class="shadow-container" style="direction: ltr;">
            <mona-sidebar-layout>
                <mona-sidebar [(expanded)]="expanded" side="left">
                    <div class="sidebar-body">Navigation</div>
                </mona-sidebar>
                <main monaSidebarInset class="inset">
                    <button monaSidebarTrigger class="trigger">Toggle</button>
                </main>
            </mona-sidebar-layout>
        </div>
    `,
    imports: [SidebarLayoutComponent, SidebarComponent, SidebarInsetDirective, SidebarTriggerDirective],
    encapsulation: ViewEncapsulation.ShadowDom
})
class ShadowLayoutHostComponent {
    public readonly expanded = signal(true);
    public readonly layout = viewChild.required(SidebarLayoutComponent);
}

describe("SidebarLayoutComponent", () => {
    let fixture: ComponentFixture<SidebarLayoutHostComponent>;
    let component: SidebarLayoutHostComponent;

    const getSidebar = (): HTMLElement => fixture.nativeElement.querySelector("mona-sidebar");

    // `calc()` is reordered and folded differently by each engine, so both sides go through the same
    // serialiser rather than being compared as literal text.
    const asCssWidth = (value: string): string => {
        const probe = document.createElement("div");
        probe.style.width = value;
        return probe.style.width;
    };

    const getTrigger = (): HTMLElement => fixture.nativeElement.querySelector(".trigger");

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SidebarLayoutHostComponent] });
        fixture = TestBed.createComponent(SidebarLayoutHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component.layout()).toBeTruthy();
    });

    it("should project the sidebar and the inset", () => {
        expect(fixture.nativeElement.querySelector(".sidebar-body").textContent).toContain("Navigation");
        expect(fixture.nativeElement.querySelector(".inset")).toBeTruthy();
    });

    it("should point the trigger at the sidebar through aria-controls", () => {
        const sidebarId = getSidebar().getAttribute("id");
        expect(sidebarId).toBeTruthy();
        expect(getTrigger().getAttribute("aria-controls")).toBe(sidebarId);
        expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    });

    it("should collapse the sidebar to zero width from the trigger", () => {
        expect(getSidebar().style.width).toBe(asCssWidth("calc(16rem + 1px)"));
        expect(getSidebar().getAttribute("data-state")).toBe("expanded");

        getTrigger().click();
        fixture.detectChanges();

        expect(getSidebar().style.width).toBe("0px");
        expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
        expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    });

    it("should push trigger driven changes back out through the two-way binding", () => {
        getTrigger().click();
        fixture.detectChanges();
        expect(component.expanded()).toBe(false);

        getTrigger().click();
        fixture.detectChanges();
        expect(component.expanded()).toBe(true);
    });

    it("should apply an expanded value bound from the outside", () => {
        component.expanded.set(false);
        fixture.detectChanges();

        expect(getSidebar().style.width).toBe("0px");
        expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
    });

    it("should treat a numeric width as pixels", () => {
        component.width.set(240);
        fixture.detectChanges();
        expect(getSidebar().style.width).toBe(asCssWidth("calc(240px + 1px)"));
    });

    it("should order and border the sidebar according to side", () => {
        expect(getSidebar().classList.contains("order-first")).toBe(true);
        expect(getSidebar().classList.contains("border-r")).toBe(true);

        component.side.set("right");
        fixture.detectChanges();

        expect(getSidebar().classList.contains("order-last")).toBe(true);
        expect(getSidebar().classList.contains("border-l")).toBe(true);
    });

    it("should apply flex-row-reverse when CSS direction is RTL to compensate for row reversal", async () => {
        const layoutEl = fixture.nativeElement.querySelector("mona-sidebar-layout") as HTMLElement;
        expect(layoutEl.classList.contains("flex-row")).toBe(true);
        expect(layoutEl.classList.contains("flex-row-reverse")).toBe(false);

        layoutEl.style.direction = "rtl";
        await new Promise(resolve => setTimeout(resolve, 50));
        fixture.detectChanges();

        expect(layoutEl.classList.contains("flex-row-reverse")).toBe(true);
    });

    it("should expose the sidebar's own service instance to its descendants", () => {
        const service = fixture.debugElement.query(node => node.name === "mona-sidebar").injector.get(SidebarService);
        service.collapse();
        fixture.detectChanges();

        expect(component.expanded()).toBe(false);
        expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
    });

    describe("resolveSidebarLayoutReverse and SSR compensation matrix", () => {
        it("should fall back to semantic LTR when browser CSS direction is unavailable (SSR)", () => {
            const reverse = resolveSidebarLayoutReverse({
                semanticDirection: "ltr",
                browserCssDirection: null
            });
            expect(reverse).toBe(false);

            const baseClass = resolveSidebarLayoutBaseClass({
                semanticDirection: "ltr",
                browserCssDirection: null
            });
            expect(baseClass).toContain("flex-row");
            expect(baseClass).not.toContain("flex-row-reverse");
        });

        it("should fall back to semantic RTL when browser CSS direction is unavailable (SSR)", () => {
            const reverse = resolveSidebarLayoutReverse({
                semanticDirection: "rtl",
                browserCssDirection: null
            });
            expect(reverse).toBe(true);

            const baseClass = resolveSidebarLayoutBaseClass({
                semanticDirection: "rtl",
                browserCssDirection: null
            });
            expect(baseClass).toContain("flex-row-reverse");
        });

        it("should use browser CSS LTR when semantic direction is LTR", () => {
            const reverse = resolveSidebarLayoutReverse({
                semanticDirection: "ltr",
                browserCssDirection: "ltr"
            });
            expect(reverse).toBe(false);

            const baseClass = resolveSidebarLayoutBaseClass({
                semanticDirection: "ltr",
                browserCssDirection: "ltr"
            });
            expect(baseClass).toContain("flex-row");
            expect(baseClass).not.toContain("flex-row-reverse");
        });

        it("should compensate with flex-row-reverse when browser CSS is RTL and semantic is LTR", () => {
            const reverse = resolveSidebarLayoutReverse({
                semanticDirection: "ltr",
                browserCssDirection: "rtl"
            });
            expect(reverse).toBe(true);

            const baseClass = resolveSidebarLayoutBaseClass({
                semanticDirection: "ltr",
                browserCssDirection: "rtl"
            });
            expect(baseClass).toContain("flex-row-reverse");
        });

        it("should compensate with flex-row-reverse when browser CSS is RTL and semantic is RTL", () => {
            const reverse = resolveSidebarLayoutReverse({
                semanticDirection: "rtl",
                browserCssDirection: "rtl"
            });
            expect(reverse).toBe(true);

            const baseClass = resolveSidebarLayoutBaseClass({
                semanticDirection: "rtl",
                browserCssDirection: "rtl"
            });
            expect(baseClass).toContain("flex-row-reverse");
        });

        it("should use flex-row when browser CSS is LTR and semantic is RTL", () => {
            const reverse = resolveSidebarLayoutReverse({
                semanticDirection: "rtl",
                browserCssDirection: "ltr"
            });
            expect(reverse).toBe(false);

            const baseClass = resolveSidebarLayoutBaseClass({
                semanticDirection: "rtl",
                browserCssDirection: "ltr"
            });
            expect(baseClass).toContain("flex-row");
            expect(baseClass).not.toContain("flex-row-reverse");
        });
    });

    describe("CSS direction observation and churn isolation", () => {
        it("should not wake sidebar layout compensation on unrelated document class churn", async () => {
            const distantNode = document.createElement("div");
            distantNode.className = "unrelated-distant-node";
            document.body.appendChild(distantNode);

            try {
                const initialRefreshCount = component.layout().compensationRefreshCount();

                // Mutate class on distant node
                distantNode.className = "unrelated-distant-node modified-class";
                distantNode.style.color = "red";
                await new Promise(resolve => setTimeout(resolve, 30));

                expect(component.layout().compensationRefreshCount()).toBe(initialRefreshCount);
            } finally {
                document.body.removeChild(distantNode);
            }
        });

        it("should update compensation when ancestor class/style direction changes", async () => {
            const layoutEl = fixture.nativeElement.querySelector("mona-sidebar-layout") as HTMLElement;
            const container = fixture.nativeElement as HTMLElement;

            container.style.direction = "rtl";
            await new Promise(resolve => setTimeout(resolve, 50));
            fixture.detectChanges();

            expect(layoutEl.classList.contains("flex-row-reverse")).toBe(true);

            container.style.direction = "ltr";
            await new Promise(resolve => setTimeout(resolve, 50));
            fixture.detectChanges();

            expect(layoutEl.classList.contains("flex-row-reverse")).toBe(false);
        });

        it("should re-evaluate compensation on window resize", async () => {
            const initialCount = component.layout().compensationRefreshCount();
            window.dispatchEvent(new Event("resize"));
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(component.layout().compensationRefreshCount()).toBeGreaterThan(initialCount);
        });

        it("should observe CSS direction change when ancestor is inside a ShadowRoot", async () => {
            const shadowFixture = TestBed.createComponent(ShadowLayoutHostComponent);
            document.body.appendChild(shadowFixture.nativeElement);
            shadowFixture.detectChanges();

            const layout = shadowFixture.componentInstance.layout();
            const shadowContainer = shadowFixture.nativeElement.shadowRoot?.querySelector(".shadow-container") as HTMLElement;

            try {
                expect(layout).toBeTruthy();
                expect(shadowContainer).toBeTruthy();

                const initialCount = layout.compensationRefreshCount();

                // Mutate style on shadowContainer (inside ShadowRoot)
                shadowContainer.style.direction = "rtl";
                await new Promise(resolve => setTimeout(resolve, 50));

                expect(layout.compensationRefreshCount()).toBeGreaterThan(initialCount);

                const afterContainerCount = layout.compensationRefreshCount();

                // Mutate style on outer shadow host element (traversed out of ShadowRoot)
                shadowFixture.nativeElement.style.direction = "rtl";
                await new Promise(resolve => setTimeout(resolve, 50));

                expect(layout.compensationRefreshCount()).toBeGreaterThan(afterContainerCount);
            } finally {
                shadowFixture.destroy();
                document.body.removeChild(shadowFixture.nativeElement);
            }
        });
    });
});
