export const rgba2hex = (r: number | null, g: number | null, b: number | null, a: number | null): string => {
    if (r == null || g == null || b == null || a == null) {
        return "";
    }

    let rHex = r.toString(16);
    let gHex = g.toString(16);
    let bHex = b.toString(16);
    let aHex = a.toString(16);

    if (rHex.length == 1) rHex = "0" + rHex;
    if (gHex.length == 1) gHex = "0" + gHex;
    if (bHex.length == 1) bHex = "0" + bHex;
    if (aHex.length == 1) aHex = "0" + aHex;

    return `#${rHex}${gHex}${bHex}${aHex.toUpperCase() !== "FF" ? aHex : ""}`;
};
