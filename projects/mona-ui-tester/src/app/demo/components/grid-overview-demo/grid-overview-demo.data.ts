export interface OverviewOrder {
    readonly customer: string;
    readonly freight: number;
    readonly orderDate: Date;
    readonly orderId: number;
    readonly shipped: boolean;
}

export type OverviewDataSet = "empty" | "few" | "orders";

const CUSTOMERS = [
    "Alfreds Futterkiste",
    "Bólido Comidas",
    "Chop-suey Chinese",
    "Du monde entier",
    "Ernst Handel",
    "Folk och fä HB",
    "Galería del gastrónomo",
    "Hanari Carnes",
    "Island Trading",
    "Königlich Essen"
];

/** The same orders on every run, so the playground and its tests see the same rows. */
export function overviewOrders(set: OverviewDataSet): OverviewOrder[] {
    const count = set === "orders" ? 120 : set === "few" ? 3 : 0;
    return Array.from({ length: count }, (_, index) => ({
        customer: CUSTOMERS[(index * 7) % CUSTOMERS.length],
        freight: 4.5 + ((index * 37) % 180) * 1.75,
        orderDate: new Date(2026, (index * 5) % 12, ((index * 11) % 27) + 1),
        orderId: 10248 + index,
        shipped: index % 3 !== 0
    }));
}
