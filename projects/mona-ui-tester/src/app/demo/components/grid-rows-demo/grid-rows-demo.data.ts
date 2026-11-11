export interface RowsOrderLine {
    readonly product: string;
    readonly quantity: number;
    readonly unitPrice: number;
}

export interface RowsOrder {
    readonly contact: string;
    readonly customer: string;
    readonly freight: number;
    /** The contact's initials, for the avatar of the tall cells. */
    readonly initials: string;
    readonly lines: readonly RowsOrderLine[];
    readonly orderId: number;
    readonly shipped: boolean;
}

export type RowsDataSet = "few" | "orders";

const CUSTOMERS: readonly (readonly [string, string])[] = [
    ["Alfreds Futterkiste", "Maria Anders"],
    ["Bólido Comidas", "Martín Sommer"],
    ["Chop-suey Chinese", "Yang Wang"],
    ["Du monde entier", "Janine Labrune"],
    ["Ernst Handel", "Roland Mendel"],
    ["Folk och fä HB", "Maria Larsson"],
    ["Galería del gastrónomo", "Eduardo Saavedra"],
    ["Hanari Carnes", "Mario Pontes"]
];

const PRODUCTS: readonly (readonly [string, number])[] = [
    ["Chai", 18],
    ["Chang", 19],
    ["Aniseed Syrup", 10],
    ["Ikura", 31],
    ["Konbu", 6],
    ["Tofu", 23.25],
    ["Pavlova", 17.45]
];

/** The same orders on every run, so the playground and its tests see the same rows. */
export function rowsOrders(set: RowsDataSet): RowsOrder[] {
    const count = set === "orders" ? 40 : 5;
    return Array.from({ length: count }, (_, index) => {
        const [customer, contact] = CUSTOMERS[(index * 3) % CUSTOMERS.length];
        return {
            contact,
            customer,
            freight: 4.5 + ((index * 37) % 120) * 1.25,
            initials: contact
                .split(" ")
                .map(name => name[0])
                .join(""),
            lines: Array.from({ length: (index % 3) + 1 }, (_, line) => {
                const [product, unitPrice] = PRODUCTS[(index * 2 + line * 3) % PRODUCTS.length];
                return { product, quantity: ((index + line * 5) % 12) + 1, unitPrice };
            }),
            orderId: 10248 + index,
            shipped: index % 3 === 0
        };
    });
}
