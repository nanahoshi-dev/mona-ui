import { TestBed } from "@angular/core/testing";

import { ListItem } from "../models/ListItem";
import { ListService } from "./list.service";

interface Product {
    readonly id: number;
    readonly name: string;
    readonly price?: number | null;
    readonly inStock?: boolean;
}

const PRODUCTS: readonly Product[] = [
    { id: 1, name: "Keyboard" },
    { id: 2, name: "Mouse" },
    { id: 3, name: "Monitor" }
];

describe("ListService", () => {
    let service: ListService<Product>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ListService]
        });
        service = TestBed.inject(ListService);
        service.setData(PRODUCTS);
        service.setSelectableOptions({ enabled: true, mode: "single" });
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getDataItemValue", () => {
        it("returns the data item when no valueField is set", () => {
            expect(service.getDataItemValue(PRODUCTS[0])).toBe(PRODUCTS[0]);
        });

        it("returns the property value for a string valueField", () => {
            service.setValueField("id");
            expect(service.getDataItemValue(PRODUCTS[1])).toBe(2);
        });

        it("returns the accessor result for a function valueField", () => {
            service.setValueField(item => item.name.toUpperCase());
            expect(service.getDataItemValue(PRODUCTS[1])).toBe("MOUSE");
        });

        it("preserves numeric zero", () => {
            service.setData([{ id: 0, name: "Zero" }, ...PRODUCTS]);
            service.setValueField("id");
            expect(service.getDataItemValue({ id: 0, name: "Zero" })).toBe(0);
        });

        it("preserves false", () => {
            service.setData([{ id: 1, name: "Keyboard", inStock: false }, ...PRODUCTS.slice(1)]);
            service.setValueField("inStock");
            expect(service.getDataItemValue({ id: 1, name: "Keyboard", inStock: false })).toBe(false);
        });

        it("preserves an empty string", () => {
            service.setData([{ id: 1, name: "" }, ...PRODUCTS.slice(1)]);
            service.setValueField("name");
            expect(service.getDataItemValue({ id: 1, name: "" })).toBe("");
        });

        it("falls back to the data item when the property value is nullish", () => {
            service.setValueField("price");
            expect(service.getDataItemValue({ id: 1, name: "Keyboard", price: null })).toEqual({
                id: 1,
                name: "Keyboard",
                price: null
            });
        });
    });

    describe("selection synchronization", () => {
        it("setSelectedDataItems resolves item keys through valueField", () => {
            service.setValueField("id");
            service.setSelectedDataItems([PRODUCTS[0], PRODUCTS[2]]);
            expect(service.selectedKeys().toArray()).toEqual([1, 3]);
            expect(service.selectedListItems().select(i => i.data.name).toArray()).toEqual([
                "Keyboard",
                "Monitor"
            ]);
        });

        it("setSelectedKeys stores already resolved keys directly", () => {
            service.setValueField("id");
            service.setSelectedKeys([2]);
            expect(service.selectedKeys().toArray()).toEqual([2]);
            expect(service.selectedListItems().firstOrDefault()?.data.name).toBe("Mouse");
        });

        it("setSelectedDataItems without valueField stores the data items themselves as keys", () => {
            service.setSelectedDataItems([PRODUCTS[1]]);
            expect(service.selectedKeys().toArray()).toEqual([PRODUCTS[1]]);
        });

        it("selection survives replacement with new object instances that share the same key", () => {
            service.setValueField("id");
            service.setSelectedKeys([1, 3]);
            const replacements: readonly Product[] = [
                { id: 1, name: "Keyboard v2" },
                { id: 2, name: "Mouse v2" },
                { id: 3, name: "Monitor v2" }
            ];
            service.setData(replacements);
            const selectedNames = service.selectedListItems().select(i => i.data.name).toArray();
            expect(selectedNames).toEqual(["Keyboard v2", "Monitor v2"]);
        });

        it("selected keys set before data arrives resolve after data is loaded", () => {
            service.setData([]);
            service.setValueField("id");
            service.setSelectedKeys([2]);
            expect(service.selectedListItems().isEmpty()).toBe(true);
            service.setData(PRODUCTS);
            expect(service.selectedListItems().firstOrDefault()?.data.name).toBe("Mouse");
        });

        it("keeps unmatched selected keys while data is loading", () => {
            service.setData([]);
            service.setValueField("id");
            service.setSelectedKeys([99]);
            service.setData(PRODUCTS);
            expect(service.selectedKeys().toArray()).toEqual([99]);
            expect(service.selectedListItems().isEmpty()).toBe(true);
        });
    });

    describe("getItemText", () => {
        it("converts non-string field values to strings", () => {
            service.setTextField("price");
            const item = new ListItem<Product>({ data: { id: 9, name: "Cable", price: 0 } });
            expect(service.getItemText(item)).toBe("0");
        });

        it("returns an empty string for nullish field values", () => {
            service.setTextField("price");
            const item = new ListItem<Product>({ data: { id: 9, name: "Cable", price: null } });
            expect(service.getItemText(item)).toBe("");
        });

        it("does not throw when filtering a numeric text field", () => {
            service.setTextField("id");
            service.setFilter("2");
            expect(service.viewItems().select(i => i.data.id).toArray()).toEqual([2]);
        });
    });

    describe("getMatchingFilteredItem", () => {
        const FRUITS: readonly Product[] = [
            { id: 1, name: "Pineapple" },
            { id: 2, name: "Apple" },
            { id: 3, name: "Apricot", inStock: false }
        ];

        beforeEach(() => {
            service.setData(FRUITS);
            service.setTextField("name");
        });

        it("prefers a case-insensitive exact match by default", () => {
            expect(service.getMatchingFilteredItem("apple")?.data.name).toBe("Apple");
        });

        it("only accepts exact matches with the same case when caseSensitive is on", () => {
            service.setFilterableOptions({ enabled: true, caseSensitive: true, operator: "startsWith" });
            expect(service.getMatchingFilteredItem("APPLE")).toBeNull();
            expect(service.getMatchingFilteredItem("Apple")?.data.name).toBe("Apple");
        });

        it("falls back to the first filter match", () => {
            service.setFilterableOptions({ enabled: true, operator: "contains" });
            expect(service.getMatchingFilteredItem("appl")?.data.name).toBe("Pineapple");
        });

        it("never resolves to a disabled item", () => {
            service.setDisabledBy(p => p.inStock === false);
            expect(service.getMatchingFilteredItem("apricot")).toBeNull();
        });
    });

    describe("typeahead", () => {
        beforeEach(() => service.setTextField("name"));

        it("skips disabled items", () => {
            service.setDisabledBy(p => p.id === 3);
            expect(service.cycleThroughMatchedItems("m")?.data.name).toBe("Mouse");
            service.highlightedItem.set(service.cycleThroughMatchedItems("m"));
            expect(service.cycleThroughMatchedItems("m")?.data.name).toBe("Mouse");
        });

        it("never matches group headers", () => {
            const strings = TestBed.inject(ListService) as unknown as ListService<string>;
            strings.setTextField("");
            strings.setData(["Mango", "Melon"]);
            strings.setGroupBy(item => item.charAt(0));
            strings.setGroupableOptions({ enabled: true, headerOrder: "asc" });
            const matched = strings.cycleThroughMatchedItems("m");
            expect(matched?.isHeader).toBe(false);
            expect(matched?.data).toBe("Mango");
        });
    });

    describe("grouping", () => {
        it("keeps a header row for groups whose key is empty", () => {
            service.setGroupBy("missing");
            service.setGroupableOptions({ enabled: true, headerOrder: "asc" });
            const items = service.viewItems().toArray();
            expect(items[0].isHeader).toBe(true);
            expect(items.slice(1).every(i => !i.isHeader)).toBe(true);
            expect(service.isDisabled(items[0])).toBe(false);
        });
    });
});
