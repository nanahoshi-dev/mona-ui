/** Parses an optional positive integer worker setting without accepting NaN or fractional values. */
export function parsePositiveIntegerEnvValue(raw: string | undefined, name: string): number | undefined {
    if (raw == null || raw.trim() === "") {
        return undefined;
    }

    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) {
        throw new Error(`${name} must be a positive integer.`);
    }
    return value;
}

export function readPositiveIntegerEnv(name: string): number | undefined {
    const processLike = (globalThis as typeof globalThis & {
        process?: { readonly env?: Record<string, string | undefined> };
    }).process;
    return parsePositiveIntegerEnvValue(processLike?.env?.[name], name);
}
