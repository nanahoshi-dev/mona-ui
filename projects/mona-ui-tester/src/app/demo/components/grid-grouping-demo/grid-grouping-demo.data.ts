export interface GroupingOrder {
    readonly country: string;
    readonly customer: string;
    readonly freight: number;
    readonly orderId: number;
    readonly quantity: number;
    readonly shipped: boolean;
}

const CUSTOMERS = [
    "Alfreds Futterkiste",
    "Berglunds snabbköp",
    "Blondel père et fils",
    "Bólido Comidas",
    "Ernst Handel",
    "Folk och fä HB",
    "Königlich Essen",
    "Lehmanns Marktstand",
    "Que Delícia",
    "Wolski"
];

const COUNTRIES = ["Germany", "France", "Sweden", "Spain", "Brazil", "Poland"];

/** The same 120 orders on every run, so the playground and its tests see the same groups and totals. */
export function groupingOrders(): GroupingOrder[] {
    return Array.from({ length: 120 }, (_, index) => ({
        country: COUNTRIES[(index * 5) % COUNTRIES.length],
        customer: CUSTOMERS[(index * 7) % CUSTOMERS.length],
        freight: Math.round((2.5 + ((index * 29) % 150) * 1.63) * 100) / 100,
        orderId: 10248 + index,
        quantity: 1 + ((index * 13) % 40),
        shipped: index % 4 !== 1
    }));
}
