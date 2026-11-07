import { Component, Directive, ElementRef, inject, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter, Router, RouterLink } from "@angular/router";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BreadcrumbItemComponent } from "../components/breadcrumb-item/breadcrumb-item.component";
import { BreadcrumbComponent } from "../components/breadcrumb/breadcrumb.component";
import { BreadcrumbLinkDirective } from "../directives/breadcrumb-link.directive";
import { BreadcrumbSeparatorTemplateDirective } from "../directives/breadcrumb-separator-template.directive";
import {
    breadcrumbItemContentThemeVariants,
    breadcrumbLinkThemeVariants,
    breadcrumbListItemThemeVariants,
    breadcrumbListItemWrapperThemeVariants,
    breadcrumbListThemeVariants
} from "../styles/breadcrumb.styles";

interface Crumb {
    readonly disabled?: boolean;
    readonly href?: string;
    readonly text: string;
}

@Component({
    template: `
        <mona-breadcrumb [disabled]="disabled()" [lastItemCurrent]="lastItemCurrent()" [maxItems]="maxItems()">
            @for (crumb of crumbs(); track crumb.text) {
                <mona-breadcrumb-item [disabled]="!!crumb.disabled" (itemClick)="clicks.push([crumb.text, $event])">
                    @if (crumb.href) {
                        <a monaBreadcrumbLink class="extra" [href]="crumb.href">{{ crumb.text }}</a>
                    } @else {
                        {{ crumb.text }}
                    }
                </mona-breadcrumb-item>
            }
            <ng-template monaBreadcrumbSeparatorTemplate let-index>
                <span class="separator">{{ index }}</span>
            </ng-template>
        </mona-breadcrumb>
    `,
    imports: [
        BreadcrumbComponent,
        BreadcrumbItemComponent,
        BreadcrumbLinkDirective,
        BreadcrumbSeparatorTemplateDirective
    ]
})
class HostComponent {
    public readonly clicks: [string, MouseEvent][] = [];
    public readonly crumbs = signal<readonly Crumb[]>([{ text: "Home" }, { text: "Products" }, { text: "Item" }]);
    public readonly disabled = signal(false);
    public readonly lastItemCurrent = signal(true);
    public readonly maxItems = signal<unknown>(null);
}

const earlyClick = vi.fn();

/** Listens on the anchor before the link directive does, as a directive matched ahead of it would. */
@Directive({ selector: "a[monaTestEarlyClick]" })
class EarlyClickDirective {
    public constructor() {
        inject<ElementRef<HTMLAnchorElement>>(ElementRef).nativeElement.addEventListener("click", earlyClick);
    }
}

@Component({
    template: `
        <mona-breadcrumb>
            <mona-breadcrumb-item disabled>
                <a monaBreadcrumbLink monaTestEarlyClick href="/home">Home</a>
            </mona-breadcrumb-item>
            <mona-breadcrumb-item>Here</mona-breadcrumb-item>
        </mona-breadcrumb>
    `,
    imports: [EarlyClickDirective, BreadcrumbComponent, BreadcrumbItemComponent, BreadcrumbLinkDirective]
})
class EarlyClickHostComponent {}

@Component({
    template: `
        <mona-breadcrumb>
            <mona-breadcrumb-item [disabled]="disabled()">
                <a monaBreadcrumbLink routerLink="/home">Home</a>
            </mona-breadcrumb-item>
            <mona-breadcrumb-item>Here</mona-breadcrumb-item>
        </mona-breadcrumb>
    `,
    imports: [BreadcrumbComponent, BreadcrumbItemComponent, BreadcrumbLinkDirective, RouterLink]
})
class RouterHostComponent {
    public readonly disabled = signal(false);
}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

const LINKS: readonly Crumb[] = [
    { text: "Home", href: "/home" },
    { text: "Products", href: "/products" },
    { text: "Item", href: "/item" }
];

describe("mona-breadcrumb behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    async function setup(crumbs?: readonly Crumb[], maxItems?: unknown): Promise<void> {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        if (crumbs) {
            host.crumbs.set(crumbs);
        }
        if (maxItems !== undefined) {
            host.maxItems.set(maxItems);
        }
        await settle(fixture);
    }

    function query<T extends Element>(selector: string): T | null {
        return fixture.nativeElement.querySelector(selector);
    }

    function queryAll<T extends Element>(selector: string): T[] {
        return Array.from(fixture.nativeElement.querySelectorAll(selector));
    }

    function visibleTexts(): (string | undefined)[] {
        return queryAll("li:not([aria-hidden])").map(item => item.textContent?.trim());
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HostComponent, RouterHostComponent],
            providers: [provideRouter([{ path: "**", children: [] }])]
        });
    });

    describe("links", () => {
        it("renders the anchor itself, with no button around it", async () => {
            await setup(LINKS);
            const links = queryAll<HTMLAnchorElement>("a[monaBreadcrumbLink]");
            expect(links.length).toBe(3);
            expect(links[0].closest("button")).toBeNull();
            expect(links[0].getAttribute("href")).toBe("/home");
        });

        it("passes axe, where a link in a button wouldn't", async () => {
            await setup(LINKS);
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });

        it("marks the last link as the current page, and not a wrapper span", async () => {
            await setup(LINKS);
            const links = queryAll("a[monaBreadcrumbLink]");
            expect(links[2].getAttribute("aria-current")).toBe("page");
            expect(links[0].hasAttribute("aria-current")).toBe(false);
            expect(query("span[aria-current]")).toBeNull();
        });

        it("emits itemClick with the click for a link, but not the current one", async () => {
            await setup(LINKS);
            const links = queryAll<HTMLAnchorElement>("a[monaBreadcrumbLink]");
            const prevent = (event: Event): void => event.preventDefault();
            links.forEach(link => link.addEventListener("click", prevent));

            links[0].click();
            links[2].click();

            expect(host.clicks.map(([text]) => text)).toEqual(["Home"]);
            expect(host.clicks[0][1]).toBeInstanceOf(MouseEvent);
        });

        it("disables a link: no tab stop, no default action and no event", async () => {
            await setup([{ text: "Home", href: "/home", disabled: true }, { text: "Here" }]);
            const link = query<HTMLAnchorElement>("a[monaBreadcrumbLink]")!;
            expect(link.getAttribute("aria-disabled")).toBe("true");
            expect(link.tabIndex).toBe(-1);

            const event = new MouseEvent("click", { bubbles: true, cancelable: true });
            const later = vi.fn();
            link.addEventListener("click", later);
            link.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
            expect(later).not.toHaveBeenCalled();
            expect(host.clicks).toEqual([]);
        });

        it("disables links with the whole breadcrumb", async () => {
            await setup(LINKS);
            host.disabled.set(true);
            await settle(fixture);
            expect(query("a[monaBreadcrumbLink]")?.getAttribute("aria-disabled")).toBe("true");
        });

        it("leaves an enabled link's tabindex and aria-disabled unset", async () => {
            await setup(LINKS);
            const link = query("a[monaBreadcrumbLink]")!;
            expect(link.hasAttribute("tabindex")).toBe(false);
            expect(link.hasAttribute("aria-disabled")).toBe(false);
        });

        it("merges the consumer's classes", async () => {
            await setup(LINKS);
            expect(query("a[monaBreadcrumbLink]")?.classList.contains("extra")).toBe(true);
        });

        it("works with routerLink, and a disabled link can't navigate", async () => {
            const routed = TestBed.createComponent(RouterHostComponent);
            await settle(routed);
            const router = TestBed.inject(Router);
            const link = routed.nativeElement.querySelector("a") as HTMLAnchorElement;
            expect(link.getAttribute("href")).toBe("/home");

            routed.componentInstance.disabled.set(true);
            await settle(routed);
            link.click();
            await settle(routed);
            expect(router.url).toBe("/");

            routed.componentInstance.disabled.set(false);
            await settle(routed);
            link.click();
            await settle(routed);
            expect(router.url).toBe("/home");
        });

        it("stops a disabled link's click before a listener that was there first", async () => {
            earlyClick.mockClear();
            const early = TestBed.createComponent(EarlyClickHostComponent);
            await settle(early);
            (early.nativeElement.querySelector("a") as HTMLAnchorElement).click();
            expect(earlyClick).not.toHaveBeenCalled();
        });
    });

    describe("button items", () => {
        it("emits itemClick with the click", async () => {
            await setup();
            query<HTMLButtonElement>("button[monaBreadcrumbItem]")!.click();
            expect(host.clicks[0][0]).toBe("Home");
            expect(host.clicks[0][1]).toBeInstanceOf(MouseEvent);
        });

        it("doesn't emit for a disabled item, even if a click gets through", async () => {
            await setup([{ text: "Home", disabled: true }, { text: "Here" }]);
            fixture.debugElement
                .query(By.css("button[monaBreadcrumbItem]"))
                .triggerEventHandler("click", new MouseEvent("click"));
            expect(host.clicks).toEqual([]);
        });

        it("passes axe", async () => {
            await setup();
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });
    });

    describe("lastItemCurrent", () => {
        it("makes the last item a normal one when turned off", async () => {
            await setup();
            host.lastItemCurrent.set(false);
            await settle(fixture);
            expect(query("[aria-current]")).toBeNull();
            expect(queryAll("button[monaBreadcrumbItem]").length).toBe(3);
            queryAll<HTMLButtonElement>("button[monaBreadcrumbItem]")[2].click();
            expect(host.clicks[0][0]).toBe("Item");
        });

        it("makes the last link a normal one when turned off", async () => {
            await setup(LINKS);
            host.lastItemCurrent.set(false);
            await settle(fixture);
            expect(queryAll("a[aria-current]").length).toBe(0);
        });
    });

    describe("no items", () => {
        it("renders no landmark and no list", async () => {
            await setup([]);
            const breadcrumb = query("mona-breadcrumb")!;
            expect(breadcrumb.hasAttribute("role")).toBe(false);
            expect(breadcrumb.hasAttribute("aria-label")).toBe(false);
            expect(query("ol")).toBeNull();
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
            expect((await axe.run(fixture.nativeElement)).incomplete).toEqual([]);
        });

        it("becomes a landmark when items arrive", async () => {
            await setup([]);
            host.crumbs.set([{ text: "Home" }]);
            await settle(fixture);
            expect(query("mona-breadcrumb")?.getAttribute("role")).toBe("navigation");
            expect(query("mona-breadcrumb")?.getAttribute("aria-label")).toBe("Breadcrumb");
        });
    });

    describe("maxItems", () => {
        const LONG: readonly Crumb[] = ["One", "Two", "Three", "Four", "Five", "Six"].map(text => ({ text }));

        it("keeps every item without it", async () => {
            await setup(LONG);
            expect(visibleTexts()).toEqual(["One", "Two", "Three", "Four", "Five", "Six"]);
            expect(query("[data-breadcrumb-expand]")).toBeNull();
        });

        it("keeps the first and the last ones, with the button between", async () => {
            await setup(LONG, 4);
            expect(visibleTexts()).toEqual(["One", "", "Four", "Five", "Six"]);
            expect(query("[data-breadcrumb-expand]")?.getAttribute("aria-label")).toBe("Show full path");
        });

        it("doesn't collapse a trail that fits", async () => {
            await setup(LONG, 6);
            expect(query("[data-breadcrumb-expand]")).toBeNull();
            expect(visibleTexts().length).toBe(6);
        });

        it("collapses the one extra item", async () => {
            await setup(LONG, 5);
            expect(visibleTexts()).toEqual(["One", "", "Three", "Four", "Five", "Six"]);
        });

        it.each([0, 1, -3, 2])("always keeps first and last, with maxItems %s", async maxItems => {
            await setup(LONG, maxItems);
            expect(visibleTexts()).toEqual(["One", "", "Six"]);
        });

        it("rounds a fractional maxItems down", async () => {
            await setup(LONG, 3.5);
            expect(visibleTexts()).toEqual(["One", "", "Five", "Six"]);
        });

        it.each(["", "many", undefined])("never collapses with maxItems %j", async maxItems => {
            await setup(LONG, maxItems ?? null);
            expect(visibleTexts()).toEqual(["One", "Two", "Three", "Four", "Five", "Six"]);
        });

        it("reveals the trail and moves focus to the first item it revealed", async () => {
            await setup(LONG, 3);
            const button = query<HTMLButtonElement>("[data-breadcrumb-expand]")!;
            button.focus();
            button.click();
            await settle(fixture);

            expect(visibleTexts()).toEqual(["One", "Two", "Three", "Four", "Five", "Six"]);
            expect(query("[data-breadcrumb-expand]")).toBeNull();
            expect(document.activeElement?.textContent?.trim()).toBe("Two");
        });

        it("skips disabled items when moving focus", async () => {
            await setup(
                [
                    { text: "One" },
                    { text: "Two", disabled: true },
                    { text: "Three" },
                    { text: "Four" },
                    { text: "Five" }
                ],
                3
            );
            query<HTMLButtonElement>("[data-breadcrumb-expand]")!.click();
            await settle(fixture);
            expect(document.activeElement?.textContent?.trim()).toBe("Three");
        });

        it("moves focus to a revealed link", async () => {
            await setup([{ text: "One" }, { text: "Two", href: "/two" }, { text: "Three" }, { text: "Four" }], 3);
            query<HTMLButtonElement>("[data-breadcrumb-expand]")!.click();
            await settle(fixture);
            expect(document.activeElement).toBe(query("a[monaBreadcrumbLink]"));
        });

        it("skips a disabled link when moving focus", async () => {
            await setup(
                [
                    { text: "One" },
                    { text: "Two", href: "/two", disabled: true },
                    { text: "Three" },
                    { text: "Four" },
                    { text: "Five" }
                ],
                3
            );
            query<HTMLButtonElement>("[data-breadcrumb-expand]")!.click();
            await settle(fixture);
            expect(document.activeElement?.textContent?.trim()).toBe("Three");
        });

        it("falls back to the first usable item when nothing revealed can take focus", async () => {
            await setup([{ text: "One" }, { text: "Two", disabled: true }, { text: "Three" }], 2);
            query<HTMLButtonElement>("[data-breadcrumb-expand]")!.click();
            await settle(fixture);
            expect(document.activeElement?.textContent?.trim()).toBe("One");
        });

        it("collapses again when the trail changes", async () => {
            await setup(LONG, 3);
            query<HTMLButtonElement>("[data-breadcrumb-expand]")!.click();
            await settle(fixture);

            host.crumbs.set([...LONG, { text: "Seven" }]);
            await settle(fixture);
            expect(query("[data-breadcrumb-expand]")).not.toBeNull();
        });

        it("reports real indexes to the separator template", async () => {
            await setup(LONG, 3);
            const indexes = queryAll(".separator").map(separator => separator.textContent);
            // After One, after the button that stands for Two to Four, and after Five. Nothing follows Six.
            expect(indexes).toEqual(["0", "3", "4"]);
        });

        it("disables the button with the breadcrumb", async () => {
            await setup(LONG, 3);
            host.disabled.set(true);
            await settle(fixture);
            expect(query<HTMLButtonElement>("[data-breadcrumb-expand]")?.disabled).toBe(true);
        });

        it("passes axe while collapsed", async () => {
            await setup(LONG, 3);
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });
    });

    describe("styles", () => {
        it("lets list items shrink, so their text can truncate", () => {
            expect(breadcrumbListItemWrapperThemeVariants({ current: false }).split(/\s+/)).toContain("min-w-0");
            expect(breadcrumbItemContentThemeVariants().split(/\s+/)).toContain("truncate");
            expect(breadcrumbLinkThemeVariants({ current: false, disabled: false }).split(/\s+/)).toContain("truncate");
        });

        it("has the current page give up its width last", async () => {
            await setup();
            const items = queryAll("li[data-item-index]");
            expect(items[0].className).toContain("shrink-[10]");
            expect(items[2].className).not.toContain("shrink-[10]");
        });

        it("lets the host shrink inside a flex parent", async () => {
            await setup();
            const host = query<HTMLElement>("mona-breadcrumb");
            expect(host?.classList).toContain("min-w-0");
            expect(host?.classList).toContain("max-w-full");
        });

        it("doesn't stop a path being copied", () => {
            expect(breadcrumbListThemeVariants({ disabled: false }).split(/\s+/)).not.toContain("select-none");
        });

        it.each([
            ["item", breadcrumbListItemThemeVariants({ disabled: false })],
            ["link", breadcrumbLinkThemeVariants({ current: false, disabled: false })]
        ])("uses a solid inset outline on the %s", (_name, classes) => {
            const names = classes.split(/\s+/);
            expect(names).toContain("focus-visible:outline-2");
            expect(names).toContain("focus-visible:-outline-offset-2");
            expect(names).toContain("focus-visible:outline-focus-indicator");
            expect(names).not.toContain("outline-none");
            expect(names.some(name => name.includes("ring"))).toBe(false);
        });

        it("drops hover from a disabled or current link", () => {
            expect(breadcrumbLinkThemeVariants({ current: true, disabled: false })).not.toContain("hover:");
            expect(breadcrumbLinkThemeVariants({ current: false, disabled: true })).not.toContain("hover:");
        });
    });
});
