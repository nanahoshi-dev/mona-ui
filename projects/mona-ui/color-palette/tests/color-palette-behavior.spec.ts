import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import type { ColorPaletteItem, PaletteType } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import { ColorPaletteComponent } from "../components/color-palette/color-palette.component";
import { colorPaletteItemThemeVariants } from "../styles/color-palette.styles";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function press(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    target.dispatchEvent(event);
    return event;
}

@Component({
    template: `
        <button type="button" id="before">Before</button>
        <mona-color-palette
            aria-label="Fill"
            [clearable]="clearable()"
            [columns]="columns()"
            [palette]="palette()"
            [required]="required()"
            [readonly]="isReadonly()"
            [(value)]="value"
            (colorSelect)="selected.push($event)"
            (touch)="touches = touches + 1" />
        <button type="button" id="after">After</button>
    `,
    imports: [ColorPaletteComponent]
})
class HostComponent {
    public readonly clearable = signal(true);
    public readonly columns = signal(3);
    public readonly isReadonly = signal(false);
    public readonly palette = signal<PaletteType | Iterable<string | ColorPaletteItem>>([
        "#111111",
        "#222222",
        "#333333",
        "#444444",
        "#555555",
        "#666666",
        "#777777"
    ]);
    public readonly required = signal(false);
    public readonly selected: string[] = [];
    public readonly value = signal<string | null>(null);
    public touches = 0;
}

@Component({
    template: `
        <mona-label text="Fill">
            <mona-color-palette [palette]="palette" />
        </mona-label>
    `,
    imports: [ColorPaletteComponent, LabelComponent]
})
class WrappedHostComponent {
    protected readonly palette = ["#111111", "#222222"];
}

describe("color palette behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    function tiles(): HTMLElement[] {
        return [...fixture.nativeElement.querySelectorAll("[data-color-index]")];
    }

    function tabStops(): number[] {
        return tiles()
            .map((tile, index) => (tile.getAttribute("tabindex") === "0" ? index : -1))
            .filter(index => index !== -1);
    }

    function selectedTiles(): number[] {
        return tiles()
            .map((tile, index) => (tile.getAttribute("aria-selected") === "true" ? index : -1))
            .filter(index => index !== -1);
    }

    function gridColumns(): string {
        return fixture.nativeElement.querySelector("mona-color-palette").style.gridTemplateColumns;
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
    });

    describe("columns", () => {
        it.each([
            [0, 1],
            [-1, 1],
            [Number.NaN, 1],
            [2.7, 2],
            [3, 3],
            [100, 7]
        ])("with %d lays out %i columns and keeps every tile", async (columns, expected) => {
            host.columns.set(columns);
            await settle(fixture);

            expect(gridColumns()).toContain(`repeat(${expected},`);
            expect(tiles()).toHaveLength(7);
        });
    });

    describe("names", () => {
        it("reads a named item's name and color, and shows the same as a tooltip", async () => {
            host.palette.set([{ color: "#1A73E8", name: "Brand blue" }, "#222222"]);
            await settle(fixture);

            expect(tiles()[0].getAttribute("aria-label")).toBe("Brand blue, #1A73E8");
            expect(tiles()[0].getAttribute("title")).toBe("Brand blue, #1A73E8");
            expect(tiles()[0].style.backgroundColor).toBe("rgb(26, 115, 232)");
        });

        it("reads a plain color, and an item with no name, by its value", async () => {
            host.palette.set(["#222222", { color: "#333333" }, { color: "#444444", name: "" }]);
            await settle(fixture);

            expect(tiles().map(tile => tile.getAttribute("aria-label"))).toEqual([
                "Color #222222",
                "Color #333333",
                "Color #444444"
            ]);
            expect(tiles()[0].getAttribute("title")).toBe("Color #222222");
        });

        it("writes the color of a named item, not the item", async () => {
            host.palette.set([{ color: "#1A73E8", name: "Brand blue" }]);
            await settle(fixture);

            tiles()[0].click();

            expect(host.value()).toBe("#1A73E8");
        });

        it("follows the locale", async () => {
            host.palette.set([{ color: "#1A73E8", name: "Marka" }]);
            TestBed.inject(MonaI18nService).use({
                direction: "ltr",
                id: "tr-TR",
                messages: { colorPalette: { namedColor: (name: string, color: string) => `${name} / ${color}` } }
            });
            await settle(fixture);

            expect(tiles()[0].getAttribute("aria-label")).toBe("Marka / #1A73E8");
        });

        it("renders a generator, which can only be read once", async () => {
            function* colors(): Generator<string> {
                yield "#111111";
                yield "#222222";
            }
            host.palette.set(colors());
            await settle(fixture);

            expect(tiles()).toHaveLength(2);
            expect(gridColumns()).toContain("repeat(2,");
        });
    });

    describe("tab stop", () => {
        it("sits on the selected tile before anything gets focus", async () => {
            host.value.set("#555555");
            await settle(fixture);

            expect(tabStops()).toEqual([4]);
        });

        it("sits on the first tile with no selection, or one outside the palette", async () => {
            expect(tabStops()).toEqual([0]);

            host.value.set("#abcabc");
            await settle(fixture);

            expect(tabStops()).toEqual([0]);
        });

        it("survives a palette that shrinks", async () => {
            tiles()[5].focus();
            await settle(fixture);

            host.palette.set(["#111111", "#222222"]);
            await settle(fixture);

            expect(tabStops()).toEqual([1]);
        });

        it("follows the focused tile, and goes back to the selected one when focus leaves", async () => {
            host.value.set("#555555");
            await settle(fixture);

            tiles()[4].focus();
            press(tiles()[4], "ArrowRight");
            await settle(fixture);
            expect(tabStops()).toEqual([5]);
            expect(document.activeElement).toBe(tiles()[5]);

            (fixture.nativeElement.querySelector("#after") as HTMLElement).focus();
            await settle(fixture);
            expect(tabStops()).toEqual([4]);
        });

        it("doesn't reset while focus moves between tiles", async () => {
            tiles()[1].focus();
            tiles()[2].focus();
            await settle(fixture);

            expect(tabStops()).toEqual([2]);
            expect(host.touches).toBe(0);
        });
    });

    describe("selection", () => {
        it.each([
            ["#abcdef", "#ABCDEF"],
            ["#ABCDEF", "#abcdef"],
            ["#fff", "#FFFFFF"],
            ["rgb(255, 255, 255)", "#FFFFFF"],
            ["  #ABCDEF ", "#ABCDEF"]
        ])("finds %s on a tile holding %s", async (value, color) => {
            host.palette.set(["#000000", color]);
            host.value.set(value);
            await settle(fixture);

            expect(selectedTiles()).toEqual([1]);
            expect(tiles()[1].getAttribute("data-selected")).toBe("true");
        });

        it("marks only the first of a repeated color", async () => {
            host.palette.set(["#111111", "#222222", "#222222"]);
            host.value.set("#222222");
            await settle(fixture);

            expect(selectedTiles()).toEqual([1]);
        });

        it("clears from the tile matching another spelling of the value", async () => {
            host.palette.set(["#ABCDEF"]);
            host.value.set("#abcdef");
            await settle(fixture);

            tiles()[0].click();

            expect(host.value()).toBeNull();
        });

        it("doesn't confuse a color's alpha for the same color", async () => {
            host.palette.set(["#336699"]);
            host.value.set("#33669980");
            await settle(fixture);

            expect(selectedTiles()).toEqual([]);
        });
    });

    describe("activating the selected tile", () => {
        beforeEach(async () => {
            host.value.set("#222222");
            await settle(fixture);
        });

        it("clears by default", () => {
            tiles()[1].click();

            expect(host.value()).toBeNull();
        });

        it("keeps the value when not clearable", async () => {
            host.clearable.set(false);
            await settle(fixture);

            tiles()[1].click();

            expect(host.value()).toBe("#222222");
        });

        it("keeps the value when required", async () => {
            host.required.set(true);
            await settle(fixture);

            tiles()[1].click();

            expect(host.value()).toBe("#222222");
        });

        it("still selects another tile when not clearable", async () => {
            host.clearable.set(false);
            await settle(fixture);

            tiles()[0].click();

            expect(host.value()).toBe("#111111");
        });

        it("reports each activation, even without a change", async () => {
            host.clearable.set(false);
            await settle(fixture);

            tiles()[1].click();
            press(tiles()[1], "Enter");

            expect(host.selected).toEqual(["#222222", "#222222"]);
        });

        it("reports nothing when read-only", async () => {
            host.isReadonly.set(true);
            await settle(fixture);

            tiles()[1].click();
            press(tiles()[0], "Enter");

            expect(host.selected).toEqual([]);
            expect(host.value()).toBe("#222222");
        });
    });

    describe("keyboard", () => {
        async function focusedAfter(from: number, key: string, init?: KeyboardEventInit): Promise<number> {
            tiles()[from].focus();
            press(tiles()[from], key, init);
            await settle(fixture);
            return tiles().indexOf(document.activeElement as HTMLElement);
        }

        it.each([
            [1, "ArrowUp", {}, 1],
            [4, "ArrowUp", {}, 1],
            [4, "ArrowDown", {}, 4],
            [3, "ArrowDown", {}, 6],
            [6, "ArrowDown", {}, 6],
            [5, "Home", {}, 3],
            [3, "End", {}, 5],
            [6, "End", {}, 6],
            [5, "Home", { ctrlKey: true }, 0],
            [1, "End", { ctrlKey: true }, 6],
            [0, "ArrowLeft", {}, 0],
            [2, "ArrowRight", {}, 3],
            [6, "ArrowRight", {}, 6]
        ])("from tile %i, %s %j goes to tile %i", async (from, key, init, expected) => {
            expect(await focusedAfter(from, key, init)).toBe(expected);
        });

        it("End stops at the last tile of a short row", async () => {
            host.palette.set(["#111111", "#222222", "#333333", "#444444", "#555555"]);
            await settle(fixture);

            expect(await focusedAfter(3, "End")).toBe(4);
        });

        it("consumes a key at the edge, so the page doesn't scroll", () => {
            tiles()[0].focus();

            expect(press(tiles()[0], "ArrowUp").defaultPrevented).toBe(true);
        });

        it("selects once while a key is held", () => {
            press(tiles()[0], "Enter");
            press(tiles()[0], "Enter", { repeat: true });

            expect(host.value()).toBe("#111111");
        });

        it("leaves other keys alone", () => {
            tiles()[0].focus();

            expect(press(tiles()[0], "Escape").defaultPrevented).toBe(false);
            expect(press(tiles()[0], "Tab").defaultPrevented).toBe(false);
        });
    });

    describe("styles", () => {
        const classes = colorPaletteItemThemeVariants({ rounded: "none" });

        it("draws focus differently from selection, also on the selected tile", () => {
            expect(classes).toContain("focus-visible:shadow-[0_0_0_4px_rgb(0_0_0/0.9)]");
            expect(classes).not.toContain("data-[selected='true']:shadow");
            expect(classes).not.toContain("focus-visible:not-data-[selected='true']");
        });

        it("keeps the swatch in forced colors, and its motion optional", () => {
            expect(classes).toContain("forced-color-adjust-none");
            expect(classes).toContain("motion-reduce:transition-none");
        });

        it("defaults to a target of 24 pixels", () => {
            const palette: HTMLElement = fixture.nativeElement.querySelector("mona-color-palette");

            expect(palette.style.gridAutoRows).toBe("24px");
            expect(palette.style.gridTemplateColumns).toContain("minmax(24px, 1fr)");
        });
    });

    describe("name", () => {
        it("takes its name from a wrapping label", async () => {
            const wrapped = TestBed.createComponent(WrappedHostComponent);
            await settle(wrapped);
            const palette: HTMLElement = wrapped.nativeElement.querySelector("mona-color-palette");

            const caption = wrapped.nativeElement.querySelector(`[id="${palette.getAttribute("aria-labelledby")}"]`);

            expect(caption?.textContent).toContain("Fill");
            expect(palette.hasAttribute("aria-label")).toBe(false);
        });
    });

    it("has no axe violations with a selection and named items", async () => {
        host.palette.set([{ color: "#1A73E8", name: "Brand blue" }, "#222222"]);
        host.value.set("#1a73e8");
        await settle(fixture);

        const result = await axe.run(fixture.nativeElement, {
            rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
        });

        expect(result.violations.map(violation => violation.id)).toEqual([]);
    });
});
