export interface EditingOrder {
    readonly customer: string;
    readonly freight: number;
    readonly orderId: number;
    readonly shipped: boolean;
}

export type EditingDataSet = "empty" | "orders";

const CUSTOMERS = [
    "Alfreds Futterkiste",
    "Bólido Comidas",
    "Chop-suey Chinese",
    "Du monde entier",
    "Ernst Handel",
    "Folk och fä HB",
    "Galería del gastrónomo",
    "Hanari Carnes"
];

/** The same orders on every run, so the playground and its tests see the same rows. */
export function editingOrders(set: EditingDataSet): EditingOrder[] {
    const count = set === "orders" ? 12 : 0;
    return Array.from({ length: count }, (_, index) => ({
        customer: CUSTOMERS[(index * 3) % CUSTOMERS.length],
        freight: 8.5 + ((index * 29) % 120) * 2.25,
        orderId: 10248 + index,
        shipped: index % 3 !== 0
    }));
}
