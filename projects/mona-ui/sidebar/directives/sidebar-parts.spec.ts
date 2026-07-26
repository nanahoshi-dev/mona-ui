import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { SidebarLayoutComponent } from "../components/sidebar-layout/sidebar-layout.component";
import type { SidebarCollapsibleMode } from "../models/SidebarCollapsibleMode";
import type { SidebarSide } from "../models/SidebarSide";
import type { SidebarVariant } from "../models/SidebarVariant";
import { sidebarBorderAllowance, sidebarThemeVariants } from "../styles/sidebar.styles";
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
                <button monaSidebarMenuButton size="large" class="profile-button">
                    <span>Avatar</span>
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

    // `calc()` is reordered and folded differently by each engine, so both sides go through the same
    // serialiser rather than being compared as literal text.
    const asCssWidth = (value: string): string => {
        const probe = document.createElement("div");
        probe.style.width = value;
        return probe.style.width;
    };

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

    describe("menu button on the icon rail", () => {
        it("should stay a full width row while expanded", () => {
            const button = query(".menu-button");
            // No width of its own: it stretches to the menu, which narrows with the sidebar, so the row
            // shrinks continuously instead of snapping to a rail sized box on the first frame.
            expect(button.style.width).toBe("");
            expect(button.classList.contains("w-full")).toBe(true);
            expect(button.style.padding).toBe("0.25rem");
            expect(button.style.gap).toBe("0.5rem");
        });

        it("should clip its own label in either state, so the label leaves with the width", () => {
            // Applied unconditionally. Switching it on at the moment of collapse would let the label
            // spill outside the shrinking button for the first frame.
            expect(query(".menu-button").style.overflow).toBe("hidden");
            collapse();
            expect(query(".menu-button").style.overflow).toBe("hidden");
        });

        it("should become a square that clips its own label", () => {
            collapse();

            const button = query(".menu-button");
            expect(button.style.height).toBe("2rem");
            expect(button.style.padding).toBe("0.5rem");
            expect(button.style.overflow).toBe("hidden");
        });

        it("should animate the properties that change with the rail state", () => {
            const transition = query(".menu-button").style.transition;
            for (const property of ["gap", "height", "padding"]) {
                expect(transition).toContain(`${property} var(--mona-motion-standard)`);
            }
            // Restated because the button's own class binding would otherwise be the only rule setting
            // `transition-property`, and declaring it inline drops the colour transition it provides.
            expect(transition).toContain("background-color");
        });

        it("should hold its size against siblings in the row", () => {
            collapse();
            // A trailing action or popup host would otherwise shrink the square below the icon size.
            expect(query(".menu-button").style.flexShrink).toBe("0");
        });

        it("should keep the leading icon anchored rather than centring overflowing content", () => {
            // Unconditional, so the icon does not jump sideways the instant the rail state flips.
            expect(query(".menu-button").style.justifyContent).toBe("flex-start");
            collapse();
            expect(query(".menu-button").style.justifyContent).toBe("flex-start");
        });

        it("should push everything after the icon clear of the square", () => {
            collapse();
            // A gap narrower than the square leaves a sliver of the label showing at the edge.
            expect(query(".menu-button").style.gap).toBe("2rem");
        });

        it("should stop its leading visual being crushed by a long label", () => {
            // `flex-shrink: 1` is what collapsed icons to zero width and squeezed avatars narrow.
            const button = query(".menu-button");
            expect(button.classList.contains("[&>svg]:shrink-0")).toBe(true);
            // Not every leading visual is an svg — an avatar has to hold its width too.
            expect(button.classList.contains("[&>*:first-child]:shrink-0")).toBe(true);
        });

        it("should inset a medium button so its icon sits centred in the square", () => {
            collapse();
            expect(query(".menu-button").style.padding).toBe("0.5rem");
        });

        it("should let a large button's visual fill the square edge to edge", () => {
            collapse();

            const profile = query(".profile-button");
            expect(profile.style.height).toBe("2rem");
            // An avatar is already the size of the square; insetting it would push it out of view.
            expect(profile.style.padding).toBe("0px");
        });

        it("should give a large button a taller row while expanded", () => {
            expect(query(".profile-button").style.height).toBe(asCssWidth("3rem"));
            expect(query(".menu-button").style.height).toBe("2rem");
        });

        it("should state both heights so the taller row animates down to the square", () => {
            collapse();
            // Left unset on the rail, the row would fall back to its class-driven height and jump.
            expect(query(".profile-button").style.height).toBe("2rem");
        });

        it("should stay interactive on the rail", () => {
            collapse();
            const button = query(".menu-button") as HTMLButtonElement;
            expect(button.tagName).toBe("BUTTON");
            expect(button.disabled).toBe(false);
            expect(button.style.display).not.toBe("none");
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

    describe("icon rail width against the variant's border", () => {
        // Borders are painted inside the box under the global `border-box`, so a rail width taken at
        // face value leaves the contents short by however much border the variant draws. It cost the
        // `floating` variant 2px, which clipped the edge off a footer avatar sized to the square.
        const railWidth = (): string => {
            component.collapsible.set("icon");
            fixture.detectChanges();
            collapse();
            return query("mona-sidebar").style.width;
        };

        it("should add back the two edges a floating sidebar draws", () => {
            component.variant.set("floating");
            fixture.detectChanges();

            expect(railWidth()).toBe(asCssWidth("calc(3rem + 2px)"));
        });

        it("should add back the single edge the default variant draws", () => {
            expect(railWidth()).toBe(asCssWidth("calc(3rem + 1px)"));
        });

        it("should leave a variant that draws no border as a plain length", () => {
            component.variant.set("inset");
            fixture.detectChanges();

            expect(railWidth()).toBe(asCssWidth("3rem"));
        });

        it("should keep the allowance in step with the borders the variants actually draw", () => {
            // Counts the borders on the inline axis straight off each variant's classes, so changing a
            // border without changing the allowance fails here rather than silently clipping an avatar.
            const inlineBorders = (variant: SidebarVariant): number => {
                const classes = sidebarThemeVariants({ variant, side: "left", flush: false }).split(/\s+/);
                return classes.includes("border") ? 2 : classes.filter(name => name === "border-r").length;
            };

            for (const variant of ["sidebar", "floating", "inset"] as const) {
                expect(`${inlineBorders(variant)}px`, variant).toBe(sidebarBorderAllowance[variant]);
            }
        });

        it("should keep the allowance a plain length so the collapse can still animate", () => {
            // A `var()` here resolves to a pending-substitution value, which engines are not obliged to
            // interpolate — it would cost the width transition the sidebar animates on.
            component.variant.set("floating");
            fixture.detectChanges();

            expect(railWidth()).not.toContain("var(");
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
            expect(sidebar.classList.contains("shadow-(--shadow-raised)")).toBe(true);
            expect(sidebar.classList.contains("border-r")).toBe(false);
        });

        it("should move the raised surface onto the inset for the inset variant", () => {
            component.variant.set("inset");
            fixture.detectChanges();

            expect(query("mona-sidebar").classList.contains("bg-transparent")).toBe(true);
            expect(query(".inset").classList.contains("rounded-lg")).toBe(true);
            expect(query(".inset").classList.contains("bg-(--color-surface)")).toBe(true);
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
