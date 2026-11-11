export interface StateExportOrder {
    readonly city: string;
    readonly customer: string;
    readonly orderId: number;
    readonly product: string;
    readonly quantity: number;
    readonly shipped: boolean;
}

const CUSTOMERS = [
    "Antonio Moreno Taquería",
    "Blauer See Delikatessen",
    "Cactus Comidas para llevar",
    "Die Wandernde Kuh",
    "France restauration",
    "Gourmet Lanchonetes"
];

const CITIES = ["Berlin", "Buenos Aires", "Lyon", "México D.F.", "Campinas", "Stuttgart", "Mannheim"];

const PRODUCTS = ["Chai", "Chang", "Aniseed Syrup", "Ikura", "Konbu", "Tofu", "Pavlova", "Geitost", "Ipoh Coffee"];

/** How many orders the playground shows. */
export const STATE_EXPORT_ORDER_COUNT = 60;

/**
 * The same orders on every run. The first one has text that starts with `=` and `+`, which a spreadsheet would run as a
 * formula: the CSV export writes it with a leading `'` instead.
 */
export function stateExportOrders(): StateExportOrder[] {
    return Array.from({ length: STATE_EXPORT_ORDER_COUNT }, (_, index) =>
        index === 0
            ? {
                  city: "Reykjavík",
                  customer: "+Plus Partners",
                  orderId: 10248,
                  product: "=SUM(A1:A9)",
                  quantity: 12,
                  shipped: true
              }
            : {
                  city: CITIES[(index * 5) % CITIES.length],
                  customer: CUSTOMERS[(index * 7) % CUSTOMERS.length],
                  orderId: 10248 + index,
                  product: PRODUCTS[(index * 4) % PRODUCTS.length],
                  quantity: 1 + ((index * 13) % 40),
                  shipped: index % 4 !== 0
              }
    );
}
