import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { CollapsibleContentDirective, CollapsibleDirective, CollapsibleTriggerDirective } from "@nanahoshi/mona-ui/collapsible";

import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { SidebarLayoutComponent } from "./components/sidebar-layout/sidebar-layout.component";
import { SidebarContentDirective } from "./directives/sidebar-content.directive";
import { SidebarInsetDirective } from "./directives/sidebar-inset.directive";
import { SidebarMenuButtonDirective } from "./directives/sidebar-menu-button.directive";
import { SidebarMenuItemDirective } from "./directives/sidebar-menu-item.directive";
import { SidebarMenuSubDirective } from "./directives/sidebar-menu-sub.directive";
import { SidebarMenuDirective } from "./directives/sidebar-menu.directive";
import { SidebarRailDirective } from "./directives/sidebar-rail.directive";
import { SidebarTriggerDirective } from "./directives/sidebar-trigger.directive";
import type { SidebarCollapsibleMode } from "./models/SidebarCollapsibleMode";
import { SidebarService } from "./services/sidebar.service";

@Component({
    template: `
        <mona-sidebar-layout>
            <mona-sidebar [collapsible]="collapsible()" id="app-sidebar">
                <nav monaSidebarContent aria-label="Main" class="nav">
                    <ul monaSidebarMenu>
                        <li monaSidebarMenuItem [active]="true">
                            <a monaSidebarMenuButton href="/introduction" class="link">Introduction</a>
                        </li>
                        <li monaSidebarMenuItem>
                            <a monaSidebarMenuButton href="/billing" [disabled]="true" class="disabled-link">
                                Billing
                            </a>
                        </li>
                        <li monaSidebarMenuItem monaCollapsible class="collapsible-item">
                            <button monaSidebarMenuButton monaCollapsibleTrigger [closeOnSelect]="false" class="disclosure">
                                Lists
                            </button>
                            <ul monaSidebarMenuSub monaCollapsibleContent class="sub-menu">
                                <li monaSidebarMenuItem>
                                    <a monaSidebarMenuButton href="/list-box" class="sub-link">List Box</a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </nav>
                <button monaSidebarRail aria-label="Toggle sidebar" class="rail"></button>
            </mona-sidebar>
            <main monaSidebarInset>
                <button monaSidebarTrigger class="trigger">Toggle</button>
                <span monaSidebarTrigger class="span-trigger">Toggle</span>
            </main>
        </mona-sidebar-layout>
    `,
    imports: [
        SidebarLayoutComponent,
        SidebarComponent,
        SidebarContentDirective,
        SidebarInsetDirective,
        SidebarTriggerDirective,
        SidebarRailDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarMenuButtonDirective,
        SidebarMenuSubDirective,
        CollapsibleDirective,
        CollapsibleTriggerDirective,
        CollapsibleContentDirective
    ]
})
class SidebarAccessibilityHostComponent {
    public readonly collapsible = signal<SidebarCollapsibleMode>("offcanvas");
}

describe("Sidebar accessibility", () => {
    let fixture: ComponentFixture<SidebarAccessibilityHostComponent>;
    let component: SidebarAccessibilityHostComponent;
    let service: SidebarService;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
    const collapse = (): void => {
        query(".trigger").click();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [SidebarAccessibilityHostComponent] });
        fixture = TestBed.createComponent(SidebarAccessibilityHostComponent);
        component = fixture.componentInstance;
        service = fixture.debugElement.query(node => node.name === "mona-sidebar").injector.get(SidebarService);
        fixture.detectChanges();
    });

    describe("collapsed off-canvas", () => {
        it("should be reachable while open", () => {
            expect(query("mona-sidebar").hasAttribute("inert")).toBe(false);
        });

        it("should not leave invisible controls in the tab order", () => {
            collapse();

            // Width alone hid the panel visually while leaving every control inside it focusable, so a
            // keyboard user tabbed into buttons they could not see.
            expect(query("mona-sidebar").hasAttribute("inert")).toBe(true);
            expect(query("mona-sidebar").getAttribute("aria-hidden")).toBe("true");
        });

        it("should not leave a border sliver where the panel used to be", () => {
            collapse();

            const classes = query("mona-sidebar").classList;
            expect(classes.contains("border-0")).toBe(true);
            expect(classes.contains("m-0")).toBe(true);
        });

        it("should stay reachable on an icon rail, which is still on screen", () => {
            component.collapsible.set("icon");
            fixture.detectChanges();
            collapse();

            expect(query("mona-sidebar").hasAttribute("inert")).toBe(false);
        });
    });

    describe("trigger contract", () => {
        it("should not submit a surrounding form", () => {
            expect(query(".trigger").getAttribute("type")).toBe("button");
            expect(query(".rail").getAttribute("type")).toBe("button");
        });

        it("should give a non-interactive host the rest of the button contract", () => {
            const span = query(".span-trigger");
            expect(span.getAttribute("role")).toBe("button");
            expect(span.getAttribute("tabindex")).toBe("0");
        });

        it("should leave a native button's own semantics alone", () => {
            expect(query(".trigger").hasAttribute("role")).toBe(false);
            expect(query(".trigger").hasAttribute("tabindex")).toBe(false);
        });

        it("should toggle a non-interactive host from the keyboard", () => {
            const span = query(".span-trigger");

            span.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
            fixture.detectChanges();
            expect(service.expanded()).toBe(false);

            span.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
            fixture.detectChanges();
            expect(service.expanded()).toBe(true);
        });

        it("should point at the sidebar it controls", () => {
            expect(query(".trigger").getAttribute("aria-controls")).toBe("app-sidebar");
            expect(query(".trigger").getAttribute("aria-expanded")).toBe("true");
        });
    });

    describe("navigation semantics", () => {
        it("should keep an anchor an anchor, so the browser's own navigation still works", () => {
            const link = query(".link");
            expect(link.tagName).toBe("A");
            expect(link.getAttribute("href")).toBe("/introduction");
            expect(link.hasAttribute("type")).toBe(false);
        });

        it("should mark the current destination", () => {
            expect(query(".link").getAttribute("aria-current")).toBe("page");
            expect(query(".sub-link").hasAttribute("aria-current")).toBe(false);
        });

        it("should announce a disabled link and suppress its navigation", () => {
            const link = query(".disabled-link");
            expect(link.getAttribute("aria-disabled")).toBe("true");
            // An anchor cannot carry the `disabled` attribute, so it keeps its tab stop and stays
            // announceable rather than silently vanishing from the tab order.
            expect(link.getAttribute("tabindex")).toBe("0");

            const event = new MouseEvent("click", { bubbles: true, cancelable: true });
            link.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        });

        it("should disable a button natively, where the attribute exists", () => {
            expect(query(".link").hasAttribute("disabled")).toBe(false);
        });
    });

    describe("submenu state on the icon rail", () => {
        const railWithOpenSubmenu = (): void => {
            query(".disclosure").click();
            fixture.detectChanges();
            expect(query(".disclosure").getAttribute("aria-expanded")).toBe("true");

            component.collapsible.set("icon");
            fixture.detectChanges();
            collapse();
        };

        it("should close the disclosure rather than hide an expanded one", () => {
            railWithOpenSubmenu();

            // The contradiction this replaces: the submenu was hidden with `display: none` while the
            // trigger went on reporting `aria-expanded="true"` for something nobody could see.
            expect(query(".disclosure").getAttribute("aria-expanded")).toBe("false");
            expect(query(".sub-menu").hasAttribute("inert")).toBe(true);
            expect(query(".sub-menu").style.display).toBe("");
        });

        it("should refuse to open a submenu that has nowhere to render", () => {
            component.collapsible.set("icon");
            fixture.detectChanges();
            collapse();

            query(".disclosure").click();
            fixture.detectChanges();

            expect(query(".disclosure").getAttribute("aria-expanded")).toBe("false");
        });

        it("should restore a submenu that was open before the rail", () => {
            railWithOpenSubmenu();

            query(".trigger").click();
            fixture.detectChanges();

            expect(query(".disclosure").getAttribute("aria-expanded")).toBe("true");
        });

        it("should not open a submenu that was closed before the rail", () => {
            component.collapsible.set("icon");
            fixture.detectChanges();
            collapse();
            query(".disclosure").click();
            fixture.detectChanges();

            query(".trigger").click();
            fixture.detectChanges();

            expect(query(".disclosure").getAttribute("aria-expanded")).toBe("false");
        });
    });

    describe("landmark and identity", () => {
        it("should let the consumer supply a stable id for hydration", () => {
            expect(query("mona-sidebar").getAttribute("id")).toBe("app-sidebar");
        });

        it("should carry no role of its own, leaving the landmark to a labelled nav inside it", () => {
            // The region routinely holds a team switcher and a profile menu as well as navigation, so
            // claiming `role="navigation"` for the whole thing would over-describe it.
            expect(query("mona-sidebar").hasAttribute("role")).toBe(false);
            expect(query(".nav").tagName).toBe("NAV");
            expect(query(".nav").getAttribute("aria-label")).toBe("Main");
        });
    });
});
