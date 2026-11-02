const toHexByte = (value: number): string => {
    const byte = Math.min(255, Math.max(0, Math.round(value)));
    return byte.toString(16).padStart(2, "0");
};

export const rgba2hex = (r: number | null, g: number | null, b: number | null, a: number | null): string => {
    if (r == null || g == null || b == null || a == null) {
        return "";
    }

    const aHex = toHexByte(a);
    return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}${aHex !== "ff" ? aHex : ""}`;
};
