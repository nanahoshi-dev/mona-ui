import type { GridDataState } from "@nanahoshi/mona-ui/grid";
import { Query } from "@nanahoshi/mona-ui/query";

export interface ServerOrder {
    readonly customer: string;
    readonly freight: number;
    readonly orderId: number;
    readonly shipCountry: string;
}

export interface ServerPage {
    readonly data: readonly ServerOrder[];
    readonly total: number;
}

/** How many orders the mock server holds. */
export const SERVER_ORDER_COUNT = 137;

const CUSTOMERS = [
    "Alfreds Futterkiste",
    "Berglunds snabbköp",
    "Comércio Mineiro",
    "Drachenblut Delikatessen",
    "Eastern Connection",
    "Frankenversand",
    "Godos Cocina Típica",
    "Hungry Owl All-Night Grocers",
    "Isla Bonita Market",
    "Lonesome Pine Restaurant"
];

const COUNTRIES = ["Austria", "Brazil", "Canada", "Denmark", "France", "Germany", "Japan", "Mexico", "Sweden", "USA"];

/** The same orders on every run, starting at `start`, so the playground and its tests see the same rows. */
export function serverOrders(count: number, start = 0): ServerOrder[] {
    return Array.from({ length: count }, (_, offset) => {
        const index = start + offset;
        return {
            customer: CUSTOMERS[(index * 7) % CUSTOMERS.length],
            freight: Math.round((3.25 + ((index * 37) % 190) * 1.5) * 100) / 100,
            orderId: 10248 + index,
            shipCountry: COUNTRIES[(index * 3) % COUNTRIES.length]
        };
    });
}

const SERVER_ORDERS = serverOrders(SERVER_ORDER_COUNT);

/**
 * What the mock server does with a request: it filters and sorts all of its orders, then returns only the page. A real
 * server would do this in its database.
 */
export function queryServerPage(state: GridDataState): ServerPage {
    let query = Query.from(SERVER_ORDERS);
    for (const filter of state.filter) {
        query = query.filter(filter);
    }
    if (state.sort.length > 0) {
        query = query.sort([...state.sort]);
    }
    const result = query.run();
    return { data: result.slice(state.skip, state.skip + state.take), total: result.length };
}
