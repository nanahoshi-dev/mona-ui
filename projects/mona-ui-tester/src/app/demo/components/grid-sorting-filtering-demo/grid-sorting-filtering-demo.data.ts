export interface SortingFilteringOrder {
    readonly country: string | null;
    readonly customer: string;
    readonly freight: number | null;
    readonly orderDate: Date;
    readonly orderId: number;
}

const CUSTOMERS = [
    "Alfreds Futterkiste",
    "ana Trujillo",
    "Bólido Comidas",
    "bon app'",
    "Ernst Handel",
    "Émile Delacroix",
    "Folk och fä HB",
    "Königlich Essen",
    "Lehmanns Marktstand",
    "Océano Atlántico",
    "Que Delícia",
    "Wolski"
];

const COUNTRIES = ["Germany", "Mexico", "Spain", "France", "Sweden", "Brazil", "Austria", "Poland"];

/**
 * The same 150 orders on every run, so the playground and its tests see the same rows. Every eleventh order has no
 * country, every thirteenth no customer name and every seventeenth no freight, so filters on empty values find rows.
 */
export function sortingFilteringOrders(): SortingFilteringOrder[] {
    return Array.from({ length: 150 }, (_, index) => ({
        country: index % 11 === 5 ? null : COUNTRIES[(index * 3) % COUNTRIES.length],
        customer: index % 13 === 7 ? "" : CUSTOMERS[(index * 5) % CUSTOMERS.length],
        freight: index % 17 === 9 ? null : Math.round((3.25 + ((index * 41) % 160) * 1.37) * 100) / 100,
        orderDate: new Date(2026, (index * 7) % 12, ((index * 13) % 28) + 1),
        orderId: 10248 + index
    }));
}
