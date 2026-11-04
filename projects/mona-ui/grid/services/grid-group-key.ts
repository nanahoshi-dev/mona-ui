import type { Row } from "../models/Row";

/** Rows that share one group value at one grouping level. */
export interface GridRowGroup {
    readonly rows: Row[];
    /** The key segment of the value: typed, so `1` and `"1"` are different groups. */
    readonly token: string;
    /** The value of the first row in the group, used for display. */
    readonly value: unknown;
}

const objectIds = new WeakMap<object, number>();
const symbolIds = new Map<symbol, number>();
let nextReferenceId = 0;

/**
 * Escapes `%`, `/` and `:` so a field or a string value can't be mistaken for the key's separators.
 */
export function escapeGroupKeyPart(text: string): string {
    return text.replace(/[%/:]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Turns a group value into a key segment. `null`, `undefined`, `""`, `NaN` and invalid dates form one empty
 * group; dates group by their time; other objects and symbols by identity.
 */
export function getGroupValueToken(value: unknown): string {
    if (value == null || value === "") {
        return "e:";
    }
    switch (typeof value) {
        case "string":
            return `s:${escapeGroupKeyPart(value)}`;
        case "number":
            return Number.isNaN(value) ? "e:" : `n:${String(value)}`;
        case "bigint":
            return `n:${value.toString()}`;
        case "boolean":
            return `b:${String(value)}`;
        case "symbol":
            return `y:${getSymbolId(value)}`;
        default:
            if (value instanceof Date) {
                const time = value.getTime();
                return Number.isNaN(time) ? "e:" : `d:${time}`;
            }
            return `o:${getObjectId(value)}`;
    }
}

/**
 * Builds a hierarchical group key, for example `country:s:NL/city:s:Delft`.
 */
export function buildGroupKey(parentKey: string | null, field: string, value: unknown): string {
    const segment = `${escapeGroupKeyPart(field)}:${getGroupValueToken(value)}`;
    return parentKey != null ? `${parentKey}/${segment}` : segment;
}

/**
 * Whether a group key has a level grouped by `field` (not a field whose name merely contains it).
 */
export function groupKeyHasField(groupKey: string, field: string): boolean {
    const prefix = `${escapeGroupKeyPart(field)}:`;
    return groupKey.split("/").some(segment => segment.startsWith(prefix));
}

/**
 * Buckets rows by the value of `field`, in the order the values first appear.
 */
export function groupRowsByField(rows: Iterable<Row>, field: string): GridRowGroup[] {
    const groups = new Map<string, { rows: Row[]; token: string; value: unknown }>();
    for (const row of rows) {
        const value = row.data[field];
        const token = getGroupValueToken(value);
        const group = groups.get(token);
        if (group == null) {
            groups.set(token, { rows: [row], token, value });
        } else {
            group.rows.push(row);
        }
    }
    return [...groups.values()];
}

function getObjectId(value: object): number {
    let id = objectIds.get(value);
    if (id == null) {
        id = ++nextReferenceId;
        objectIds.set(value, id);
    }
    return id;
}

function getSymbolId(value: symbol): number {
    let id = symbolIds.get(value);
    if (id == null) {
        id = ++nextReferenceId;
        symbolIds.set(value, id);
    }
    return id;
}
