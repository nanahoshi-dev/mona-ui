import { TestBed } from "@angular/core/testing";

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
});
