import { Component, Directive, ElementRef, inject, input, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter, Router, RouterLink } from "@angular/router";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { TooltipDirective } from "@nanahoshi/mona-ui/tooltip";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarComponent } from "../components/sidebar/sidebar.component";
import { SidebarLayoutComponent } from "../components/sidebar-layout/sidebar-layout.component";
import { SidebarGroupLabelDirective } from "../directives/sidebar-group-label.directive";
import { SidebarGroupDirective } from "../directives/sidebar-group.directive";
import { SidebarInputDirective } from "../directives/sidebar-input.directive";
import { SidebarInsetDirective } from "../directives/sidebar-inset.directive";
import { SidebarMenuActionDirective } from "../directives/sidebar-menu-action.directive";
import { SidebarMenuButtonDirective } from "../directives/sidebar-menu-button.directive";
import { SidebarMenuItemDirective } from "../directives/sidebar-menu-item.directive";
import { SidebarMenuSubDirective } from "../directives/sidebar-menu-sub.directive";
import { SidebarRailDirective } from "../directives/sidebar-rail.directive";
import { SidebarSeparatorDirective } from "../directives/sidebar-separator.directive";
import { SidebarTriggerDirective } from "../directives/sidebar-trigger.directive";
import type { SidebarCollapsibleMode } from "../models/SidebarCollapsibleMode";
import type { SidebarController } from "../models/SidebarController";
import type { SidebarModalScope } from "../models/SidebarModalScope";
import type { SidebarStorage } from "../models/SidebarStorage";
import { provideSidebarStorage } from "../providers/sidebar.providers";
import { SidebarLayoutService } from "../services/sidebar-layout.service";
import { LocalStorageSidebarStorage } from "../strategies/local-storage-sidebar.strategy";
import {
    sidebarMenuButtonThemeVariants,
    sidebarRailThemeVariants,
    sidebarThemeVariants
} from "../styles/sidebar.styles";
import { SIDEBAR_STORAGE } from "../tokens/sidebar.tokens";
import { injectSidebar } from "../utils/inject-sidebar";

const increment = (count: number): number => count + 1;

@Component({
    selector: "mona-test-reads-sidebar",
    template: `<span class="reads">{{ controller.sidebarId() }}</span>`
})
class ReadsSidebarComponent {
    public readonly controller = injectSidebar();
}

@Component({
    selector: "mona-test-reads-named-sidebar",
    template: `<span class="reads-named">{{ controller.sidebarId() }}</span>`
})
class ReadsNamedSidebarComponent {
    public readonly controller = injectSidebar({ for: "second" });
}

@Component({
    imports: [
        CollapsibleContentDirective,
        CollapsibleDirective,
        CollapsibleTriggerDirective,
        ReadsNamedSidebarComponent,
        ReadsSidebarComponent,
        RouterLink,
        SidebarComponent,
        SidebarGroupDirective,
        SidebarGroupLabelDirective,
        SidebarInputDirective,
        SidebarInsetDirective,
        SidebarLayoutComponent,
        SidebarMenuActionDirective,
        SidebarMenuButtonDirective,
        SidebarMenuItemDirective,
        SidebarMenuSubDirective,
        SidebarRailDirective,
        SidebarSeparatorDirective,
        SidebarTriggerDirective
    ],
    template: `
        <div class="outside-layout">
            <button class="outside-button" type="button">Outside</button>
        </div>
        <mona-sidebar-layout class="layout" [modalScope]="modalScope()">
            <mona-sidebar
                class="first"
                id="first"
                [aria-label]="label()"
                [aria-labelledby]="labelledBy()"
                [collapsible]="collapsible()"
                [expanded]="expanded()"
                [role]="role()"
                (expandedChange)="expanded.set($event)">
                <button monaSidebarRail class="rail"></button>
                <input monaSidebarInput class="search" aria-label="Search" />
                <div monaSidebarGroup class="group">
                    <span monaSidebarGroupLabel class="group-label">Pages</span>
                    <ul>
                        <li monaSidebarMenuItem [active]="true">
                            <button monaSidebarMenuButton class="current" type="button">Current</button>
                        </li>
                        <li monaSidebarMenuItem>
                            <a
                                monaSidebarMenuButton
                                class="link"
                                href="/somewhere"
                                [disabled]="linkDisabled()"
                                (click)="linkClicks.update(increment)">
                                Somewhere
                            </a>
                        </li>
                        <li monaSidebarMenuItem>
                            <a
                                monaSidebarMenuButton
                                class="router-link"
                                routerLink="/routed"
                                [disabled]="true"
                                tooltip="Routed">
                                Routed
                            </a>
                        </li>
                        <li monaSidebarMenuItem>
                            <button monaSidebarMenuButton class="inbox" tooltip="Inbox" type="button">Inbox</button>
                            <button monaSidebarMenuAction class="action" aria-label="More" type="button"></button>
                        </li>
                        <li monaSidebarMenuItem monaCollapsible class="parent-item">
                            <button
                                monaSidebarMenuButton
                                monaCollapsibleTrigger
                                class="parent"
                                [closeOnSelect]="parentCloses()"
                                type="button">
                                Parent
                            </button>
                            <ul monaSidebarMenuSub monaCollapsibleContent>
                                <li monaSidebarMenuItem>
                                    <a monaSidebarMenuButton class="child" href="/child">Child</a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <div monaSidebarSeparator class="separator"></div>
                <hr monaSidebarSeparator class="rule" />
                <button monaSidebarTrigger class="inner-trigger" type="button">Close</button>
            </mona-sidebar>
            <mona-sidebar class="second" id="second" collapsible="offcanvas" [expanded]="false">
                <button class="second-button" type="button">Second</button>
            </mona-sidebar>
            <aside class="extra-child">Extra</aside>
            <main monaSidebarInset class="inset">
                <button monaSidebarTrigger class="trigger" type="button">Toggle</button>
                <button monaSidebarTrigger for="second" class="second-trigger" type="button">Toggle second</button>
                <a monaSidebarTrigger class="bare-anchor">Bare</a>
                <a monaSidebarTrigger class="real-anchor" href="#toggle">Real</a>
                <mona-test-reads-sidebar />
                <mona-test-reads-named-sidebar />
            </main>
        </mona-sidebar-layout>
    `
})
class HostComponent {
    public readonly collapsible = signal<SidebarCollapsibleMode>("offcanvas");
    public readonly expanded = signal(true);
    public readonly increment = increment;
    public readonly label = signal("");
    public readonly labelledBy = signal("");
    public readonly linkClicks = signal(0);
    public readonly linkDisabled = signal(true);
    public readonly modalScope = signal<SidebarModalScope>("page");
    public readonly parentCloses = signal<boolean | undefined>(undefined);
    public readonly role = signal("");
}

@Component({
    imports: [SidebarComponent, SidebarInsetDirective, SidebarLayoutComponent, SidebarTriggerDirective],
    template: `
        <mona-sidebar-layout>
            @if (shown()) {
                <mona-sidebar id="only"><p>No controls here.</p></mona-sidebar>
            }
            <main monaSidebarInset>
                <button monaSidebarTrigger class="trigger" type="button">Toggle</button>
            </main>
        </mona-sidebar-layout>
    `
})
class PlainHostComponent {
    public readonly shown = signal(true);
}

@Component({
    imports: [SidebarComponent, SidebarInsetDirective, SidebarLayoutComponent, ReadsSidebarComponent],
    template: `
        <mona-sidebar-layout class="outer">
            <mona-sidebar id="late-first" [class.hidden]="false">
                @if (lateFirst()) {
                    <span class="unused"></span>
                }
            </mona-sidebar>
            <main monaSidebarInset><mona-test-reads-sidebar /></main>
        </mona-sidebar-layout>
    `
})
class ReadsFromInsetHostComponent {
    public readonly lateFirst = signal(false);
}

@Component({
    imports: [SidebarComponent, SidebarLayoutComponent],
    template: `
        <mona-sidebar-layout>
            @if (showEarly()) {
                <mona-sidebar [id]="earlyId()"></mona-sidebar>
            }
            <mona-sidebar id="later"></mona-sidebar>
        </mona-sidebar-layout>
    `
})
class AuthorOrderHostComponent {
    public readonly earlyId = input("early");
    public readonly showEarly = signal(false);
}

/** Listens the way a third party's directive would, ahead of anything Angular binds on the element. */
@Directive({ selector: "[monaTestEarlyClick]" })
class EarlyClickDirective {
    public readonly clicks = signal(0);

    public constructor() {
        (inject(ElementRef).nativeElement as HTMLElement).addEventListener("click", () =>
            this.clicks.update(increment)
        );
    }
}

@Component({
    imports: [
        EarlyClickDirective,
        ReadsNamedSidebarComponent,
        SidebarComponent,
        SidebarGroupDirective,
        SidebarGroupLabelDirective,
        SidebarLayoutComponent,
        SidebarMenuButtonDirective,
        SidebarRailDirective
    ],
    template: `
        <mona-sidebar-layout>
            <mona-sidebar class="first" id="first" aria-labelledby="name-of-first" role="navigation" side="end">
                <span id="name-of-first">Pages</span>
                <button monaSidebarRail class="named-rail" aria-label="Fold"></button>
                <mona-test-reads-named-sidebar />
                <div monaSidebarGroup class="authored-group">
                    <span monaSidebarGroupLabel id="authored-label">Authored</span>
                </div>
                <div monaSidebarGroup class="changing-group">
                    @if (labelled()) {
                        <span monaSidebarGroupLabel>Changing</span>
                    }
                </div>
                <a
                    monaSidebarMenuButton
                    monaTestEarlyClick
                    class="menu-role"
                    href="/x"
                    role="menuitem"
                    [disabled]="true"
                    >Row</a
                >
            </mona-sidebar>
            <mona-sidebar id="second"></mona-sidebar>
        </mona-sidebar-layout>
    `
})
class PartsHostComponent {
    public readonly labelled = signal(true);
}

@Component({
    selector: "mona-test-optional-reader",
    template: ``
})
class OptionalReaderComponent {
    public readonly controller = injectSidebar({ optional: true });
}

@Component({
    selector: "mona-test-required-reader",
    template: ``
})
class RequiredReaderComponent {
    public readonly controller = injectSidebar();
}

@Component({
    imports: [SidebarComponent, SidebarLayoutComponent, SidebarInsetDirective],
    template: `
        <mona-sidebar-layout class="outer-layout">
            <mona-sidebar id="outer-sidebar"></mona-sidebar>
            <main monaSidebarInset>
                <mona-sidebar-layout class="inner-layout">
                    <mona-sidebar id="inner-sidebar">
                        <input class="inner-field" aria-label="Field" (keydown.escape)="$event.preventDefault()" />
                        <button class="inner-button" type="button">Inner</button>
                    </mona-sidebar>
                </mona-sidebar-layout>
            </main>
        </mona-sidebar-layout>
    `
})
class NestedHostComponent {}

describe("Sidebar behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HTMLElement;

    const query = (selector: string): HTMLElement => host.querySelector(selector) as HTMLElement;
    const layoutService = (): SidebarLayoutService =>
        fixture.debugElement.query(node => node.name === "mona-sidebar-layout").injector.get(SidebarLayoutService);
    const render = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };
    const openDrawer = async (): Promise<void> => {
        layoutService().setCompact(true);
        await render();
        query(".trigger").focus();
        query(".trigger").click();
        await render();
    };
    const escapeFrom = (target: EventTarget): KeyboardEvent => {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });
        target.dispatchEvent(event);
        return event;
    };
    const controller = (): SidebarController => layoutService().getController("first") as SidebarController;

    beforeEach(async () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [provideRouter([{ path: "routed", children: [] }])]
        });
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.nativeElement;
        await render();
    });

    afterEach(() => {
        fixture.destroy();
        document.documentElement.classList.remove("cdk-global-scrollblock");
        vi.restoreAllMocks();
    });

    describe("a disabled row", () => {
        it("doesn't run a click handler on it", () => {
            query(".link").click();
            expect(fixture.componentInstance.linkClicks()).toBe(0);
        });

        it("doesn't navigate through routerLink", () => {
            const navigate = vi.spyOn(TestBed.inject(Router), "navigateByUrl");
            query(".router-link").click();
            expect(navigate).not.toHaveBeenCalled();
        });

        it("cancels the click, for an anchor that keeps a late href", () => {
            const event = new MouseEvent("click", { bubbles: true, cancelable: true });
            query(".link").dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        });

        it("doesn't reach a listener on the document", () => {
            const heard = vi.fn();
            document.addEventListener("click", heard);
            query(".link").click();
            document.removeEventListener("click", heard);
            expect(heard).not.toHaveBeenCalled();
        });

        it("gives up its href and is still announced as a link, in the tab order", () => {
            expect(query(".link").hasAttribute("href")).toBe(false);
            expect(query(".link").getAttribute("role")).toBe("link");
            expect(query(".link").getAttribute("tabindex")).toBe("0");
            expect(query(".link").getAttribute("aria-disabled")).toBe("true");
        });

        it("gives up routerLink's href too", () => {
            expect(query(".router-link").hasAttribute("href")).toBe(false);
        });

        it("gets all of it back when enabled", async () => {
            fixture.componentInstance.linkDisabled.set(false);
            await render();
            const link = query(".link");
            expect(link.getAttribute("href")).toBe("/somewhere");
            expect(link.hasAttribute("role")).toBe(false);
            link.addEventListener("click", event => event.preventDefault());
            link.click();
            expect(fixture.componentInstance.linkClicks()).toBe(1);
        });

        it("stops listening when destroyed", () => {
            const link = query(".link");
            const remove = vi.spyOn(link, "removeEventListener");
            fixture.destroy();
            expect(remove).toHaveBeenCalledWith("click", expect.any(Function), { capture: true });
        });
    });

    describe("a row in an open drawer", () => {
        beforeEach(async () => {
            fixture.componentInstance.linkDisabled.set(false);
            await render();
            await openDrawer();
        });

        it("keeps the drawer open when it opens a submenu", async () => {
            query(".parent").click();
            await render();
            expect(controller().mobileOpen()).toBe(true);
            expect(query(".parent").getAttribute("aria-expanded")).toBe("true");
        });

        it("still closes it when a submenu row asks to", async () => {
            fixture.componentInstance.parentCloses.set(true);
            await render();
            query(".parent").click();
            await render();
            expect(controller().mobileOpen()).toBe(false);
        });

        it("closes it when it's a link", async () => {
            query(".link").addEventListener("click", event => event.preventDefault());
            query(".link").click();
            await render();
            expect(controller().mobileOpen()).toBe(false);
        });
    });

    describe("Escape", () => {
        it("closes the drawer with focus on the body", async () => {
            await openDrawer();
            (document.activeElement as HTMLElement).blur();
            const event = escapeFrom(document.body);
            await render();
            expect(controller().mobileOpen()).toBe(false);
            expect(event.defaultPrevented).toBe(true);
        });

        it("closes it from inside the layout", async () => {
            await openDrawer();
            escapeFrom(query(".search"));
            await render();
            expect(controller().mobileOpen()).toBe(false);
        });

        it("leaves it open when a control already used the key", async () => {
            await openDrawer();
            const search = query(".search");
            search.addEventListener("keydown", event => event.preventDefault());
            escapeFrom(search);
            await render();
            expect(controller().mobileOpen()).toBe(true);
        });

        it("leaves it open when the key was for a popup opened from it", async () => {
            await openDrawer();
            const container = document.createElement("div");
            container.className = "cdk-overlay-container";
            const popup = document.createElement("button");
            container.appendChild(popup);
            document.body.appendChild(container);
            escapeFrom(popup);
            await render();
            expect(controller().mobileOpen()).toBe(true);
            container.remove();
        });

        it("ignores other keys", async () => {
            await openDrawer();
            document.body.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
            await render();
            expect(controller().mobileOpen()).toBe(true);
        });

        it("isn't listened for on the document once closed, or while docked", async () => {
            const event = escapeFrom(document.body);
            expect(event.defaultPrevented).toBe(false);
            await openDrawer();
            escapeFrom(document.body);
            await render();
            expect(escapeFrom(document.body).defaultPrevented).toBe(false);
        });
    });

    describe("listening for Escape outside the layout", () => {
        it("only happens while a drawer is open", async () => {
            const added = vi.spyOn(document, "addEventListener");
            const removed = vi.spyOn(document, "removeEventListener");
            const listening = (): number => {
                const keydowns = (spy: typeof added | typeof removed): number =>
                    spy.mock.calls.filter(([type]) => type === "keydown").length;
                return keydowns(added) - keydowns(removed);
            };
            await openDrawer();
            expect(listening()).toBe(1);
            controller().collapse();
            await render();
            expect(listening()).toBe(0);
        });
    });

    describe("naming", () => {
        it("gives a drawer a localized name of its own", async () => {
            await openDrawer();
            expect(query(".first").getAttribute("role")).toBe("dialog");
            expect(query(".first").getAttribute("aria-label")).toBe("Sidebar");
            TestBed.inject(MonaI18nService).use({
                direction: "ltr",
                id: "tr-TR",
                messages: { sidebar: { drawerLabel: "Kenar çubuğu", rail: "Aç" } }
            });
            await render();
            expect(query(".first").getAttribute("aria-label")).toBe("Kenar çubuğu");
        });

        it("prefers the consumer's name for a drawer", async () => {
            fixture.componentInstance.label.set("Main menu");
            await openDrawer();
            expect(query(".first").getAttribute("aria-label")).toBe("Main menu");
        });

        it("leaves a drawer named by aria-labelledby alone", async () => {
            fixture.componentInstance.labelledBy.set("a-heading");
            await openDrawer();
            expect(query(".first").getAttribute("aria-labelledby")).toBe("a-heading");
            expect(query(".first").hasAttribute("aria-label")).toBe(false);
        });

        it("doesn't put a label on a docked sidebar with no role", async () => {
            fixture.componentInstance.label.set("Main menu");
            await render();
            expect(query(".first").hasAttribute("aria-label")).toBe(false);
        });

        it("labels a docked sidebar that has a role", async () => {
            fixture.componentInstance.label.set("Main menu");
            fixture.componentInstance.role.set("navigation");
            await render();
            expect(query(".first").getAttribute("role")).toBe("navigation");
            expect(query(".first").getAttribute("aria-label")).toBe("Main menu");
        });

        it("doesn't give a docked region with a role the drawer's name", async () => {
            fixture.componentInstance.role.set("navigation");
            await render();
            expect(query(".first").hasAttribute("aria-label")).toBe(false);
        });

        it("warns about a role with no name", async () => {
            const warn = vi.mocked(console.warn);
            warn.mockClear();
            const local = TestBed.createComponent(HostComponent);
            local.componentInstance.role.set("navigation");
            local.detectChanges();
            await local.whenStable();
            expect(warn.mock.calls.some(call => String(call[0]).includes("needs a name"))).toBe(true);
            local.destroy();
        });

        it("doesn't warn about a named role, or no role", async () => {
            const warn = vi.mocked(console.warn);
            warn.mockClear();
            const named = TestBed.createComponent(HostComponent);
            named.componentInstance.role.set("navigation");
            named.componentInstance.label.set("Main");
            named.detectChanges();
            await named.whenStable();
            expect(warn.mock.calls.some(call => String(call[0]).includes("needs a name"))).toBe(false);
            named.destroy();
        });

        it("passes axe as an open drawer", async () => {
            await openDrawer();
            const results = await axe.run(query(".first"), { rules: { "color-contrast": { enabled: false } } });
            expect(results.violations).toEqual([]);
        });

        it("passes axe docked", async () => {
            const results = await axe.run(query(".first"), { rules: { "color-contrast": { enabled: false } } });
            expect(results.violations).toEqual([]);
        });

        it("passes axe on the rail", async () => {
            fixture.componentInstance.collapsible.set("icon");
            fixture.componentInstance.expanded.set(false);
            await render();
            const results = await axe.run(query(".first"), { rules: { "color-contrast": { enabled: false } } });
            expect(results.violations).toEqual([]);
        });
    });

    describe("a menu row's look", () => {
        it("has a solid outline at full opacity, not a translucent ring", () => {
            const classes = sidebarMenuButtonThemeVariants({ active: false });
            expect(classes).toContain("focus-visible:outline-2");
            expect(classes).toContain("focus-visible:outline-(--color-sidebar-ring)");
            expect(classes).not.toContain("outline-none");
            expect(classes).not.toContain("ring-");
            expect(classes).not.toContain("/60");
        });

        it("marks the current page with a bar and weight, and in forced colors", () => {
            const current = query(".current").className;
            expect(current).toContain("before:bg-current");
            expect(current).toContain("before:start-0");
            expect(current).toContain("before:w-0.5");
            expect(current).toContain("font-medium");
            expect(current).not.toContain("font-normal");
            expect(current).toContain("forced-colors:before:bg-[Highlight]");
            expect(query(".current").getAttribute("aria-current")).toBe("page");
        });

        it("doesn't mark any other row", () => {
            expect(query(".inbox").className).not.toContain("before:bg-current");
            expect(query(".inbox").className).toContain("font-normal");
        });

        it("keeps a disabled row distinct in forced colors", () => {
            expect(query(".link").className).toContain("forced-colors:text-[GrayText]");
        });

        it("doesn't let a drawer cover all of a narrow screen, so the backdrop can be tapped", () => {
            expect(sidebarThemeVariants({ drawer: true })).toContain("max-w-[calc(100%-3rem)]");
            expect(sidebarThemeVariants({ drawer: false })).not.toContain("max-w-");
        });
    });

    describe("focus when a drawer closes", () => {
        it("returns to the opener after a press on the backdrop leaves it on the body", async () => {
            await openDrawer();
            (document.activeElement as HTMLElement).blur();
            expect(document.activeElement).toBe(document.body);
            (query("[data-sidebar-backdrop]") as HTMLElement).click();
            await render();
            expect(document.activeElement).toBe(query(".trigger"));
        });

        it("returns to the opener from inside the panel", async () => {
            await openDrawer();
            query(".inbox").focus();
            controller().collapse();
            await render();
            expect(document.activeElement).toBe(query(".trigger"));
        });

        it("stays where the user has gone", async () => {
            await openDrawer();
            query(".outside-button").focus();
            controller().collapse();
            await render();
            expect(document.activeElement).toBe(query(".outside-button"));
        });

        it("goes back to the first opener when one drawer opens another", async () => {
            await openDrawer();
            query(".inbox").focus();
            layoutService().getController("second")?.expand();
            await render();
            expect(controller().mobileOpen()).toBe(false);
            query(".second-button").focus();
            layoutService().getController("second")?.collapse();
            await render();
            expect(document.activeElement).toBe(query(".trigger"));
        });

        it("takes the same first opener again next time", async () => {
            await openDrawer();
            controller().collapse();
            await render();
            query(".real-anchor").focus();
            controller().expand();
            await render();
            query(".inbox").focus();
            controller().collapse();
            await render();
            expect(document.activeElement).toBe(query(".real-anchor"));
        });

        it("doesn't move when a drawer that was never open goes away", async () => {
            layoutService().setCompact(true);
            await render();
            query(".outside-button").focus();
            layoutService().setCompact(false);
            await render();
            expect(document.activeElement).toBe(query(".outside-button"));
        });
    });

    describe("focus in a drawer with no controls", () => {
        let plain: ComponentFixture<PlainHostComponent>;

        const plainOpen = async (): Promise<void> => {
            plain = TestBed.createComponent(PlainHostComponent);
            plain.detectChanges();
            await plain.whenStable();
            const service = plain.debugElement
                .query(node => node.name === "mona-sidebar-layout")
                .injector.get(SidebarLayoutService);
            service.setCompact(true);
            plain.detectChanges();
            await plain.whenStable();
            (plain.nativeElement.querySelector(".trigger") as HTMLElement).focus();
            (plain.nativeElement.querySelector(".trigger") as HTMLElement).click();
            plain.detectChanges();
            await plain.whenStable();
            plain.detectChanges();
        };

        it("lands on the panel, which can take it only as a drawer", async () => {
            const docked = TestBed.createComponent(PlainHostComponent);
            docked.detectChanges();
            expect((docked.nativeElement.querySelector("mona-sidebar") as HTMLElement).hasAttribute("tabindex")).toBe(
                false
            );
            await plainOpen();
            const panel = plain.nativeElement.querySelector("mona-sidebar") as HTMLElement;
            expect(panel.getAttribute("tabindex")).toBe("-1");
            await vi.waitFor(() => expect(document.activeElement).toBe(panel));
            plain.destroy();
            docked.destroy();
        });

        it("stays off the panel when the drawer closes before focus has landed", async () => {
            plain = TestBed.createComponent(PlainHostComponent);
            plain.detectChanges();
            await plain.whenStable();
            const service = plain.debugElement
                .query(node => node.name === "mona-sidebar-layout")
                .injector.get(SidebarLayoutService);
            service.setCompact(true);
            plain.detectChanges();
            await plain.whenStable();
            const trigger = plain.nativeElement.querySelector(".trigger") as HTMLElement;
            trigger.focus();
            trigger.click();
            plain.detectChanges();
            service.closeAll();
            plain.detectChanges();
            await plain.whenStable();
            await new Promise(resolve => setTimeout(resolve, 20));
            expect(document.activeElement).not.toBe(plain.nativeElement.querySelector("mona-sidebar"));
            plain.destroy();
        });

        it("returns to the opener when the open drawer is destroyed", async () => {
            await plainOpen();
            const trigger = plain.nativeElement.querySelector(".trigger") as HTMLElement;
            await vi.waitFor(() => expect(document.activeElement).not.toBe(trigger));
            plain.componentInstance.shown.set(false);
            plain.detectChanges();
            await plain.whenStable();
            plain.detectChanges();
            await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
            plain.destroy();
        });

        it("releases the page when the open drawer is destroyed", async () => {
            const sibling = document.createElement("div");
            document.body.appendChild(sibling);
            await plainOpen();
            expect(sibling.hasAttribute("inert")).toBe(true);
            plain.componentInstance.shown.set(false);
            plain.detectChanges();
            await plain.whenStable();
            expect(sibling.hasAttribute("inert")).toBe(false);
            sibling.remove();
            plain.destroy();
        });
    });

    describe("the rail's tooltip", () => {
        it("opens toward the content, from whichever side", () => {
            const position = fixture.debugElement
                .query(By.directive(TooltipDirective))
                .injector.get(TooltipDirective)
                .position();
            expect(position).toBe("end");
        });

        const goRail = async (): Promise<void> => {
            fixture.componentInstance.collapsible.set("icon");
            fixture.componentInstance.expanded.set(false);
            await render();
        };
        const tooltip = (): Element | null => document.querySelector("[role='tooltip']");

        it("is on a row only on the rail, and never as a title", async () => {
            expect(query(".inbox").hasAttribute("data-sidebar-tooltip")).toBe(false);
            await goRail();
            expect(query(".inbox").getAttribute("data-sidebar-tooltip")).toBe("Inbox");
            expect(query(".inbox").hasAttribute("title")).toBe(false);
            expect(query(".current").hasAttribute("data-sidebar-tooltip")).toBe(false);
        });

        it("shows on keyboard focus on the rail", async () => {
            await goRail();
            query(".inbox").focus();
            query(".inbox").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
            await vi.waitFor(() => expect(tooltip()?.textContent).toContain("Inbox"));
        });

        it("doesn't show at full width", async () => {
            query(".inbox").focus();
            query(".inbox").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 50));
            await render();
            expect(tooltip()).toBeNull();
        });

        it("closes when the rail expands", async () => {
            await goRail();
            query(".inbox").focus();
            query(".inbox").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
            await vi.waitFor(() => expect(tooltip()).not.toBeNull());
            fixture.componentInstance.expanded.set(true);
            await render();
            await vi.waitFor(() => expect(tooltip()).toBeNull());
        });
    });

    describe("a submenu parent on the rail", () => {
        const goRail = async (): Promise<void> => {
            fixture.componentInstance.collapsible.set("icon");
            fixture.componentInstance.expanded.set(false);
            await render();
        };

        it("expands the sidebar and opens the submenu", async () => {
            await goRail();
            query(".parent").click();
            await render();
            expect(controller().expanded()).toBe(true);
            expect(controller().iconOnly()).toBe(false);
            expect(query(".parent").getAttribute("aria-expanded")).toBe("true");
            expect(fixture.componentInstance.expanded()).toBe(true);
        });

        it("doesn't expand it from a row with no submenu", async () => {
            await goRail();
            query(".inbox").click();
            await render();
            expect(controller().iconOnly()).toBe(true);
        });

        it("toggles only the submenu at full width", async () => {
            query(".parent").click();
            await render();
            expect(query(".parent").getAttribute("aria-expanded")).toBe("true");
            query(".parent").click();
            await render();
            expect(query(".parent").getAttribute("aria-expanded")).toBe("false");
            expect(controller().expanded()).toBe(true);
        });
    });

    describe("focus when a docked sidebar collapses", () => {
        it("moves from a panel going off-canvas to a trigger for it", async () => {
            fixture.autoDetectChanges();
            query(".inner-trigger").focus();
            query(".inner-trigger").click();
            await fixture.whenStable();
            expect(query(".first").hasAttribute("inert")).toBe(true);
            expect(document.activeElement).toBe(query(".trigger"));
        });

        it("moves from an input the rail hides", async () => {
            fixture.componentInstance.collapsible.set("icon");
            await render();
            query(".search").focus();
            controller().collapse();
            await render();
            expect(query(".search").getAttribute("data-hidden")).toBe("true");
            expect(document.activeElement).toBe(query(".inner-trigger"));
        });

        it("moves from a row's action the rail hides", async () => {
            fixture.componentInstance.collapsible.set("icon");
            await render();
            query(".action").focus();
            controller().collapse();
            await render();
            expect(document.activeElement).toBe(query(".inner-trigger"));
        });

        it("stays on what the rail keeps", async () => {
            fixture.componentInstance.collapsible.set("icon");
            await render();
            query(".inbox").focus();
            controller().collapse();
            await render();
            expect(document.activeElement).toBe(query(".inbox"));
        });

        it("stays where it is when it wasn't in the panel", async () => {
            query(".outside-button").focus();
            controller().collapse();
            await render();
            expect(document.activeElement).toBe(query(".outside-button"));
        });

        it("doesn't move to a trigger for another sidebar", async () => {
            query(".second-trigger").remove();
            const triggers = [".trigger", ".bare-anchor", ".real-anchor", ".inner-trigger"];
            triggers.forEach(selector => query(selector).remove());
            query(".search").focus();
            controller().collapse();
            await render();
            expect(document.activeElement).not.toBe(query(".second-button"));
        });

        it("moves to the rail when there's no trigger left to take it", async () => {
            fixture.componentInstance.collapsible.set("icon");
            await render();
            [".trigger", ".bare-anchor", ".real-anchor"].forEach(selector => query(selector).remove());
            query(".inner-trigger").remove();
            query(".search").focus();
            controller().collapse();
            await render();
            expect(document.activeElement).toBe(query(".rail"));
        });

        it("doesn't use a rail while a trigger is there", async () => {
            fixture.componentInstance.collapsible.set("icon");
            await render();
            query(".search").focus();
            controller().collapse();
            await render();
            expect(document.activeElement).not.toBe(query(".rail"));
        });
    });

    describe("how far the drawer's modality reaches", () => {
        // CDK only blocks a page that can scroll, which nothing can with no layout.
        beforeEach(() => {
            vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(100000);
        });

        it("makes the whole page inert by default and locks its scroll", async () => {
            await openDrawer();
            expect(query(".first").getAttribute("aria-modal")).toBe("true");
            expect(query(".outside-layout").hasAttribute("inert")).toBe(true);
            expect(query(".extra-child").hasAttribute("inert")).toBe(true);
            expect(query(".inset").hasAttribute("inert")).toBe(true);
            expect(document.documentElement.classList.contains("cdk-global-scrollblock")).toBe(true);
        });

        it("keeps what the drawer needs usable", async () => {
            const container = document.createElement("div");
            container.className = "cdk-overlay-container";
            document.body.appendChild(container);
            await openDrawer();
            expect(query("[data-sidebar-backdrop]").hasAttribute("inert")).toBe(false);
            expect(query(".first").hasAttribute("inert")).toBe(false);
            expect(container.hasAttribute("inert")).toBe(false);
            const anchors = host.querySelectorAll(".cdk-focus-trap-anchor");
            expect(anchors.length).toBeGreaterThan(0);
            anchors.forEach(anchor => expect(anchor.hasAttribute("inert")).toBe(false));
            container.remove();
        });

        it("gives it all back on close", async () => {
            await openDrawer();
            controller().collapse();
            await render();
            expect(query(".outside-layout").hasAttribute("inert")).toBe(false);
            expect(query(".extra-child").hasAttribute("inert")).toBe(false);
            expect(query(".inset").hasAttribute("inert")).toBe(false);
            expect(document.documentElement.classList.contains("cdk-global-scrollblock")).toBe(false);
        });

        it("leaves the closed drawer inert after another one was open", async () => {
            await openDrawer();
            layoutService().getController("second")?.expand();
            await render();
            layoutService().getController("second")?.collapse();
            await render();
            expect(query(".first").hasAttribute("inert")).toBe(true);
            expect(query(".second").hasAttribute("inert")).toBe(true);
        });

        it("stays in the layout when scoped to it, and doesn't claim to be modal", async () => {
            fixture.componentInstance.modalScope.set("layout");
            await openDrawer();
            expect(query(".first").hasAttribute("aria-modal")).toBe(false);
            expect(query(".first").getAttribute("role")).toBe("dialog");
            expect(query(".outside-layout").hasAttribute("inert")).toBe(false);
            expect(query(".extra-child").hasAttribute("inert")).toBe(true);
            expect(query(".inset").hasAttribute("inert")).toBe(true);
            expect(document.documentElement.classList.contains("cdk-global-scrollblock")).toBe(false);
        });

        it("follows a scope that changes while open", async () => {
            await openDrawer();
            fixture.componentInstance.modalScope.set("layout");
            await render();
            expect(query(".outside-layout").hasAttribute("inert")).toBe(false);
            expect(document.documentElement.classList.contains("cdk-global-scrollblock")).toBe(false);
        });

        it("does nothing while docked", async () => {
            expect(query(".outside-layout").hasAttribute("inert")).toBe(false);
            expect(query(".first").hasAttribute("aria-modal")).toBe(false);
            expect(document.documentElement.classList.contains("cdk-global-scrollblock")).toBe(false);
        });
    });

    describe("a trigger", () => {
        it("makes an anchor with no href a keyboard-operable button", async () => {
            const anchor = query(".bare-anchor");
            expect(anchor.getAttribute("role")).toBe("button");
            expect(anchor.getAttribute("tabindex")).toBe("0");
            anchor.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
            await render();
            expect(controller().expanded()).toBe(false);
        });

        it("leaves a real link alone", () => {
            const anchor = query(".real-anchor");
            expect(anchor.hasAttribute("role")).toBe(false);
            expect(anchor.hasAttribute("tabindex")).toBe(false);
            const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" });
            anchor.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
            expect(controller().expanded()).toBe(true);
        });

        it("reports itself as disabled, not open, on a sidebar that can't collapse", async () => {
            fixture.componentInstance.collapsible.set("none");
            await render();
            expect(query(".trigger").hasAttribute("aria-expanded")).toBe(false);
            expect(query(".trigger").getAttribute("aria-disabled")).toBe("true");
        });

        it("is a real disclosure for that sidebar's drawer", async () => {
            fixture.componentInstance.collapsible.set("none");
            await openDrawer();
            expect(query(".trigger").getAttribute("aria-expanded")).toBe("true");
            expect(query(".trigger").hasAttribute("aria-disabled")).toBe(false);
        });

        it("isn't disabled on a sidebar that can collapse", () => {
            expect(query(".trigger").hasAttribute("aria-disabled")).toBe(false);
            expect(query(".trigger").getAttribute("aria-expanded")).toBe("true");
        });

        it("warns when for names nothing in the layout", async () => {
            @Component({
                imports: [SidebarLayoutComponent, SidebarTriggerDirective],
                template: `
                    <mona-sidebar-layout>
                        <button monaSidebarTrigger for="nowhere" type="button">Toggle</button>
                    </mona-sidebar-layout>
                `
            })
            class StrayTriggerComponent {}
            const warn = vi.mocked(console.warn);
            warn.mockClear();
            const stray = TestBed.createComponent(StrayTriggerComponent);
            stray.detectChanges();
            await stray.whenStable();
            expect(warn.mock.calls.some(call => String(call[0]).includes('"nowhere"'))).toBe(true);
            stray.destroy();
        });

        it("doesn't warn when for finds its sidebar", async () => {
            const warn = vi.mocked(console.warn);
            expect(warn.mock.calls.some(call => String(call[0]).includes("monaSidebarTrigger"))).toBe(false);
        });
    });

    describe("the rail", () => {
        it("has a localized name by default", () => {
            expect(query(".rail").getAttribute("aria-label")).toBe("Toggle sidebar");
        });

        it("stays out of a drawer at any width, and motion-reduce applies", () => {
            const docked = sidebarRailThemeVariants({ compact: false });
            const compact = sidebarRailThemeVariants({ compact: true });
            expect(docked).toContain("sm:flex");
            expect(compact).not.toContain("flex");
            expect(compact).toContain("hidden");
            expect(docked).toContain("motion-reduce:transition-none");
        });

        it("goes by the sidebar's state", async () => {
            expect(query(".rail").className).toContain("sm:flex");
            layoutService().setCompact(true);
            await render();
            expect(query(".rail").className).not.toContain("sm:flex");
        });
    });

    describe("semantics", () => {
        it("ties a group to its label", () => {
            const group = query(".group");
            const label = query(".group-label");
            expect(group.getAttribute("role")).toBe("group");
            expect(label.id).not.toBe("");
            expect(group.getAttribute("aria-labelledby")).toBe(label.id);
        });

        it("gives a separator its role, and leaves an hr alone", () => {
            expect(query(".separator").getAttribute("role")).toBe("separator");
            expect(query(".rule").hasAttribute("role")).toBe(false);
        });
    });

    describe("injectSidebar", () => {
        it("reads the layout's first sidebar from the inset", async () => {
            await render();
            expect(query(".reads").textContent).toBe("first");
        });

        it("reads a named sidebar from the inset", async () => {
            await render();
            expect(query(".reads-named").textContent).toBe("second");
        });

        it("drives it from there", async () => {
            const reader = fixture.debugElement.query(node => node.name === "mona-test-reads-sidebar")
                .componentInstance as ReadsSidebarComponent;
            expect(reader.controller.expanded()).toBe(true);
            reader.controller.collapse();
            await render();
            expect(controller().expanded()).toBe(false);
            expect(reader.controller.state()).toBe("collapsed");
            reader.controller.expand();
            await render();
            expect(controller().expanded()).toBe(true);
            reader.controller.toggle();
            await render();
            expect(controller().expanded()).toBe(false);
        });

        it("reports what the sidebar is", async () => {
            const reader = fixture.debugElement.query(node => node.name === "mona-test-reads-sidebar")
                .componentInstance as ReadsSidebarComponent;
            fixture.componentInstance.collapsible.set("icon");
            await render();
            expect(reader.controller.collapsible()).toBe("icon");
            expect(reader.controller.side()).toBe("start");
            expect(reader.controller.variant()).toBe("sidebar");
            expect(reader.controller.compact()).toBe(false);
            expect(reader.controller.mobileOpen()).toBe(false);
            expect(reader.controller.iconOnly()).toBe(false);
        });

        it("reads as closed, and does nothing, with no sidebar yet", () => {
            const following = TestBed.runInInjectionContext(() => new SidebarLayoutService()).controllerFor();
            expect(following.expanded()).toBe(false);
            expect(following.state()).toBe("collapsed");
            expect(following.sidebarId()).toBe("");
            expect(following.collapsible()).toBe("offcanvas");
            expect(() => following.toggle()).not.toThrow();
        });

        it("still throws outside any layout, unless optional", () => {
            expect(TestBed.createComponent(OptionalReaderComponent).componentInstance.controller).toBeNull();
            expect(() => TestBed.createComponent(RequiredReaderComponent)).toThrow(/No provider/);
        });

        it("reads the nearest sidebar inside one", async () => {
            const nested = TestBed.createComponent(ReadsFromInsetHostComponent);
            nested.detectChanges();
            await nested.whenStable();
            nested.detectChanges();
            expect((nested.nativeElement.querySelector(".reads") as HTMLElement).textContent).toBe("late-first");
            nested.destroy();
        });
    });

    describe("the primary sidebar", () => {
        it("is the first in the document, even if it rendered later", async () => {
            const order = TestBed.createComponent(AuthorOrderHostComponent);
            order.detectChanges();
            await order.whenStable();
            const service = order.debugElement
                .query(node => node.name === "mona-sidebar-layout")
                .injector.get(SidebarLayoutService);
            expect(service.primaryController()?.sidebarId()).toBe("later");
            order.componentInstance.showEarly.set(true);
            order.detectChanges();
            await order.whenStable();
            order.detectChanges();
            expect(service.primaryController()?.sidebarId()).toBe("early");
            order.destroy();
        });

        it("stays first after its id changes", async () => {
            const order = TestBed.createComponent(AuthorOrderHostComponent);
            order.componentInstance.showEarly.set(true);
            order.detectChanges();
            await order.whenStable();
            const service = order.debugElement
                .query(node => node.name === "mona-sidebar-layout")
                .injector.get(SidebarLayoutService);
            order.componentRef.setInput("earlyId", "renamed");
            order.detectChanges();
            await order.whenStable();
            order.detectChanges();
            expect(service.primaryController()?.sidebarId()).toBe("renamed");
            order.destroy();
        });
    });

    describe("nested layouts", () => {
        it("closes only the inner drawer on an Escape from inside it", async () => {
            const nested = TestBed.createComponent(NestedHostComponent);
            nested.detectChanges();
            await nested.whenStable();
            const layouts = nested.debugElement.queryAll(node => node.name === "mona-sidebar-layout");
            const outer = layouts[0].injector.get(SidebarLayoutService);
            const inner = layouts[1].injector.get(SidebarLayoutService);
            outer.setCompact(true);
            inner.setCompact(true);
            nested.detectChanges();
            await nested.whenStable();
            outer.getController("outer-sidebar")?.expand();
            inner.getController("inner-sidebar")?.expand();
            nested.detectChanges();
            await nested.whenStable();
            escapeFrom(nested.nativeElement.querySelector(".inner-button"));
            nested.detectChanges();
            expect(inner.anyMobileOpen()).toBe(false);
            expect(outer.anyMobileOpen()).toBe(true);
            nested.destroy();
        });
    });
});

describe("Sidebar parts", () => {
    let fixture: ComponentFixture<PartsHostComponent>;
    let warn: ReturnType<typeof vi.spyOn>;

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector) as HTMLElement;
    const render = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };

    beforeEach(async () => {
        warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        fixture = TestBed.createComponent(PartsHostComponent);
        await render();
    });

    afterEach(() => {
        fixture.destroy();
        vi.restoreAllMocks();
    });

    it("takes aria-labelledby as a name, without a warning", () => {
        expect(query(".first").getAttribute("aria-labelledby")).toBe("name-of-first");
        expect(warn).not.toHaveBeenCalled();
    });

    it("opens the rail's tooltip toward the content on the end side", () => {
        const tooltip = fixture.debugElement.query(By.directive(TooltipDirective)).injector.get(TooltipDirective);
        expect(tooltip.position()).toBe("start");
    });

    it("lets a rail take its own name", () => {
        expect(query(".named-rail").getAttribute("aria-label")).toBe("Fold");
    });

    it("places the rail by direction", async () => {
        expect(query(".named-rail").classList.contains("left-0")).toBe(true);
        (fixture.nativeElement as HTMLElement).setAttribute("dir", "rtl");
        await render();
        expect(query(".named-rail").classList.contains("right-0")).toBe(true);
        expect(query(".named-rail").classList.contains("left-0")).toBe(false);
    });

    it("reads the sidebar named with for, from inside another one", () => {
        expect(query(".reads-named").textContent).toBe("second");
    });

    it("keeps a group label's own id", () => {
        expect(query("#authored-label")).not.toBeNull();
        expect(query(".authored-group").getAttribute("aria-labelledby")).toBe("authored-label");
    });

    it("drops a group's name with its label", async () => {
        expect(query(".changing-group").hasAttribute("aria-labelledby")).toBe(true);
        fixture.componentInstance.labelled.set(false);
        await render();
        expect(query(".changing-group").hasAttribute("aria-labelledby")).toBe(false);
    });

    it("keeps an authored role on a disabled row", () => {
        expect(query(".menu-role").getAttribute("role")).toBe("menuitem");
    });

    it("stops a disabled row's click ahead of every other listener", () => {
        query(".menu-role").click();
        const early = fixture.debugElement.query(By.directive(EarlyClickDirective)).injector.get(EarlyClickDirective);
        expect(early.clicks()).toBe(0);
    });
});

describe("Sidebar storage", () => {
    @Component({
        imports: [SidebarComponent],
        template: `<mona-sidebar
            persistKey="nav"
            [expanded]="expanded()"
            (expandedChange)="expanded.set($event)"></mona-sidebar>`
    })
    class PersistedHostComponent {
        public readonly expanded = signal(true);
    }

    beforeEach(() => {
        const entries = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => entries.get(key) ?? null,
            setItem: (key: string, value: string) => void entries.set(key, value)
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    const create = async (): Promise<ComponentFixture<PersistedHostComponent>> => {
        const fixture = TestBed.createComponent(PersistedHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture;
    };

    it.each(["garbage", "1", "TRUE", "{}", ""])("treats a stored %j as nothing stored", key => {
        const storage = new LocalStorageSidebarStorage("browser");
        localStorage.setItem("nav", key);
        expect(storage.read("nav")).toBeNull();
    });

    it("reads what it wrote", () => {
        const storage = new LocalStorageSidebarStorage("browser");
        storage.write("nav", true);
        expect(storage.read("nav")).toBe(true);
        storage.write("nav", false);
        expect(storage.read("nav")).toBe(false);
    });

    it("stays open on a corrupt value, and leaves it there until the state changes", async () => {
        localStorage.setItem("nav", "someone else's");
        const fixture = await create();
        expect(fixture.nativeElement.querySelector("mona-sidebar").getAttribute("data-state")).toBe("expanded");
        expect(localStorage.getItem("nav")).toBe("someone else's");
        fixture.componentInstance.expanded.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(localStorage.getItem("nav")).toBe("false");
    });

    it("writes nothing until the state changes", async () => {
        await create();
        expect(localStorage.getItem("nav")).toBeNull();
    });

    it("survives a custom storage that throws", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const throwing: SidebarStorage = {
            read: () => {
                throw new Error("read");
            },
            write: () => {
                throw new Error("write");
            }
        };
        TestBed.configureTestingModule({ providers: [{ provide: SIDEBAR_STORAGE, useValue: throwing }] });
        const fixture = await create();
        expect(fixture.nativeElement.querySelector("mona-sidebar").getAttribute("data-state")).toBe("expanded");
        fixture.componentInstance.expanded.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector("mona-sidebar").getAttribute("data-state")).toBe("collapsed");
        expect(vi.mocked(console.error)).toHaveBeenCalledTimes(2);
    });

    it("takes a storage as an instance", () => {
        const storage: SidebarStorage = { read: () => null, write: () => undefined };
        TestBed.configureTestingModule({ providers: [provideSidebarStorage(storage)] });
        expect(TestBed.inject(SIDEBAR_STORAGE)).toBe(storage);
    });

    it("takes a storage as a factory that can inject", () => {
        const storage: SidebarStorage = { read: () => null, write: () => undefined };
        let router: Router | null = null;
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                provideSidebarStorage(() => {
                    router = inject(Router);
                    return storage;
                })
            ]
        });
        expect(TestBed.inject(SIDEBAR_STORAGE)).toBe(storage);
        expect(router).toBe(TestBed.inject(Router));
    });
});
