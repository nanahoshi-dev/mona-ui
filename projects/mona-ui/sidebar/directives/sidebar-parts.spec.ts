import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { SidebarLayoutComponent } from "../components/sidebar-layout/sidebar-layout.component";
import type { SidebarCollapsibleMode } from "../models/SidebarCollapsibleMode";
import type { SidebarSide } from "../models/SidebarSide";
import type { SidebarVariant } from "../models/SidebarVariant";
import { SidebarInputDirective } from "./sidebar-input.directive";
import { SidebarInsetDirective } from "./sidebar-inset.directive";
import { SidebarMenuBadgeDirective } from "./sidebar-menu-badge.directive";
import { SidebarMenuButtonDirective } from "./sidebar-menu-button.directive";
import { SidebarRailDirective } from "./sidebar-rail.directive";
import { SidebarSeparatorDirective } from "./sidebar-separator.directive";
import { SidebarTriggerDirective } from "./sidebar-trigger.directive";

@Component({
    template: `
        <mona-sidebar-layout>
            <mona-sidebar [collapsible]="collapsible()" [side]="side()" [variant]="variant()">
                <input monaSidebarInput class="search" placeholder="Search" />
                <div monaSidebarSeparator class="separator"></div>
                <button monaSidebarMenuButton tooltip="Introduction" class="menu-button">
                    <span>Introduction</span>
                    <span monaSidebarMenuBadge class="badge">12</span>
                </button>
                <button monaSidebarRail class="rail"></button>
            </mona-sidebar>
            <main monaSidebarInset class="inset">
                <button monaSidebarTrigger class="trigger">Toggle</button>
            </main>
        </mona-sidebar-layout>
    `,
    imports: [
        SidebarLayoutComponent,
        SidebarComponent,
        SidebarInsetDirective,
        SidebarTriggerDirective,
        SidebarInputDirective,
        SidebarSeparatorDirective,
        SidebarMenuButtonDirective,
        SidebarMenuBadgeDirective,
        SidebarRailDirective
    ]
})
class SidebarPartsHostComponent {
    public readonly collapsible = signal<SidebarCollapsibleMode>("icon");
    public readonly side = signal<SidebarSide>("left");
    public readonly variant = signal<SidebarVariant>("sidebar");
}

describe("Sidebar parts", () => {
    let fixture: ComponentFixture<SidebarPartsHostComponent>;
    let component: SidebarPartsHostComponent;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
    const collapse = (): void => {
        query(".trigger").click();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SidebarPartsHostComponent] });
        fixture = TestBed.createComponent(SidebarPartsHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe("rail", () => {
        it("should sit on the sidebar's inner edge and follow the side", () => {
            expect(query("mona-sidebar").classList.contains("relative")).toBe(true);
            expect(query(".rail").classList.contains("absolute")).toBe(true);
            expect(query(".rail").classList.contains("right-0")).toBe(true);

            component.side.set("right");
            fixture.detectChanges();

            expect(query(".rail").classList.contains("left-0")).toBe(true);
            expect(query(".rail").classList.contains("right-0")).toBe(false);
        });

        it("should toggle the sidebar and mirror its state", () => {
            const rail = query(".rail");
            expect(rail.getAttribute("aria-expanded")).toBe("true");
            expect(rail.getAttribute("aria-controls")).toBe(query("mona-sidebar").getAttribute("id"));

            rail.click();
            fixture.detectChanges();

            expect(query("mona-sidebar").getAttribute("data-state")).toBe("collapsed");
            expect(rail.getAttribute("aria-expanded")).toBe("false");
        });
    });

    describe("menu button tooltip", () => {
        it("should not set a title while the label is legible", () => {
            expect(query(".menu-button").hasAttribute("title")).toBe(false);
        });

        it("should identify the icon with a title on the rail", () => {
            collapse();
            expect(query(".menu-button").getAttribute("title")).toBe("Introduction");
        });

        it("should drop the title again once expanded", () => {
            collapse();
            collapse();
            expect(query(".menu-button").hasAttribute("title")).toBe(false);
        });

        it("should never set a title when no tooltip was supplied", () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({ imports: [SidebarPartsHostComponent] });
            const bare = TestBed.createComponent(SidebarPartsHostComponent);
            bare.detectChanges();
            const button: HTMLElement = bare.nativeElement.querySelector(".menu-button");
            expect(button.hasAttribute("title")).toBe(false);
        });
    });

    describe("badge, input and separator", () => {
        it("should show all of them at full width", () => {
            expect(query(".badge").style.display).toBe("");
            expect(query(".search").style.display).toBe("");
            expect(query(".separator").classList.contains("mx-2")).toBe(true);
        });

        it("should stand the badge and input down on the rail and tighten the separator", () => {
            collapse();

            expect(query(".badge").style.display).toBe("none");
            expect(query(".search").style.display).toBe("none");
            expect(query(".separator").classList.contains("mx-1")).toBe(true);
            expect(query(".separator").classList.contains("mx-2")).toBe(false);
        });

        it("should compose the shared text box styling onto the input", () => {
            // `TextBoxDirective` owns the class binding; the sidebar only contributes sizing.
            expect(query(".search").classList.contains("w-full")).toBe(true);
            expect(query(".search").className.length).toBeGreaterThan("w-full h-8".length);
        });
    });

    describe("variants", () => {
        it("should draw only an edge border in the default variant", () => {
            const sidebar = query("mona-sidebar");
            expect(sidebar.classList.contains("border-r")).toBe(true);
            expect(sidebar.classList.contains("rounded-lg")).toBe(false);
            expect(query(".inset").classList.contains("rounded-lg")).toBe(false);
        });

        it("should give the floating variant its own surface instead of an edge border", () => {
            component.variant.set("floating");
            fixture.detectChanges();

            const sidebar = query("mona-sidebar");
            expect(sidebar.classList.contains("rounded-lg")).toBe(true);
            expect(sidebar.classList.contains("shadow-sm")).toBe(true);
            expect(sidebar.classList.contains("border-r")).toBe(false);
        });

        it("should move the raised surface onto the inset for the inset variant", () => {
            component.variant.set("inset");
            fixture.detectChanges();

            expect(query("mona-sidebar").classList.contains("bg-transparent")).toBe(true);
            expect(query(".inset").classList.contains("rounded-lg")).toBe(true);
            expect(query(".inset").classList.contains("bg-surface")).toBe(true);
        });

        it("should drop the margin once an offcanvas sidebar is fully collapsed", () => {
            component.collapsible.set("offcanvas");
            component.variant.set("floating");
            fixture.detectChanges();
            expect(query("mona-sidebar").classList.contains("m-2")).toBe(true);

            collapse();

            expect(query("mona-sidebar").classList.contains("m-0")).toBe(true);
            expect(query("mona-sidebar").classList.contains("m-2")).toBe(false);
        });

        it("should keep the margin on an icon rail, which is still visible", () => {
            component.variant.set("floating");
            fixture.detectChanges();
            collapse();

            expect(query("mona-sidebar").classList.contains("m-2")).toBe(true);
        });
    });
});
