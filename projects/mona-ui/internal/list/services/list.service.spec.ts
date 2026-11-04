import { TestBed } from "@angular/core/testing";

import { ListItem } from "../models/ListItem";
import { ListService } from "./list.service";

interface Product {
    readonly id: number;
    readonly inStock?: boolean;
    readonly name: string;
    readonly price?: number | null;
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
            expect(
                service
                    .selectedListItems()
                    .select(i => i.data.name)
                    .toArray()
            ).toEqual(["Keyboard", "Monitor"]);
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
            const selectedNames = service
                .selectedListItems()
                .select(i => i.data.name)
                .toArray();
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
            expect(
                service
                    .viewItems()
                    .select(i => i.data.id)
                    .toArray()
            ).toEqual([2]);
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

        it("keeps the active item while a longer buffer still matches it", () => {
            service.highlightedItem.set(service.cycleThroughMatchedItems("m"));
            expect(service.highlightedItem()?.data.name).toBe("Mouse");
            expect(service.cycleThroughMatchedItems("mo")?.data.name).toBe("Mouse");
            expect(service.cycleThroughMatchedItems("mon")?.data.name).toBe("Monitor");
            // A single character still moves on to the next match.
            expect(service.cycleThroughMatchedItems("m")?.data.name).toBe("Monitor");
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

    describe("item identity across data changes", () => {
        beforeEach(() => service.setValueField("id"));

        it("keeps the same item instance when the data object is unchanged", () => {
            const before = service.viewItems().toArray();
            service.setData([...PRODUCTS]);
            const after = service.viewItems().toArray();
            expect(after[0]).toBe(before[0]);
            expect(after[2]).toBe(before[2]);
        });

        it("keeps the uid when a new object with the same key arrives", () => {
            const before = service.viewItems().toArray();
            service.setData(PRODUCTS.map(p => ({ ...p, name: `${p.name}!` })));
            const after = service.viewItems().toArray();
            expect(after[1]).not.toBe(before[1]);
            expect(after[1].uid).toBe(before[1].uid);
            expect(after[1].data.name).toBe("Mouse!");
        });

        it("gives duplicate keys distinct uids", () => {
            service.setData([PRODUCTS[0], { ...PRODUCTS[0] }]);
            const [first, second] = service.viewItems().toArray();
            expect(first.uid).not.toBe(second.uid);
        });

        it("re-resolves the highlighted item after a refresh with fresh objects", () => {
            service.setNavigableOptions({ enabled: true, mode: "highlight" });
            const mouse = service.viewItems().elementAt(1);
            service.highlightedItem.set(mouse);
            service.setData(PRODUCTS.map(p => ({ ...p })));
            const highlighted = service.highlightedItem();
            expect(highlighted?.uid).toBe(mouse.uid);
            expect(service.viewItems().contains(highlighted as ListItem<Product>)).toBe(true);
            expect(service.navigate("next", "highlight", false)?.data.name).toBe("Monitor");
        });

        it("clears the highlight when the highlighted item is removed", () => {
            service.highlightedItem.set(service.viewItems().elementAt(1));
            service.setData([PRODUCTS[0], PRODUCTS[2]]);
            expect(service.highlightedItem()).toBeNull();
        });

        it("resolves selected keys to the refreshed items", () => {
            service.setSelectedKeys([2]);
            service.setData(PRODUCTS.map(p => ({ ...p })));
            const selected = service.selectedListItems().single();
            expect(selected.data.id).toBe(2);
            expect(service.viewItems().contains(selected)).toBe(true);
        });
    });

    describe("navigation", () => {
        beforeEach(() => {
            service.setTextField("name");
            service.setNavigableOptions({ enabled: true, mode: "highlight" });
        });

        it("moves to the first and last items with Home/End in multiple selection", () => {
            service.setSelectableOptions({ enabled: true, mode: "multiple" });
            service.highlightedItem.set(service.viewItems().elementAt(1));
            expect(service.navigate("last", "highlight", false)?.data.name).toBe("Monitor");
            expect(service.navigate("first", "highlight", false)?.data.name).toBe("Keyboard");
        });

        it("goes to the last item with End when nothing is selected or highlighted", () => {
            expect(service.navigate("last", "highlight", false)?.data.name).toBe("Monitor");
        });

        it("does not deselect the edge item with Home in toggleable select mode", () => {
            service.setSelectableOptions({ enabled: true, mode: "single", toggleable: true });
            service.setValueField("id");
            service.setSelectedKeys([1]);
            service.navigate("first", "select", false);
            expect(service.selectedKeys().toArray()).toEqual([1]);
        });

        it("restarts from the first item when the highlighted item was filtered out", () => {
            service.highlightedItem.set(service.viewItems().elementAt(0));
            service.setFilter("mo");
            expect(service.navigate("next", "highlight", false)?.data.name).toBe("Mouse");
        });
    });

    describe("selectAllItems", () => {
        it("selects every enabled item in multiple mode", () => {
            service.setValueField("id");
            service.setSelectableOptions({ enabled: true, mode: "multiple" });
            service.setDisabledBy(p => p.id === 2);
            expect(service.selectAllItems()).toBe(true);
            expect(service.selectedKeys().toArray().sort()).toEqual([1, 3]);
            expect(service.selectAllItems()).toBe(false);
        });

        it("does nothing in single mode", () => {
            expect(service.selectAllItems()).toBe(false);
            expect(service.selectedKeys().isEmpty()).toBe(true);
        });
    });

    describe("item positions", () => {
        it("reports the total across all pages for aria-setsize", () => {
            service.setPageableOptions({ ...service.pageableOptions(), enabled: true });
            service.pageState.set({ page: 1, skip: 0, take: 2 });
            const [first] = service.viewItems().toArray();
            expect(service.viewItems().size()).toBe(2);
            expect(service.getItemPosition(first)).toEqual({ position: 1, total: 3 });
        });

        it("links options to the uid of their group header", () => {
            service.setGroupBy(p => (p.id === 1 ? "Input" : "Output"));
            service.setGroupableOptions({ enabled: true, headerOrder: "asc" });
            const [inputHeader, keyboard, outputHeader, mouse] = service.viewItems().toArray();
            expect(service.getGroupHeaderUid(keyboard)).toBe(inputHeader.uid);
            expect(service.getGroupHeaderUid(mouse)).toBe(outputHeader.uid);
        });

        it("keeps group header uids stable between recomputations", () => {
            service.setGroupBy(p => (p.id === 1 ? "Input" : "Output"));
            service.setGroupableOptions({ enabled: true, headerOrder: "asc" });
            service.setTextField("name");
            const header = service.viewItems().first();
            service.setFilter("k");
            expect(service.viewItems().first().uid).toBe(header.uid);
        });
    });
});
