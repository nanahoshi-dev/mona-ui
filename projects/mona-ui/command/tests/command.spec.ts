import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, resource, signal, type WritableSignal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandComponent } from "../components/command/command.component";
import { CommandDialogComponent } from "../components/command-dialog/command-dialog.component";
import { CommandEmptyComponent } from "../components/command-empty/command-empty.component";
import { CommandFooterComponent } from "../components/command-footer/command-footer.component";
import { CommandGroupComponent } from "../components/command-group/command-group.component";
import { CommandHeaderComponent } from "../components/command-header/command-header.component";
import { CommandHighlightComponent } from "../components/command-highlight/command-highlight.component";
import { CommandInputComponent } from "../components/command-input/command-input.component";
import { CommandItemComponent } from "../components/command-item/command-item.component";
import { CommandListComponent } from "../components/command-list/command-list.component";
import { CommandLoadingComponent } from "../components/command-loading/command-loading.component";
import { CommandSeparatorComponent } from "../components/command-separator/command-separator.component";
import { CommandShortcutComponent } from "../components/command-shortcut/command-shortcut.component";
import { CommandDialogContentDirective } from "../directives/command-dialog-content.directive";
import type { CommandFilter, CommandFilterMode } from "../models/CommandFilter";
import type { CommandSelectEvent } from "../models/CommandSelectEvent";
import { defaultCommandFilter, splitByQuery } from "../utils/command-filter";
import { describeShortcut, matchesShortcut } from "../utils/command-shortcut";

const PARTS = [
    CommandComponent,
    CommandEmptyComponent,
    CommandFooterComponent,
    CommandGroupComponent,
    CommandHeaderComponent,
    CommandHighlightComponent,
    CommandInputComponent,
    CommandItemComponent,
    CommandListComponent,
    CommandLoadingComponent,
    CommandSeparatorComponent,
    CommandShortcutComponent
];

@Component({
    imports: PARTS,
    template: `
        <mona-command
            [filter]="filter()"
            [filterMode]="filterMode()"
            [loading]="loading()"
            [loop]="loop()"
            [(query)]="query"
            (itemSelect)="selected.push($event)">
            <mona-command-header>Header</mona-command-header>
            <mona-command-input />
            <mona-command-list>
                <mona-command-empty />
                <mona-command-loading />
                <mona-command-group heading="Files">
                    <mona-command-item value="New file" [keywords]="['create']" (itemSelect)="itemEvents.push($event)">
                        <mona-command-highlight text="New file" />
                        <mona-command-shortcut keys="ctrl+n" />
                    </mona-command-item>
                    <mona-command-item disabled value="Save">Save</mona-command-item>
                    <mona-command-item value="Open">Open</mona-command-item>
                </mona-command-group>
                <mona-command-separator />
                <mona-command-group heading="View">
                    <mona-command-item value="Café theme">Café theme</mona-command-item>
                </mona-command-group>
            </mona-command-list>
            <mona-command-footer>Footer</mona-command-footer>
        </mona-command>
    `
})
class StaticHostComponent {
    public readonly filter = signal<CommandFilter>(defaultCommandFilter);
    public readonly filterMode = signal<CommandFilterMode>("auto");
    public readonly itemEvents: CommandSelectEvent[] = [];
    public readonly loading = signal(false);
    public readonly loop = signal(true);
    public readonly query = signal("");
    public readonly selected: CommandSelectEvent[] = [];
}

@Component({
    imports: PARTS,
    template: `
        <mona-command filterMode="manual" [loading]="results.isLoading()" [(query)]="query">
            <mona-command-input />
            <mona-command-list>
                <mona-command-empty />
                @for (result of results.value(); track result) {
                    <mona-command-item [value]="result">{{ result }}</mona-command-item>
                }
            </mona-command-list>
        </mona-command>
    `
})
class AsyncHostComponent {
    public readonly pending = new Map<string, (results: string[]) => void>();
    public readonly query = signal("");
    public readonly results = resource({
        defaultValue: [],
        loader: ({ params }) => new Promise<string[]>(resolve => this.pending.set(params, resolve)),
        params: () => this.query()
    });
}

@Component({
    imports: [...PARTS, CommandDialogComponent, CommandDialogContentDirective],
    template: `
        <button type="button" id="opener">Open</button>
        <mona-command-dialog [shortcut]="shortcut()" [(open)]="open">
            <ng-template monaCommandDialogContent>
                <mona-command>
                    <mona-command-input />
                    <mona-command-list>
                        <mona-command-item value="First">First</mona-command-item>
                    </mona-command-list>
                </mona-command>
            </ng-template>
        </mona-command-dialog>
    `
})
class DialogHostComponent {
    public readonly open = signal(false);
    public readonly shortcut = signal<string | null>(null);
}

describe("mona-command", () => {
    function setup<T>(type: new () => T): ComponentFixture<T> {
        const fixture = TestBed.createComponent(type);
        fixture.autoDetectChanges();
        document.body.appendChild(fixture.nativeElement);
        return fixture;
    }

    const field = (fixture: ComponentFixture<unknown>): HTMLInputElement =>
        fixture.nativeElement.querySelector("input");

    const shownItems = (fixture: ComponentFixture<unknown>): string[] =>
        Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("mona-command-item"))
            .filter(item => !item.classList.contains("hidden"))
            .map(item => (item.textContent ?? "").trim());

    const activeText = (fixture: ComponentFixture<unknown>): string | null | undefined =>
        fixture.nativeElement.querySelector("[data-active='true']")?.textContent?.trim();

    function typeWithoutWaiting(fixture: ComponentFixture<unknown>, text: string): void {
        const input = field(fixture);
        input.value = text;
        input.dispatchEvent(new Event("input"));
        TestBed.tick();
    }

    async function type(fixture: ComponentFixture<unknown>, text: string): Promise<void> {
        typeWithoutWaiting(fixture, text);
        await fixture.whenStable();
    }

    async function press(
        fixture: ComponentFixture<unknown>,
        key: string,
        init: KeyboardEventInit = {}
    ): Promise<KeyboardEvent> {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
        field(fixture).dispatchEvent(event);
        await fixture.whenStable();
        return event;
    }

    beforeEach(() => {
        vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.querySelectorAll("[ng-version]").forEach(element => element.remove());
    });

    describe("filtering", () => {
        it("shows everything while the query is empty", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();

            expect(fixture.nativeElement.querySelectorAll("mona-command-item:not(.hidden)").length).toBe(4);
        });

        it("finds items by value and keywords, ignoring case and accents", async () => {
            const fixture = setup(StaticHostComponent);

            await type(fixture, "CREATE");
            expect(fixture.nativeElement.querySelector("mona-command-item:not(.hidden)")?.textContent).toContain("New");

            await type(fixture, "cafe");
            expect(shownItems(fixture)).toEqual(["Café theme"]);
        });

        it("needs every word of the query, in any order", async () => {
            const fixture = setup(StaticHostComponent);

            await type(fixture, "theme cafe");
            expect(shownItems(fixture)).toEqual(["Café theme"]);

            await type(fixture, "theme file");
            expect(shownItems(fixture)).toEqual([]);
        });

        it("hides a group with no matches, and the separators", async () => {
            const fixture = setup(StaticHostComponent);

            await type(fixture, "open");

            const groups = fixture.nativeElement.querySelectorAll("mona-command-group");
            expect(groups[0].classList.contains("hidden")).toBe(false);
            expect(groups[1].classList.contains("hidden")).toBe(true);
            expect(fixture.nativeElement.querySelector("mona-command-separator").classList.contains("hidden")).toBe(
                true
            );
        });

        it("takes a custom filter", async () => {
            const fixture = setup(StaticHostComponent);
            fixture.componentInstance.filter.set((query, item) => item.value.startsWith(query));

            await type(fixture, "Op");
            expect(shownItems(fixture)).toEqual(["Open"]);
        });

        it("shows every item in manual mode", async () => {
            const fixture = setup(StaticHostComponent);
            fixture.componentInstance.filterMode.set("manual");

            await type(fixture, "nothing matches this");

            expect(fixture.nativeElement.querySelectorAll("mona-command-item:not(.hidden)").length).toBe(4);
        });
    });

    describe("keyboard", () => {
        it("starts on the first item and moves past disabled ones", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();
            expect(activeText(fixture)).toContain("New file");

            await press(fixture, "ArrowDown");

            expect(activeText(fixture)).toBe("Open");
        });

        it("wraps around, unless told not to", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();

            await press(fixture, "ArrowUp");
            expect(activeText(fixture)).toBe("Café theme");

            fixture.componentInstance.loop.set(false);
            await fixture.whenStable();
            await press(fixture, "ArrowDown");
            expect(activeText(fixture)).toBe("Café theme");
        });

        it("keeps the caret where it is when moving through the list", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();

            expect((await press(fixture, "ArrowDown")).defaultPrevented).toBe(true);
            expect((await press(fixture, "Home")).defaultPrevented).toBe(false);
        });

        it("goes back to the first result when the query changes", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();
            await press(fixture, "ArrowDown");

            await type(fixture, "e");

            expect(activeText(fixture)).toContain("New file");
        });

        it("chooses the active item with Enter, on the item and on the root", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();

            const event = await press(fixture, "Enter", { ctrlKey: true });

            const { itemEvents, selected } = fixture.componentInstance;
            expect(selected).toEqual([{ originalEvent: event, value: "New file" }]);
            expect(itemEvents).toEqual(selected);
        });

        it("leaves Enter to an input method while it composes", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();

            const event = await press(fixture, "Enter", { isComposing: true });

            expect(event.defaultPrevented).toBe(false);
            expect(fixture.componentInstance.selected).toEqual([]);
        });
    });

    describe("pointer", () => {
        const items = (fixture: ComponentFixture<unknown>): HTMLElement[] =>
            Array.from(fixture.nativeElement.querySelectorAll("mona-command-item"));

        it("chooses an item on click, but not a disabled one", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();

            items(fixture)[1].click();
            expect(fixture.componentInstance.selected).toEqual([]);

            items(fixture)[2].click();
            expect(fixture.componentInstance.selected.map(selection => selection.value)).toEqual(["Open"]);
        });

        it("keeps focus in the input when an item is pressed", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();
            const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });

            items(fixture)[2].dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
        });

        it("makes the item under a moving pointer active", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();

            items(fixture)[2].dispatchEvent(new Event("pointermove"));
            await fixture.whenStable();

            expect(activeText(fixture)).toBe("Open");
        });
    });

    describe("states", () => {
        it("shows the empty state only for a query without results", async () => {
            const fixture = setup(StaticHostComponent);
            const empty = (): HTMLElement => fixture.nativeElement.querySelector("mona-command-empty");
            await fixture.whenStable();
            expect(empty().textContent?.trim()).toBe("");

            await type(fixture, "zzz");

            expect(empty().textContent).toContain("No results found");
            expect(field(fixture).getAttribute("aria-expanded")).toBe("false");
            expect(field(fixture).hasAttribute("aria-activedescendant")).toBe(false);
        });

        it("shows loading instead of the empty state while results are on their way", async () => {
            const fixture = setup(StaticHostComponent);
            fixture.componentInstance.loading.set(true);

            await type(fixture, "zzz");

            expect(fixture.nativeElement.querySelector("mona-command-loading").textContent).toContain("Loading");
            expect(fixture.nativeElement.querySelector("mona-command-empty").textContent?.trim()).toBe("");
            expect(fixture.nativeElement.querySelector("[role='listbox']").getAttribute("aria-busy")).toBe("true");
        });

        it("announces how many results a query has", async () => {
            const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockResolvedValue();
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();
            expect(announce).not.toHaveBeenCalled();

            await type(fixture, "cafe");
            expect(announce).toHaveBeenLastCalledWith("1 result available", "polite");

            await type(fixture, "zzz");
            expect(announce).toHaveBeenLastCalledWith("No results found", "polite");
        });

        it("marks what the query matches", async () => {
            const fixture = setup(StaticHostComponent);

            await type(fixture, "file");

            expect(fixture.nativeElement.querySelector("mark").textContent).toBe("file");
        });
    });

    describe("async results", () => {
        it("doesn't let a late answer replace the answer to a newer query", async () => {
            const fixture = setup(AsyncHostComponent);
            TestBed.tick();
            fixture.componentInstance.pending.get("")?.([]);
            typeWithoutWaiting(fixture, "a");
            typeWithoutWaiting(fixture, "ab");

            fixture.componentInstance.pending.get("ab")?.(["newer"]);
            await fixture.whenStable();
            fixture.componentInstance.pending.get("a")?.(["older"]);
            await fixture.whenStable();

            expect(shownItems(fixture)).toEqual(["newer"]);
        });

        it("keeps the active result while the results around it change", async () => {
            const fixture = setup(AsyncHostComponent);
            TestBed.tick();
            fixture.componentInstance.pending.get("")?.(["one", "two"]);
            await fixture.whenStable();
            await press(fixture, "ArrowDown");
            expect(activeText(fixture)).toBe("two");

            fixture.componentInstance.results.value.set(["zero", "one", "two"]);
            await fixture.whenStable();

            expect(activeText(fixture)).toBe("two");
        });

        it("follows the order on the page, not the order items were created in", async () => {
            const fixture = setup(AsyncHostComponent);
            TestBed.tick();
            fixture.componentInstance.pending.get("")?.(["two"]);
            await fixture.whenStable();

            fixture.componentInstance.results.value.set(["one", "two"]);
            await fixture.whenStable();
            await press(fixture, "ArrowUp");
            expect(activeText(fixture)).toBe("one");
        });
    });

    describe("accessibility", () => {
        it("wires the input to the list and the active item", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();
            const input = field(fixture);
            const active = fixture.nativeElement.querySelector("[data-active='true']");

            expect(input.getAttribute("role")).toBe("combobox");
            expect(input.getAttribute("aria-expanded")).toBe("true");
            expect(input.getAttribute("aria-controls")).toBe(fixture.nativeElement.querySelector("[role='listbox']").id);
            expect(input.getAttribute("aria-activedescendant")).toBe(active.id);
            expect(active.getAttribute("aria-selected")).toBe("true");
        });

        it("passes axe", async () => {
            const fixture = setup(StaticHostComponent);
            await fixture.whenStable();

            const results = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });

            expect(results.violations).toEqual([]);
        });
    });

    describe("mona-command-dialog", () => {
        const dialog = (): HTMLElement | null => document.querySelector("[role='dialog']");

        afterEach(() => {
            document.querySelectorAll(".cdk-overlay-container").forEach(container => (container.innerHTML = ""));
        });

        async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
            await fixture.whenStable();
            await new Promise(resolve => setTimeout(resolve));
            await fixture.whenStable();
        }

        function pressOnDocument(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
            const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
            document.body.dispatchEvent(event);
            return event;
        }

        it("renders nothing until it opens", async () => {
            const fixture = setup(DialogHostComponent);
            await settle(fixture);

            expect(dialog()).toBeNull();
        });

        it("opens from its model, named, with focus in the input", async () => {
            const fixture = setup(DialogHostComponent);
            fixture.componentInstance.open.set(true);
            await settle(fixture);

            expect(dialog()?.getAttribute("aria-label")).toBe("Command menu");
            expect(dialog()?.getAttribute("aria-modal")).toBe("true");
            expect(document.activeElement).toBe(dialog()?.querySelector("input"));
        });

        it("reports closing through its model, and puts focus back", async () => {
            const fixture = setup(DialogHostComponent);
            const opener: HTMLButtonElement = fixture.nativeElement.querySelector("#opener");
            opener.focus();
            fixture.componentInstance.open.set(true);
            await settle(fixture);

            dialog()?.querySelector("input")?.dispatchEvent(
                new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" })
            );
            await settle(fixture);

            expect(fixture.componentInstance.open()).toBe(false);
            expect(document.activeElement).toBe(opener);
        });

        it("binds no key by default", async () => {
            const fixture = setup(DialogHostComponent);
            await settle(fixture);

            const event = pressOnDocument("k", { ctrlKey: true });
            await settle(fixture);

            expect(event.defaultPrevented).toBe(false);
            expect(fixture.componentInstance.open()).toBe(false);
        });

        it("toggles with its shortcut, and stops listening once it's removed", async () => {
            const fixture = setup(DialogHostComponent);
            fixture.componentInstance.shortcut.set("ctrl+k");
            await settle(fixture);

            expect(pressOnDocument("k", { ctrlKey: true }).defaultPrevented).toBe(true);
            await settle(fixture);
            expect(fixture.componentInstance.open()).toBe(true);

            pressOnDocument("k", { ctrlKey: true });
            await settle(fixture);
            expect(fixture.componentInstance.open()).toBe(false);

            fixture.componentInstance.shortcut.set(null);
            await settle(fixture);
            expect(pressOnDocument("k", { ctrlKey: true }).defaultPrevented).toBe(false);
        });

        it("passes axe while open", async () => {
            const fixture = setup(DialogHostComponent);
            fixture.componentInstance.open.set(true);
            await settle(fixture);

            const results = await axe.run(dialog() as HTMLElement, {
                rules: { "color-contrast": { enabled: false } }
            });

            expect(results.violations).toEqual([]);
        });
    });

    describe("helpers", () => {
        it("marks whole characters, however folding changes the text's length", () => {
            expect(splitByQuery("Café theme", "CAFE")).toEqual([
                { match: true, text: "Café" },
                { match: false, text: " theme" }
            ]);
            expect(splitByQuery("Café x", "cafe")).toEqual([
                { match: true, text: "Café" },
                { match: false, text: " x" }
            ]);
            expect(splitByQuery("ﬁle", "fi")).toEqual([
                { match: true, text: "ﬁ" },
                { match: false, text: "le" }
            ]);
            expect(splitByQuery("text", "  ")).toEqual([{ match: false, text: "text" }]);
        });

        it("writes a shortcut the way the platform does", () => {
            expect(describeShortcut("mod+shift+k", false).map(key => key.symbol)).toEqual(["Ctrl", "Shift", "K"]);
            expect(describeShortcut("mod+k", true)).toEqual([
                { name: "Command", symbol: "⌘" },
                { name: "K", symbol: "K" }
            ]);
        });

        it("matches mod to the platform's key, and exact modifiers only", () => {
            const event = (init: KeyboardEventInit): KeyboardEvent => new KeyboardEvent("keydown", { key: "k", ...init });

            expect(matchesShortcut(event({ ctrlKey: true }), "mod+k", false)).toBe(true);
            expect(matchesShortcut(event({ metaKey: true }), "mod+k", true)).toBe(true);
            expect(matchesShortcut(event({ metaKey: true }), "mod+k", false)).toBe(false);
            expect(matchesShortcut(event({ ctrlKey: true, shiftKey: true }), "mod+k", false)).toBe(false);
        });

        it("doesn't take a plain key from someone typing", () => {
            const input = document.createElement("input");
            document.body.appendChild(input);
            const typed = new KeyboardEvent("keydown", { bubbles: true, key: "/" });
            input.dispatchEvent(typed);

            expect(matchesShortcut(typed, "/", false)).toBe(false);
            expect(matchesShortcut(new KeyboardEvent("keydown", { key: "/" }), "/", false)).toBe(true);
            input.remove();
        });
    });

    it("exposes the query as a writable signal to its host", async () => {
        const fixture = setup(StaticHostComponent);
        const query: WritableSignal<string> = fixture.componentInstance.query;

        query.set("cafe");
        await fixture.whenStable();

        expect(field(fixture).value).toBe("cafe");
        expect(shownItems(fixture)).toEqual(["Café theme"]);
    });
});
