import { Component, getDebugNode, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { DataType } from "@nanahoshi/mona-ui/common";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import type { CompositeFilterDescriptor, FilterDescriptor, FilterOperators } from "@nanahoshi/mona-ui/query";
import type { FilterMenuDateOptions } from "../../models/FilterMenuDateOptions";
import type { FilterMenuValue } from "../../models/FilterMenuValue";
import { FilterMenuComponent } from "./filter-menu.component";

@Component({
    imports: [FilterMenuComponent],
    template: `
        <mona-filter-menu
            field="name"
            [type]="type()"
            [operators]="operators()"
            [dateOptions]="dateOptions()"
            [(value)]="value"
            (apply)="applied.push($event)"></mona-filter-menu>
    `
})
class HostComponent {
    public readonly applied: CompositeFilterDescriptor[] = [];
    public readonly dateOptions = signal<FilterMenuDateOptions>({});
    public readonly operators = signal<FilterOperators[]>([]);
    public readonly type = signal<DataType>("string");
    public readonly value = signal<FilterMenuValue | undefined>(undefined);
}

describe("FilterMenuComponent behaviour", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let root: HTMLElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function valueInput(index = 0): HTMLInputElement {
        const input = root.querySelectorAll<HTMLInputElement>("mona-text-box input")[index];
        if (input == null) {
            throw new Error(`No value input ${index}`);
        }
        return input;
    }

    function button(text: string): HTMLButtonElement {
        const match = Array.from(root.querySelectorAll("button")).find(b => b.textContent?.trim() === text);
        if (match == null) {
            throw new Error(`No button ${text}`);
        }
        return match;
    }

    async function type(input: HTMLInputElement, value: string): Promise<void> {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await settle();
    }

    function lastFilter(): FilterDescriptor {
        return host.applied[host.applied.length - 1]?.filters[0] as FilterDescriptor;
    }

    beforeEach(async () => {
        // No FilterService provider: the menu brings its own.
        TestBed.configureTestingModule({});
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        await settle();
    });

    it("creates without a FilterService from its parent", () => {
        expect(root.querySelector("mona-filter-menu")).not.toBeNull();
    });

    it("starts at the first operator, and Apply is enabled once a value is typed", async () => {
        expect(button("Apply").disabled).toBe(true);
        await type(valueInput(), "ann");
        expect(button("Apply").disabled).toBe(false);

        button("Apply").click();
        expect(lastFilter()).toEqual(expect.objectContaining({ field: "name", operator: "contains", value: "ann" }));
    });

    it("starts at the first operator that `operators` allows, in its order", async () => {
        host.operators.set(["endswith", "contains"]);
        await settle();
        await type(valueInput(), "son");

        button("Apply").click();
        expect(lastFilter().operator).toBe("endswith");
    });

    it("starts the second condition at the first operator once a connector is chosen", async () => {
        await type(valueInput(), "a");
        button("OR").click();
        await settle();
        await type(valueInput(1), "b");

        button("Apply").click();
        const applied = host.applied[0];
        expect(applied.logic).toBe("or");
        expect(applied.filters.map(f => (f as FilterDescriptor).operator)).toEqual(["contains", "contains"]);
    });

    it("treats blank text as no value and trims what it applies", async () => {
        await type(valueInput(), "   ");
        expect(button("Apply").disabled).toBe(true);

        await type(valueInput(), "  ann ");
        button("Apply").click();
        expect(lastFilter()).toEqual(expect.objectContaining({ value: "ann" }));
    });

    it("applies on Enter in a value, but not while an IME is composing", async () => {
        await type(valueInput(), "ann");

        valueInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, isComposing: true, key: "Enter" }));
        expect(host.applied).toHaveLength(0);

        valueInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
        expect(host.applied).toHaveLength(1);
        expect(lastFilter()).toEqual(expect.objectContaining({ value: "ann" }));
    });

    it("does not apply on Enter while the condition is incomplete", async () => {
        valueInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
        expect(host.applied).toHaveLength(0);
    });

    it("clears when its value is set to undefined", async () => {
        host.value.set({ logic: "and", operator1: "startswith", operator2: "endswith", value1: "a", value2: "z" });
        await settle();
        expect(valueInput().value).toBe("a");
        expect(valueInput(1).value).toBe("z");

        host.value.set(undefined);
        await settle();
        expect(valueInput().value).toBe("");
        expect(root.querySelectorAll("mona-text-box input")).toHaveLength(1);
        expect(button("Apply").disabled).toBe(true);
    });

    it("names its operator, value and connector controls", async () => {
        expect(root.querySelector("[aria-label='Operator']")).not.toBeNull();
        expect(valueInput().getAttribute("aria-label")).toBe("Value");

        await type(valueInput(), "a");
        expect(root.querySelector("[aria-label='Combine conditions']")).not.toBeNull();
        button("AND").click();
        await settle();
        expect(root.querySelector("[aria-label='Second operator']")).not.toBeNull();
        expect(valueInput(1).getAttribute("aria-label")).toBe("Second value");
    });

    it("leaves the date format to the date picker's locale unless one is given", async () => {
        host.type.set("date");
        await settle();
        const picker = (): DatePickerComponent =>
            getDebugNode(root.querySelector("mona-date-picker"))?.componentInstance as DatePickerComponent;
        expect(picker().format()).toBeNull();

        host.dateOptions.set({ format: "yyyy-MM-dd" });
        await settle();
        expect(picker().format()).toBe("yyyy-MM-dd");
    });
});
