import { serializeKeyPart } from "../animation/animation-identity";
import { resolveValue } from "./chart-value-resolver";
import type { ChartField } from "../../models/chart.models";

export function deriveRadialDatumId(
    datum: unknown,
    categoryValue: unknown,
    explicitKeyValue: unknown,
    dataIndex: number
): string {
    if (explicitKeyValue !== undefined && explicitKeyValue !== null) {
        const keyPart = serializeKeyPart(explicitKeyValue);
        if (keyPart !== null) {
            return `${keyPart.type}:${String(keyPart.value)}`;
        }
    }

    if (categoryValue !== undefined && categoryValue !== null) {
        const catPart = serializeKeyPart(categoryValue);
        if (catPart !== null) {
            return `${catPart.type}:${String(catPart.value)}`;
        }
    }

    return `i:${dataIndex}`;
}

export function extractRadialDatumIds(
    data: readonly unknown[],
    categoryField: ChartField,
    keyField?: ChartField
): readonly string[] {
    const ids: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const cat = resolveValue(row, categoryField, i);
        const key = keyField ? resolveValue(row, keyField, i) : undefined;
        const id = deriveRadialDatumId(row, cat, key, i);
        if (!seen.has(id)) {
            seen.add(id);
            ids.push(id);
        }
    }

    return ids;
}
