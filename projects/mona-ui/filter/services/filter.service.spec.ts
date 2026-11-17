import { TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { MONA_DE_DE_LOCALE } from "@nanahoshi/mona-ui/locales";

import { FilterService } from "./filter.service";

describe("FilterService", () => {
    let service: FilterService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [FilterService]
        });
        service = TestBed.inject(FilterService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("provides default English date filter operator labels", () => {
        const items = service.dateFilterMenuItems;
        expect(items.find(i => i.value === "gte")?.text).toBe("Is after or equal to");
        expect(items.find(i => i.value === "lte")?.text).toBe("Is before or equal to");
        expect(items.find(i => i.value === "gt")?.text).toBe("Is after");
        expect(items.find(i => i.value === "lt")?.text).toBe("Is before");
        expect(items.find(i => i.value === "eq")?.text).toBe("Is equal to");
        expect(items.find(i => i.value === "neq")?.text).toBe("Is not equal to");
    });

    it("provides localized German date filter operator labels", () => {
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use(MONA_DE_DE_LOCALE);

        const items = service.dateFilterMenuItems;
        expect(items.find(i => i.value === "gte")?.text).toBe("Ist am oder nach");
        expect(items.find(i => i.value === "lte")?.text).toBe("Ist am oder vor");
        expect(items.find(i => i.value === "gt")?.text).toBe("Ist nach");
        expect(items.find(i => i.value === "lt")?.text).toBe("Ist vor");
        expect(items.find(i => i.value === "eq")?.text).toBe("Ist gleich");
        expect(items.find(i => i.value === "neq")?.text).toBe("Ist ungleich");
    });

    describe("building boolean filters", () => {
        it("builds one condition joined by AND without a logic", () => {
            const descriptor = service.buildBooleanFilterDescriptor({
                field: "active",
                logic: null,
                operator1: "istrue",
                value1: true
            });
            expect(descriptor).toEqual({ filters: [{ field: "active", operator: "istrue" }], logic: "and" });
        });

        it("joins both conditions with the logic, without values", () => {
            const descriptor = service.buildBooleanFilterDescriptor({
                field: "active",
                logic: "or",
                operator1: "isfalse",
                operator2: "isnull",
                value1: false,
                value2: null
            });
            expect(descriptor).toEqual({
                filters: [
                    { field: "active", operator: "isfalse" },
                    { field: "active", operator: "isnull" }
                ],
                logic: "or"
            });
        });

        it("leaves out a condition whose operator isn't a boolean one", () => {
            expect(service.getBooleanDescriptor("eq" as never, "active")).toBeNull();
            expect(service.getBooleanDescriptor("isnotnull", "active")).toEqual({
                field: "active",
                operator: "isnotnull"
            });
        });
    });

    describe("building string and number filters", () => {
        it("keeps null and empty checks on text without a value", () => {
            expect(service.getStringDescriptor("isnull", "name", "ignored")).toEqual({
                field: "name",
                operator: "isnull"
            });
            expect(service.getStringDescriptor("isnotempty", "name", "ignored")).toEqual({
                field: "name",
                operator: "isnotempty"
            });
            expect(service.getStringDescriptor("isnullorempty", "name", "ignored")).toEqual({
                field: "name",
                operator: "isnullorempty"
            });
        });

        it("leaves out a number comparison with no number", () => {
            expect(service.getNumberDescriptor("gt", "price", null)).toBeNull();
            expect(service.getNumberDescriptor("isnotnull", "price", null)).toEqual({
                field: "price",
                operator: "isnotnull"
            });
        });
    });

    describe("building date filters", () => {
        const day = new Date(2026, 0, 15);

        it("keeps a condition with a date, and a null check without one", () => {
            const descriptor = service.buildDateFilterDescriptor({
                field: "due",
                logic: "or",
                operator1: "gte",
                operator2: "isnull",
                value1: day,
                value2: null
            });
            expect(descriptor).toEqual({
                filters: [
                    { field: "due", operator: "gte", value: day },
                    { field: "due", operator: "isnull" }
                ],
                logic: "or"
            });
        });

        it("leaves out a comparison with no date", () => {
            const descriptor = service.buildDateFilterDescriptor({
                field: "due",
                logic: "and",
                operator1: "eq",
                operator2: "lt",
                value1: null,
                value2: day
            });
            expect(descriptor).toEqual({ filters: [{ field: "due", operator: "lt", value: day }], logic: "and" });
        });

        it("builds one condition joined by AND without a logic", () => {
            const descriptor = service.buildDateFilterDescriptor({
                field: "due",
                logic: null,
                operator1: "lt",
                value1: day
            });
            expect(descriptor).toEqual({ filters: [{ field: "due", operator: "lt", value: day }], logic: "and" });
        });
    });
});
