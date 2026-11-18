import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MultiSelectComponent } from "../components/multi-select/multi-select.component";

@Component({
    imports: [DropdownFilterableDirective, MultiSelectComponent],
    template: `
        @if (filterable()) {
            <mona-multi-select
                aria-label="Skills"
                monaDropDownFilterable
                [allowCustomValue]="allowCustomValue()"
                [data]="data()"
                [(value)]="value"
                (valueAdd)="add($event)"></mona-multi-select>
        } @else {
            <mona-multi-select
                aria-label="Skills"
                [allowCustomValue]="allowCustomValue()"
                [data]="data()"
                [(value)]="value"></mona-multi-select>
        }
    `
})
class HostComponent {
    public readonly added: string[] = [];
    public readonly allowCustomValue = signal(true);
    public readonly data = signal(["Angular", "Go", "TypeScript"]);
    public readonly filterable = signal(true);
    public value: Iterable<string> = ["Angular"];

    public add(text: string): void {
        this.added.push(text);
        this.data.update(data => [...data, text]);
        this.value = [...this.value, text];
    }
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("MultiSelectComponent custom values", () => {
    let fixture: ComponentFixture<HostComponent>;

    const host = (): HTMLElement => fixture.nativeElement.querySelector("mona-multi-select");
    const filterBox = (): HTMLInputElement =>
        document.querySelector(".cdk-overlay-container input") as HTMLInputElement;
    const tags = (): string[] =>
        Array.from(host().querySelectorAll("mona-chip")).map(chip => chip.textContent?.trim() ?? "");
    const settle = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(10);
        fixture.detectChanges();
    };
    const open = async (): Promise<void> => {
        host().click();
        await settle();
    };
    const type = async (text: string): Promise<void> => {
        filterBox().value = text;
        filterBox().dispatchEvent(new Event("input", { bubbles: true }));
        await settle();
    };
    const press = async (key: string): Promise<KeyboardEvent> => {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
        filterBox().dispatchEvent(event);
        await settle();
        return event;
    };

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        await settle();
    });

    afterEach(() => {
        fixture.destroy();
        document.querySelectorAll(".cdk-overlay-container").forEach(container => container.replaceChildren());
        vi.restoreAllMocks();
    });

    it("offers text that matches no item through valueAdd, and clears the filter box for the next", async () => {
        await open();
        await type("  Rust ");
        const event = await press("Enter");
        expect(event.defaultPrevented).toBe(true);
        expect(fixture.componentInstance.added).toEqual(["Rust"]);
        expect(tags()).toEqual(["Angular", "Rust"]);
        expect(filterBox().value).toBe("");
    });

    it("selects the item the text names instead, whatever its case", async () => {
        await open();
        await type("go");
        await press("Enter");
        expect(fixture.componentInstance.added).toEqual([]);
        expect(tags()).toEqual(["Angular", "Go"]);
    });

    it("keeps a named item that's already selected", async () => {
        await open();
        await type("Angular");
        await press("Enter");
        expect(tags()).toEqual(["Angular"]);
        expect(fixture.componentInstance.added).toEqual([]);
    });

    it("leaves an item reached with the arrow keys to the list", async () => {
        await open();
        await type("Type");
        await press("ArrowDown");
        await press("Enter");
        expect(fixture.componentInstance.added).toEqual([]);
        expect(tags()).toContain("TypeScript");
    });

    it("ignores empty text", async () => {
        await open();
        await type("   ");
        await press("Enter");
        expect(fixture.componentInstance.added).toEqual([]);
        expect(tags()).toEqual(["Angular"]);
    });

    it("adds nothing without allowCustomValue, and keeps the selection", async () => {
        fixture.componentInstance.allowCustomValue.set(false);
        await settle();
        await open();
        await type("Rust");
        await press("Enter");
        expect(fixture.componentInstance.added).toEqual([]);
        // Nothing is highlighted, so Enter has nothing to toggle.
        expect(tags()).toEqual(["Angular"]);
    });

    it("warns in development without a filter box to type in", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        fixture.componentInstance.filterable.set(false);
        await settle();
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining("allowCustomValue needs monaDropDownFilterable"),
            expect.anything()
        );
    });
});
