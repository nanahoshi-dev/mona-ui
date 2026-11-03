import { formatNumber } from "@nanahoshi/mona-ui/i18n";
import type { IcuElement } from "./icu-message-parser";

export type IcuValue = number | string | undefined;

/** The `select` key that an absent or empty argument selects, before falling back to `other`. */
export const ICU_ABSENT_SELECT_KEY = "undefined";

const pluralRulesCache = new Map<string, Intl.PluralRules>();

/**
 * Formats a parsed message. Numbers go through `formatNumber`, so they use the locale's digits and grouping, the
 * same as Mona's TypeScript catalogs.
 *
 * - An absent argument (`undefined`) formats as an empty string.
 * - In `select`, an absent or empty argument picks the `undefined` option, then `other`; a present value never
 *   picks `undefined`.
 * - In `plural`, an exact `=N` option wins over the value's plural category, which is taken after the offset.
 */
export function formatIcuMessage(
    elements: readonly IcuElement[],
    values: ReadonlyMap<string, IcuValue>,
    localeId: string
): string {
    return formatElements(elements, values, localeId, null);
}

function formatElements(
    elements: readonly IcuElement[],
    values: ReadonlyMap<string, IcuValue>,
    localeId: string,
    pound: number | null
): string {
    let result = "";
    for (const element of elements) {
        switch (element.kind) {
            case "literal":
                result += element.value;
                break;
            case "argument":
            case "number": {
                const value = values.get(element.name);
                result +=
                    typeof value === "number"
                        ? formatNumber(value, localeId, element.kind === "number" ? element.options : undefined)
                        : (value ?? "");
                break;
            }
            case "pound":
                result += pound == null ? "#" : formatNumber(pound, localeId);
                break;
            case "plural": {
                const value = Number(values.get(element.name));
                const exact = [...element.options].find(
                    ([key]) => key.startsWith("=") && Number(key.slice(1)) === value
                );
                const adjusted = value - element.offset;
                const option =
                    exact?.[1] ??
                    element.options.get(getPluralRules(localeId, element.ordinal).select(adjusted)) ??
                    element.options.get("other")!;
                result += formatElements(option, values, localeId, adjusted);
                break;
            }
            case "select": {
                const option = selectOption(element.options, values.get(element.name)) ?? element.options.get("other")!;
                result += formatElements(option, values, localeId, pound);
                break;
            }
        }
    }
    return result;
}

function getPluralRules(localeId: string, ordinal: boolean): Intl.PluralRules {
    const cacheKey = `${ordinal ? "ordinal" : "cardinal"}:${localeId}`;
    let rules = pluralRulesCache.get(cacheKey);
    if (rules == null) {
        rules = new Intl.PluralRules(localeId, { type: ordinal ? "ordinal" : "cardinal" });
        pluralRulesCache.set(cacheKey, rules);
    }
    return rules;
}

function selectOption(
    options: ReadonlyMap<string, readonly IcuElement[]>,
    value: IcuValue
): readonly IcuElement[] | undefined {
    if (value == null || value === "") {
        return options.get(ICU_ABSENT_SELECT_KEY);
    }
    const key = String(value);
    return key === ICU_ABSENT_SELECT_KEY ? undefined : options.get(key);
}
