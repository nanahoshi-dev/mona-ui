export interface SelectionOrder {
    readonly customer: string;
    readonly freight: number;
    readonly orderId: number;
}

export type SelectionDataSet = "few" | "orders";

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
export function selectionOrders(set: SelectionDataSet): SelectionOrder[] {
    const count = set === "orders" ? 60 : 3;
    return Array.from({ length: count }, (_, index) => ({
        customer: CUSTOMERS[(index * 5) % CUSTOMERS.length],
        freight: 6.25 + ((index * 41) % 150) * 1.5,
        orderId: 10248 + index
    }));
}
