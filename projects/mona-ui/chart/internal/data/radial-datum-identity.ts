import { serializeKeyPart } from "../animation/animation-identity";
import { resolveValue } from "./chart-value-resolver";
import type { ChartField } from "../../models/chart.models";

export type RadialDatumIdentitySource = "category" | "index" | "key";

export function deriveRadialDatumId(
    _datum: unknown,
    categoryValue: unknown,
    explicitKeyValue: unknown,
    dataIndex: number
): string {
    if (explicitKeyValue !== undefined && explicitKeyValue !== null) {
        const keyPart = serializeKeyPart(explicitKeyValue);
        if (keyPart !== null) {
            return `k:${keyPart.type}:${String(keyPart.value)}`;
        }
    }

    if (categoryValue !== undefined && categoryValue !== null) {
        const catPart = serializeKeyPart(categoryValue);
        if (catPart !== null) {
            return `c:${catPart.type}:${String(catPart.value)}`;
        }
    }

    return `i:${dataIndex}`;
}

export function serializeRadialCategoryKey(categoryValue: unknown, fallbackIndex: number): string {
    if (categoryValue !== undefined && categoryValue !== null) {
        const part = serializeKeyPart(categoryValue);
        if (part !== null) {
            return `c:${part.type}:${String(part.value)}`;
        }
    }
    return `c:i:${fallbackIndex}`;
}

export function serializeRadialExplicitKey(explicitKeyValue: unknown): string | null {
    if (explicitKeyValue !== undefined && explicitKeyValue !== null) {
        const part = serializeKeyPart(explicitKeyValue);
        if (part !== null) {
            return `k:${part.type}:${String(part.value)}`;
        }
    }
    return null;
}

export interface RadialRetainedIdentity {
    readonly category: unknown;
    readonly categoryKey: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly explicitKey?: string;
    readonly itemId: string;
}

export function extractRadialDatumIdentities(
    data: readonly unknown[],
    categoryField: ChartField,
    keyField?: ChartField
): readonly RadialRetainedIdentity[] {
    const results: RadialRetainedIdentity[] = [];
    const seenCategories = new Set<string>();
    const seenCustomKeys = new Set<string>();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rawCat = resolveValue(row, categoryField, i);
        const catKey = serializeRadialCategoryKey(rawCat, i);

        if (seenCategories.has(catKey)) {
            continue;
        }

        const rawKey = keyField ? resolveValue(row, keyField, i) : undefined;
        const customKey = serializeRadialExplicitKey(rawKey);
        if (customKey !== null) {
            if (seenCustomKeys.has(customKey)) {
                continue;
            }
            seenCustomKeys.add(customKey);
        }

        seenCategories.add(catKey);
        const itemId = deriveRadialDatumId(row, rawCat, rawKey, i);

        results.push({
            category: rawCat ?? i,
            categoryKey: catKey,
            dataIndex: i,
            datum: row,
            explicitKey: customKey ?? undefined,
            itemId
        });
    }

    return results;
}

export function extractRadialDatumIds(
    data: readonly unknown[],
    categoryField: ChartField,
    keyField?: ChartField
): readonly string[] {
    return extractRadialDatumIdentities(data, categoryField, keyField).map(item => item.itemId);
}

export function extractRetainedRadialBarIdentities(
    data: readonly unknown[],
    categoryField: ChartField,
    seriesField: ChartField,
    keyField?: ChartField
): readonly RadialRetainedIdentity[] {
    const results: RadialRetainedIdentity[] = [];
    const seenCategories = new Set<string>();
    const seenCustomKeys = new Set<string>();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rawVal = resolveValue(row, seriesField, i);
        if (typeof rawVal !== "number" || !Number.isFinite(rawVal) || rawVal < 0) {
            continue;
        }

        const rawCat = resolveValue(row, categoryField, i);
        const catKey = serializeRadialCategoryKey(rawCat, i);

        if (seenCategories.has(catKey)) {
            continue;
        }

        const rawKey = keyField ? resolveValue(row, keyField, i) : undefined;
        const customKey = serializeRadialExplicitKey(rawKey);
        if (customKey !== null) {
            if (seenCustomKeys.has(customKey)) {
                continue;
            }
            seenCustomKeys.add(customKey);
        }

        seenCategories.add(catKey);
        const itemId = deriveRadialDatumId(row, rawCat, rawKey, i);

        results.push({
            category: rawCat ?? `Item ${i + 1}`,
            categoryKey: catKey,
            dataIndex: i,
            datum: row,
            explicitKey: customKey ?? undefined,
            itemId
        });
    }

    return results;
}

export function extractRetainedRoseIdentities(
    data: readonly unknown[],
    categoryField: ChartField,
    seriesField: ChartField,
    keyField?: ChartField
): readonly RadialRetainedIdentity[] {
    interface Slot {
        category: unknown;
        categoryKey: string;
        dataIndex: number;
        datum: unknown;
        explicitKey?: string;
        itemId: string;
        validDataIndex?: number;
        validDatum?: unknown;
    }

    const slots: Slot[] = [];
    const slotByKey = new Map<string, Slot>();
    const seenCustomKeys = new Set<string>();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rawCat = resolveValue(row, categoryField, i);
        const catKey = serializeRadialCategoryKey(rawCat, i);
        let slot = slotByKey.get(catKey);

        const rawKey = keyField ? resolveValue(row, keyField, i) : undefined;
        const customKey = serializeRadialExplicitKey(rawKey);

        if (!slot) {
            if (customKey !== null) {
                if (seenCustomKeys.has(customKey)) {
                    continue;
                }
                seenCustomKeys.add(customKey);
            }

            const itemId = deriveRadialDatumId(row, rawCat, rawKey, i);
            slot = {
                category: rawCat ?? `Item ${i + 1}`,
                categoryKey: catKey,
                dataIndex: i,
                datum: row,
                explicitKey: customKey ?? undefined,
                itemId
            };
            slots.push(slot);
            slotByKey.set(catKey, slot);
        }

        if (slot.validDatum === undefined) {
            const rawVal = resolveValue(row, seriesField, i);
            if (typeof rawVal === "number" && Number.isFinite(rawVal) && rawVal >= 0) {
                slot.validDatum = row;
                slot.validDataIndex = i;
            }
        }
    }

    return slots.map(s => ({
        category: s.category,
        categoryKey: s.categoryKey,
        dataIndex: s.validDataIndex !== undefined ? s.validDataIndex : s.dataIndex,
        datum: s.validDatum !== undefined ? s.validDatum : s.datum,
        explicitKey: s.explicitKey,
        itemId: s.itemId
    }));
}
