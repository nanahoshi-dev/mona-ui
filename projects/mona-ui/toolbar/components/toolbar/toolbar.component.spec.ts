import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToolbarItemDirective } from "../../directives/toolbar-item.directive";
import type { ToolbarOverflow } from "../../models/ToolbarOverflow";
import { ToolbarComponent } from "./toolbar.component";

/** Stands in for the browser's ResizeObserver, which jsdom lacks, so a test can say when sizes change. */
class FakeResizeObserver {
    readonly #callback: ResizeObserverCallback;
    public static readonly instances = new Set<FakeResizeObserver>();

    public constructor(callback: ResizeObserverCallback) {
        this.#callback = callback;
        FakeResizeObserver.instances.add(this);
    }

    public static resize(): void {
        for (const observer of FakeResizeObserver.instances) {
            observer.#callback([], observer as unknown as ResizeObserver);
        }
    }

    public disconnect(): void {
        FakeResizeObserver.instances.delete(this);
    }

    public observe(): void {
        // The test resizes everything at once.
    }

    public unobserve(): void {
        // Nothing to stop observing.
    }
}

@Component({
    imports: [ToolbarComponent, ToolbarItemDirective],
    template: `
        <button type="button" id="before">Before</button>
        <mona-toolbar [aria-label]="label()" [overflow]="overflow()">
            <input monaToolbarItem="never" aria-label="Search" data-width="100" />
            <button monaToolbarItem type="button" data-width="60" [attr.aria-pressed]="bold()" (click)="toggleBold()">
                Bold
            </button>
            <button monaToolbarItem type="button" data-width="60" disabled>Italic</button>
            <span monaToolbarItem role="separator" data-width="10"></span>
            <button
                monaToolbarItem
                type="button"
                data-width="60"
                aria-label="Insert link"
                overflowText="Link…"
                (click)="clicks.push('link')">
                <span aria-hidden="true">🔗</span>
            </button>
            <button
                monaToolbarItem
                type="button"
                data-width="60"
                (click)="clicks.push('undo')"
                (overflowActivate)="onUndoActivate($event)">
                Undo
            </button>
        </mona-toolbar>
    `
})
class HostComponent {
    public readonly bold = signal(false);
    public readonly clicks: string[] = [];
    public readonly label = signal("Formatting");
    public readonly overflow = signal<ToolbarOverflow>("menu");
    public readonly preventUndo = signal(false);

    public onUndoActivate(event: PreventableEvent<Event>): void {
        if (this.preventUndo()) {
            event.preventDefault();
            this.clicks.push("undo handled");
        }
    }

    public toggleBold(): void {
        this.bold.update(bold => !bold);
    }
}

const MORE_BUTTON_WIDTH = 36;

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("ToolbarComponent", () => {
    let fixture: ComponentFixture<HostComponent>;
    let toolbar: HTMLElement;
    let available = 1000;

    const isShown = (element: HTMLElement): boolean => !element.hidden && element.style.display !== "none";
    const widthOf = (element: HTMLElement): number => {
        if (!isShown(element)) {
            return 0;
        }
        return element.hasAttribute("data-width") ? Number(element.dataset["width"]) : MORE_BUTTON_WIDTH;
    };
    const control = (text: string): HTMLElement =>
        Array.from(toolbar.querySelectorAll<HTMLElement>("[monaToolbarItem]")).find(
            element => element.textContent?.trim() === text || element.getAttribute("aria-label") === text
        ) as HTMLElement;
    const moreButton = (): HTMLButtonElement =>
        toolbar.querySelector("button[aria-haspopup='menu']") as HTMLButtonElement;
    const shownText = (): string[] =>
        Array.from(toolbar.querySelectorAll<HTMLElement>("[monaToolbarItem]"))
            .filter(isShown)
            .map(element => element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "");
    const menuItems = (): HTMLElement[] =>
        Array.from(document.querySelectorAll<HTMLElement>("[role='menuitem'], [role='menuitemcheckbox']"));

    const settle = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(40);
        fixture.detectChanges();
    };
    const resizeTo = async (width: number): Promise<void> => {
        available = width;
        FakeResizeObserver.resize();
        await settle();
    };
    const openMenu = async (): Promise<void> => {
        moreButton().focus();
        moreButton().click();
        await settle();
    };

    beforeEach(async () => {
        vi.stubGlobal("ResizeObserver", FakeResizeObserver);
        available = 1000;
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        toolbar = fixture.nativeElement.querySelector("mona-toolbar");
        Object.defineProperty(toolbar, "clientWidth", { configurable: true, get: () => available });
        Object.defineProperty(toolbar, "scrollWidth", {
            configurable: true,
            get: () =>
                Array.from(toolbar.children)
                    .filter((child): child is HTMLElement => child instanceof HTMLElement)
                    .reduce((total, child) => total + widthOf(child), 0)
        });
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
            return { width: widthOf(this) } as DOMRect;
        });
        await settle();
    });

    afterEach(() => {
        fixture.destroy();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe("keyboard", () => {
        it("is a named toolbar with one Tab stop", () => {
            expect(toolbar.getAttribute("role")).toBe("toolbar");
            expect(toolbar.getAttribute("aria-label")).toBe("Formatting");
            const stops = Array.from(toolbar.querySelectorAll<HTMLButtonElement>("input, button")).filter(
                element => element.tabIndex === 0 && isShown(element) && !element.disabled
            );
            expect(stops).toHaveLength(1);
        });

        it("moves between controls with the arrow keys, past disabled ones, and to the ends with Home and End", () => {
            const bold = control("Bold");
            bold.focus();
            bold.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }));
            expect(document.activeElement).toBe(control("Insert link"));
            control("Insert link").dispatchEvent(
                new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "End" })
            );
            expect(document.activeElement).toBe(control("Undo"));
            expect(control("Undo").tabIndex).toBe(0);
            expect(bold.tabIndex).toBe(-1);
        });
    });

    describe("overflow", () => {
        it("shows everything, and no More button, while it all fits", () => {
            expect(shownText()).toEqual(["Search", "Bold", "Italic", "", "Insert link", "Undo"]);
            expect(isShown(moreButton())).toBe(false);
        });

        it("moves items from the end into the menu, keeping the ones marked never", async () => {
            // 100 + 60 + 60 + 10 + 60 + 60 = 350; with the More button, Undo and the link have to go.
            await resizeTo(300);
            expect(shownText()).toEqual(["Search", "Bold", "Italic"]);
            expect(isShown(moreButton())).toBe(true);
            expect(moreButton().getAttribute("aria-label")).toBe("More");
            expect(moreButton().getAttribute("aria-expanded")).toBe("false");
            // The divider before them separates nothing now, so it goes too.
            expect(isShown(toolbar.querySelector("[role='separator']") as HTMLElement)).toBe(false);
            await resizeTo(120);
            expect(shownText()).toEqual(["Search"]);
        });

        it("brings items back as it widens", async () => {
            await resizeTo(200);
            await resizeTo(1000);
            expect(shownText()).toEqual(["Search", "Bold", "Italic", "", "Insert link", "Undo"]);
            expect(isShown(moreButton())).toBe(false);
        });

        it("hands focus on a control that moves into the menu to the More button", async () => {
            control("Undo").focus();
            await resizeTo(200);
            expect(document.activeElement).toBe(moreButton());
            expect(moreButton().tabIndex).toBe(0);
        });

        it("keeps focus on the More button as the toolbar resizes, and hands it back when everything fits", async () => {
            await resizeTo(200);
            moreButton().focus();
            const blur = vi.fn();
            moreButton().addEventListener("blur", blur);
            await resizeTo(180);
            await resizeTo(250);
            expect(document.activeElement).toBe(moreButton());
            expect(blur).not.toHaveBeenCalled();
            await resizeTo(1000);
            expect(isShown(moreButton())).toBe(false);
            expect(document.activeElement).toBe(control("Undo"));
        });

        it("wraps instead when overflow is wrap", async () => {
            fixture.componentInstance.overflow.set("wrap");
            await resizeTo(200);
            expect(toolbar.classList).toContain("flex-wrap");
            expect(moreButton()).toBeNull();
            expect(shownText()).toHaveLength(6);
        });
    });

    describe("the More menu", () => {
        beforeEach(async () => {
            await resizeTo(120);
        });

        it("lists the hidden items with their text, states and dividers", async () => {
            await openMenu();
            expect(moreButton().getAttribute("aria-expanded")).toBe("true");
            const items = menuItems();
            expect(items.map(item => item.textContent?.replace(/\s+/g, " ").trim())).toEqual([
                "Bold",
                "Italic",
                "Link…",
                "Undo"
            ]);
            expect(items[0].getAttribute("role")).toBe("menuitemcheckbox");
            expect(items[0].getAttribute("aria-checked")).toBe("false");
            expect(items[1].getAttribute("aria-disabled")).toBe("true");
            expect(document.querySelectorAll("[role='menu'] [role='separator']")).toHaveLength(1);
        });

        it("clicks the control when its item is chosen", async () => {
            await openMenu();
            menuItems()[0].click();
            await settle();
            expect(fixture.componentInstance.bold()).toBe(true);
            await openMenu();
            expect(menuItems()[0].getAttribute("aria-checked")).toBe("true");
            menuItems()[2].click();
            await settle();
            expect(fixture.componentInstance.clicks).toEqual(["link"]);
        });

        it("lets overflowActivate handle an item instead", async () => {
            fixture.componentInstance.preventUndo.set(true);
            await openMenu();
            menuItems()[3].click();
            await settle();
            expect(fixture.componentInstance.clicks).toEqual(["undo handled"]);
        });
    });

    it("warns in development when it has no name", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        fixture.destroy();
        fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.label.set("");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Mona Toolbar]"), expect.anything());
    });

    it("passes axe, with and without the More button", async () => {
        const run = async (): Promise<void> => {
            const result = await axe.run(toolbar, { rules: { "color-contrast": { enabled: false } } });
            expect(result.violations).toEqual([]);
        };
        await run();
        await resizeTo(200);
        await run();
    });
});
