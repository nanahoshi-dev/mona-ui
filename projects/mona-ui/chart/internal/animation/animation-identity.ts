import type { ChartField } from "../../models/chart.models";
import { resolveValue } from "../data/chart-value-resolver";

export type ChartAnimationMarkKey = string;

const warnedDuplicateKeyFields = new Set<string>();

export function serializeKeyPart(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : String(value.getTime());
    }
    return null;
}

export class ChartMarkKeyResolver {
    readonly #occurrenceTracker = new Map<string, number>();
    readonly #seriesId: string;
    readonly #keyField?: ChartField;

    public constructor(seriesId: string, keyField?: ChartField) {
        this.#seriesId = seriesId;
        this.#keyField = keyField;
    }

    public resolveKey(datum: unknown, naturalKey: unknown, dataIndex: number): ChartAnimationMarkKey {
        let baseKey: string | null = null;
        let isExplicit = false;

        if (this.#keyField) {
            const explicitVal = resolveValue(datum, this.#keyField, dataIndex);
            baseKey = serializeKeyPart(explicitVal);
            if (baseKey !== null) {
                isExplicit = true;
            }
        }

        if (baseKey === null) {
            baseKey = serializeKeyPart(naturalKey);
        }

        if (baseKey === null) {
            baseKey = String(dataIndex);
        }

        const rawPrefixedKey = `${this.#seriesId}:${baseKey}`;
        const count = this.#occurrenceTracker.get(rawPrefixedKey) ?? 0;
        this.#occurrenceTracker.set(rawPrefixedKey, count + 1);

        if (count > 0) {
            if (isExplicit && typeof ngDevMode !== "undefined" && ngDevMode) {
                const warningId = `${this.#seriesId}:${baseKey}`;
                if (!warnedDuplicateKeyFields.has(warningId)) {
                    warnedDuplicateKeyFields.add(warningId);
                    // eslint-disable-next-line no-console
                    console.warn(
                        `[Mona Chart] Duplicate explicit keyField value "${baseKey}" encountered in series "${this.#seriesId}". Suffixing occurrence to maintain unique identity.`
                    );
                }
            }
            return `${rawPrefixedKey}:${count}`;
        }

        return rawPrefixedKey;
    }
}
