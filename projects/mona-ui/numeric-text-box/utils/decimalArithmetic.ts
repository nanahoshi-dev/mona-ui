/**
 * Exact arithmetic on canonical decimal strings (see `parseLocalizedDecimal`), using a `bigint` scaled by a power
 * of ten. Only what the decimal text box needs: adding a step and comparing against bounds.
 */

const DECIMAL_REGEX = /^(-)?(\d+)(?:\.(\d+))?$/;

/** Writes a number in plain decimal notation, never with an exponent. */
const PLAIN_NUMBER_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 100, useGrouping: false });

interface ScaledDecimal {
    readonly scale: number;
    readonly units: bigint;
}

function toScaled(value: string): ScaledDecimal {
    const match = DECIMAL_REGEX.exec(value);
    if (!match) {
        throw new Error(`"${value}" is not a decimal string.`);
    }
    const fraction = match[3] ?? "";
    const units = BigInt(match[2] + fraction);
    return { scale: fraction.length, units: match[1] ? -units : units };
}

function toCommonScale(a: ScaledDecimal, b: ScaledDecimal): [bigint, bigint, number] {
    const scale = Math.max(a.scale, b.scale);
    return [a.units * 10n ** BigInt(scale - a.scale), b.units * 10n ** BigInt(scale - b.scale), scale];
}

function fromScaled(units: bigint, scale: number): string {
    const negative = units < 0n;
    const digits = (negative ? -units : units).toString().padStart(scale + 1, "0");
    const integer = digits.slice(0, digits.length - scale);
    const fraction = digits.slice(digits.length - scale).replace(/0+$/, "");
    const text = fraction ? `${integer}.${fraction}` : integer;
    return negative ? `-${text}` : text;
}

/**
 * Canonical decimal string for a decimal string or a finite number, or `null` for anything else. Leading zeros,
 * trailing fraction zeros and the sign of zero are dropped, so equal values have equal strings.
 */
export function toDecimalString(value: string | number | null | undefined): string | null {
    if (value == null) {
        return null;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? toDecimalString(PLAIN_NUMBER_FORMAT.format(value)) : null;
    }
    const text = value.trim();
    if (!DECIMAL_REGEX.test(text)) {
        return null;
    }
    const { scale, units } = toScaled(text);
    return fromScaled(units, scale);
}

export function addDecimals(a: string, b: string): string {
    const [x, y, scale] = toCommonScale(toScaled(a), toScaled(b));
    return fromScaled(x + y, scale);
}

export function subtractDecimals(a: string, b: string): string {
    const [x, y, scale] = toCommonScale(toScaled(a), toScaled(b));
    return fromScaled(x - y, scale);
}

/** Negative when `a < b`, zero when equal, positive when `a > b`. */
export function compareDecimals(a: string, b: string): number {
    const [x, y] = toCommonScale(toScaled(a), toScaled(b));
    return x === y ? 0 : x < y ? -1 : 1;
}
