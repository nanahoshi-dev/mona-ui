import { Component, getDebugNode, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { DataType } from "@nanahoshi/mona-ui/common";
import type { CompositeFilterDescriptor } from "@nanahoshi/mona-ui/query";
import type { FilterMenuDateOptions } from "../../models/FilterMenuDateOptions";
import type { FilterMenuValue } from "../../models/FilterMenuValue";
import { FilterMenuComponent } from "./filter-menu.component";

@Component({
    imports: [FilterMenuComponent],
    template: `
        <mona-filter-menu
            field="price"
            [type]="type()"
            [dateOptions]="dateOptions()"
            [(value)]="value"
            (apply)="applied.push($event)"></mona-filter-menu>
    `
})
class HostComponent {
    public readonly applied: CompositeFilterDescriptor[] = [];
    public readonly dateOptions = signal<FilterMenuDateOptions>({ format: "yyyy-MM-dd" });
    public readonly type = signal<DataType>("number");
    public readonly value = signal<FilterMenuValue | undefined>(undefined);
}

describe("FilterMenuComponent with number, date and boolean fields", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let root: HTMLElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    async function useType(type: DataType): Promise<void> {
        host.type.set(type);
        await settle();
    }

    async function load(value: FilterMenuValue): Promise<void> {
        host.value.set(value);
        await settle();
    }

    function inputs(selector: string): HTMLInputElement[] {
        return Array.from(root.querySelectorAll<HTMLInputElement>(`${selector} input`));
    }

    function button(text: string): HTMLButtonElement {
        const match = Array.from(root.querySelectorAll("button")).find(b => b.textContent?.trim() === text);
        if (match == null) {
            throw new Error(`No button ${text}`);
        }
        return match;
    }

    async function typeText(input: HTMLInputElement, value: string): Promise<void> {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await settle();
    }

    /** Types into a date picker, which reads its text when it loses focus. */
    async function typeDate(input: HTMLInputElement, value: string): Promise<void> {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        await settle();
    }

    async function pressEnter(input: HTMLInputElement): Promise<void> {
        input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
        await settle();
    }

    /** Moves an operator list to its next operator, as ArrowDown does on the closed list. */
    async function nextOperator(index: 0 | 1): Promise<void> {
        const list = root.querySelectorAll("mona-dropdown-list")[index];
        list.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }));
        await settle();
    }

    function lastApplied(): CompositeFilterDescriptor {
        const applied = host.applied[host.applied.length - 1];
        if (applied == null) {
            throw new Error("Nothing was applied");
        }
        return applied;
    }

    function menu(): FilterMenuComponent {
        return getDebugNode(root.querySelector("mona-filter-menu"))?.componentInstance as FilterMenuComponent;
    }

    beforeEach(async () => {
        TestBed.configureTestingModule({});
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        await settle();
    });

    describe("number", () => {
        it("applies the number typed, and needs one", async () => {
            const [input] = inputs("mona-numeric-text-box");
            expect(button("Apply").disabled).toBe(true);

            await typeText(input, "5");
            expect(button("Apply").disabled).toBe(false);
            button("Apply").click();
            expect(lastApplied()).toEqual({ filters: [{ field: "price", operator: "eq", value: 5 }], logic: "and" });

            await typeText(input, "");
            expect(button("Apply").disabled).toBe(true);
        });

        it("applies on Enter in either number", async () => {
            await typeText(inputs("mona-numeric-text-box")[0], "2");
            button("OR").click();
            await settle();
            const second = inputs("mona-numeric-text-box")[1];
            await typeText(second, "8");

            await pressEnter(second);
            expect(lastApplied()).toEqual({
                filters: [
                    { field: "price", operator: "eq", value: 2 },
                    { field: "price", operator: "eq", value: 8 }
                ],
                logic: "or"
            });
        });

        it("applies two loaded conditions", async () => {
            await load({ logic: "and", operator1: "gte", operator2: "lte", value1: 1, value2: 9 });

            button("Apply").click();
            expect(lastApplied()).toEqual({
                filters: [
                    { field: "price", operator: "gte", value: 1 },
                    { field: "price", operator: "lte", value: 9 }
                ],
                logic: "and"
            });
        });

        it("leaves a loaded value that isn't a number empty", async () => {
            await load({ operator1: "eq", value1: "5" });
            expect(button("Apply").disabled).toBe(true);
            expect(menu().getFilterValues()).toEqual(expect.objectContaining({ operator1: "eq", value1: null }));
        });

        it("drops the second number when the connector is turned off", async () => {
            await load({ logic: "and", operator1: "gt", operator2: "lt", value1: 1, value2: 9 });
            button("AND").click();
            await settle();
            expect(inputs("mona-numeric-text-box")).toHaveLength(1);

            button("Apply").click();
            expect(lastApplied()).toEqual({ filters: [{ field: "price", operator: "gt", value: 1 }], logic: "and" });
            expect(menu().getFilterValues()).toEqual(
                expect.objectContaining({ logic: undefined, operator2: undefined, value2: null })
            );
        });

        it("applies a null check without a number, and disables the number", async () => {
            await load({ operator1: "isnull" });
            expect(inputs("mona-numeric-text-box")[0].disabled).toBe(true);

            button("Apply").click();
            expect(lastApplied()).toEqual({ filters: [{ field: "price", operator: "isnull" }], logic: "and" });
        });
    });

    describe("date", () => {
        beforeEach(async () => {
            await useType("date");
        });

        it("applies the date typed", async () => {
            const [input] = inputs("mona-date-picker");
            expect(button("Apply").disabled).toBe(true);

            await typeDate(input, "2026-01-15");
            expect(button("Apply").disabled).toBe(false);
            await pressEnter(input);

            expect(lastApplied()).toEqual({
                filters: [{ field: "price", operator: "eq", value: new Date(2026, 0, 15) }],
                logic: "and"
            });
        });

        it("applies a second date typed after a connector", async () => {
            await typeDate(inputs("mona-date-picker")[0], "2026-01-01");
            button("AND").click();
            await settle();
            await nextOperator(1);
            await typeDate(inputs("mona-date-picker")[1], "2026-12-31");

            button("Apply").click();
            expect(lastApplied()).toEqual({
                filters: [
                    { field: "price", operator: "eq", value: new Date(2026, 0, 1) },
                    { field: "price", operator: "neq", value: new Date(2026, 11, 31) }
                ],
                logic: "and"
            });
        });

        it("reads saved dates given as text or a time stamp", async () => {
            const stamp = new Date(2026, 5, 1).getTime();
            await load({ logic: "or", operator1: "gt", operator2: "lt", value1: "2026-01-15T00:00:00", value2: stamp });

            button("Apply").click();
            expect(lastApplied()).toEqual({
                filters: [
                    { field: "price", operator: "gt", value: new Date(2026, 0, 15) },
                    { field: "price", operator: "lt", value: new Date(stamp) }
                ],
                logic: "or"
            });
        });

        it("keeps a saved Date as it is", async () => {
            const date = new Date(2026, 2, 3);
            await load({ operator1: "lte", value1: date });
            expect(menu().getFilterValues().value1).toBe(date);
        });

        it("leaves a saved date it can't read empty", async () => {
            await load({ logic: "and", operator1: "eq", operator2: "eq", value1: "not a date", value2: true });
            expect(menu().getFilterValues()).toEqual(expect.objectContaining({ value1: null, value2: null }));
            expect(button("Apply").disabled).toBe(true);
        });

        it("drops the second date when the connector is turned off", async () => {
            await load({ logic: "or", operator1: "gt", operator2: "lt", value1: new Date(2026, 0, 1), value2: 0 });
            button("OR").click();
            await settle();

            button("Apply").click();
            expect(lastApplied().filters).toEqual([{ field: "price", operator: "gt", value: new Date(2026, 0, 1) }]);
            expect(menu().getFilterValues().value2).toBeNull();
        });

        it("applies a null check without a date", async () => {
            await load({ operator1: "isnotnull" });
            button("Apply").click();
            expect(lastApplied()).toEqual({ filters: [{ field: "price", operator: "isnotnull" }], logic: "and" });
        });
    });

    describe("boolean", () => {
        beforeEach(async () => {
            await useType("boolean");
        });

        it("shows no value input and applies the first operator straight away", () => {
            expect(root.querySelector("mona-text-box, mona-numeric-text-box, mona-date-picker")).toBeNull();
            expect(button("Apply").disabled).toBe(false);

            button("Apply").click();
            expect(lastApplied()).toEqual({ filters: [{ field: "price", operator: "istrue" }], logic: "and" });
        });

        it("combines two conditions picked from the lists", async () => {
            button("OR").click();
            await settle();
            await nextOperator(1);
            await nextOperator(1);

            button("Apply").click();
            expect(lastApplied()).toEqual({
                filters: [
                    { field: "price", operator: "istrue" },
                    { field: "price", operator: "isnull" }
                ],
                logic: "or"
            });
        });

        it("applies a loaded condition and reports the values it was given", async () => {
            await load({ operator1: "isfalse", value1: false });
            expect(menu().getFilterValues()).toEqual(expect.objectContaining({ operator1: "isfalse", value1: false }));

            button("Apply").click();
            expect(lastApplied()).toEqual({ filters: [{ field: "price", operator: "isfalse" }], logic: "and" });
        });

        it("drops the second condition when the connector is turned off", async () => {
            await load({ logic: "and", operator1: "istrue", operator2: "isnotnull", value1: "yes", value2: true });
            expect(menu().getFilterValues()).toEqual(expect.objectContaining({ value1: null, value2: true }));
            button("AND").click();
            await settle();

            button("Apply").click();
            expect(lastApplied()).toEqual({ filters: [{ field: "price", operator: "istrue" }], logic: "and" });
            expect(menu().getFilterValues().value2).toBeNull();
        });
    });

    it("clears every condition and applies an empty filter", async () => {
        await load({ logic: "and", operator1: "gt", operator2: "lt", value1: 1, value2: 9 });

        button("Clear").click();
        await settle();
        expect(lastApplied()).toEqual({ filters: [], logic: "and" });
        expect(inputs("mona-numeric-text-box")).toHaveLength(1);
        expect(button("Apply").disabled).toBe(true);
        expect(menu().getFilterValues()).toEqual({
            logic: undefined,
            operator1: "eq",
            operator2: undefined,
            value1: null,
            value2: null
        });
    });
});
