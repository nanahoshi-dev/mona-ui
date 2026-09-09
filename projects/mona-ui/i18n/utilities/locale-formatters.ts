const numberFormatterCache = new Map<string, Intl.NumberFormat>();

export function getNumberFormatter(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = `${locale}:${JSON.stringify(options ?? {})}`;
    let formatter = numberFormatterCache.get(key);
    if (!formatter) {
        formatter = new Intl.NumberFormat(locale, options);
        numberFormatterCache.set(key, formatter);
    }
    return formatter;
}

export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
    return getNumberFormatter(locale, options).format(value);
}
