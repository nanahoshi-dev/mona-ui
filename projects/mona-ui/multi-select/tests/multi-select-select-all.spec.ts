import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MultiSelectComponent } from "../components/multi-select/multi-select.component";

interface Language {
    readonly code: string;
    readonly name: string;
    readonly retired?: boolean;
}

@Component({
    imports: [DropdownFilterableDirective, MultiSelectComponent],
    template: `
        <mona-multi-select
            aria-label="Languages"
            monaDropDownFilterable
            textField="name"
            valueField="code"
            [valuePrimitive]="true"
            itemDisabled="retired"
            [showSelectAll]="showSelectAll()"
            [data]="data"
            [(value)]="value"></mona-multi-select>
    `
})
class HostComponent {
    public readonly data: Language[] = [
        { code: "de", name: "German" },
        { code: "en", name: "English" },
        { code: "eo", name: "Esperanto", retired: true },
        { code: "es", name: "Spanish" }
    ];
    public readonly showSelectAll = signal(true);
    public value: Iterable<string> = [];
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("MultiSelectComponent select all", () => {
    let fixture: ComponentFixture<HostComponent>;

    const host = (): HTMLElement => fixture.nativeElement.querySelector("mona-multi-select");
    const options = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>("[role='option']"));
    const selectAll = (): HTMLElement => options()[0];
    const checkbox = (): HTMLInputElement => selectAll().querySelector("input[type='checkbox']") as HTMLInputElement;
    const value = (): string[] => [...fixture.componentInstance.value].sort();
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
    const press = async (target: HTMLElement, key: string): Promise<void> => {
        target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
        await settle();
    };
    const filter = async (text: string): Promise<void> => {
        const input = document.querySelector(".cdk-overlay-container input") as HTMLInputElement;
        input.value = text;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await settle();
    };

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        await settle();
    });

    afterEach(() => {
        fixture.destroy();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("starts the list with a Select all option, counted among the options", async () => {
        await open();
        expect(selectAll().textContent?.trim()).toBe("Select all");
        expect(selectAll().getAttribute("aria-selected")).toBe("false");
        expect(selectAll().getAttribute("aria-posinset")).toBe("1");
        expect(selectAll().getAttribute("aria-setsize")).toBe("5");
        expect(checkbox()).not.toBeNull();
    });

    it("selects every enabled item when clicked, and deselects them when they're all selected", async () => {
        await open();
        selectAll().click();
        await settle();
        expect(value()).toEqual(["de", "en", "es"]);
        expect(selectAll().getAttribute("aria-selected")).toBe("true");
        expect(checkbox().checked).toBe(true);
        selectAll().click();
        await settle();
        expect(value()).toEqual([]);
    });

    it("shows a mixed checkbox while only some items are selected", async () => {
        fixture.componentInstance.value = ["en"];
        await settle();
        await open();
        expect(checkbox().indeterminate).toBe(true);
        expect(selectAll().getAttribute("aria-selected")).toBe("false");
        selectAll().click();
        await settle();
        expect(value()).toEqual(["de", "en", "es"]);
        expect(checkbox().indeterminate).toBe(false);
    });

    it("is the first option the arrow keys reach, and Enter toggles it", async () => {
        await open();
        await press(host(), "ArrowDown");
        expect(host().getAttribute("aria-activedescendant")).toBe(selectAll().id);
        await press(host(), "Enter");
        expect(value()).toEqual(["de", "en", "es"]);
        await press(host(), "ArrowDown");
        expect(host().getAttribute("aria-activedescendant")).toBe(options()[1].id);
    });

    it("acts on the items the filter leaves, keeping the others selected", async () => {
        fixture.componentInstance.value = ["de"];
        await settle();
        await open();
        await filter("sp");
        expect(options().map(option => option.textContent?.trim())).toEqual(["Select all", "Esperanto", "Spanish"]);
        selectAll().click();
        await settle();
        expect(value()).toEqual(["de", "es"]);
        selectAll().click();
        await settle();
        expect(value()).toEqual(["de"]);
    });

    it("isn't there when nothing could be selected, or when it's off", async () => {
        await open();
        await filter("Esperanto");
        expect(options().map(option => option.textContent?.trim())).toEqual(["Esperanto"]);
        await filter("");
        fixture.componentInstance.showSelectAll.set(false);
        await settle();
        expect(options().map(option => option.textContent?.trim())).toEqual([
            "German",
            "English",
            "Esperanto",
            "Spanish"
        ]);
    });

    it("passes axe with the list open", async () => {
        await open();
        const popup = document.querySelector(".cdk-overlay-container") as HTMLElement;
        const result = await axe.run(popup, { rules: { "color-contrast": { enabled: false } } });
        expect(result.violations).toEqual([]);
    });
});
