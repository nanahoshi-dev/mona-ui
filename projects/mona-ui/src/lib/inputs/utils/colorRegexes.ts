export const isValidHex = (hex: string): boolean => {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex);
};

export const isValidHsla = (hslaText: string): boolean => {
    return /^hsla?\(\s*(\d{1,2}|[1-2]\d{2}|3[0-5]\d|360)\s*,\s*(\d{1,2}|100)%\s*,\s*(\d{1,2}|100)%\s*(?:,\s*(0|1|0?\.\d+))?\s*\)$/.test(
        hslaText
    );
};

export const isValidRgb = (rgbText: string): boolean => {
    return /^rgba?\(\s*(\d{1,2}|1\d{2}|2[0-4]\d|25[0-5])\s*,\s*(\d{1,2}|1\d{2}|2[0-4]\d|25[0-5])\s*,\s*(\d{1,2}|1\d{2}|2[0-4]\d|25[0-5])(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(
        rgbText
    );
};
