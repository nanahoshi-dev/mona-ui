export interface ColumnsOrder {
    readonly customer: string;
    readonly freight: number;
    readonly orderDate: Date;
    readonly orderId: number;
    readonly shipCity: string;
    readonly shipCountry: string;
}

export type ColumnsDataSet = "few" | "orders";

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

const DESTINATIONS: readonly (readonly [string, string])[] = [
    ["Berlin", "Germany"],
    ["Madrid", "Spain"],
    ["Bern", "Switzerland"],
    ["Nantes", "France"],
    ["Graz", "Austria"],
    ["Bräcke", "Sweden"],
    ["Barcelona", "Spain"],
    ["Rio de Janeiro", "Brazil"],
    ["Cowes", "United Kingdom"]
];

/** The same orders on every run, so the playground and its tests see the same rows. */
export function columnsOrders(set: ColumnsDataSet): ColumnsOrder[] {
    const count = set === "orders" ? 120 : 3;
    return Array.from({ length: count }, (_, index) => {
        const [shipCity, shipCountry] = DESTINATIONS[(index * 5) % DESTINATIONS.length];
        return {
            customer: CUSTOMERS[(index * 3) % CUSTOMERS.length],
            freight: 4.5 + ((index * 29) % 160) * 1.5,
            orderDate: new Date(2026, (index * 7) % 12, ((index * 13) % 27) + 1),
            orderId: 10248 + index,
            shipCity,
            shipCountry
        };
    });
}
