interface OklchColor {
    l: number; // Lightness (0-100)
    c: number; // Chroma (typically 0-0.4, can be higher)
    h: number; // Hue (0-360)
    a?: number; // Alpha (0-1), optional
}

interface ColorPalette {
    "--color-primary": string;
    "--color-primary-foreground": string;
    "--color-primary-hover": string;
    "--color-primary-active": string;
    "--color-primary-selected": string;
    "--color-secondary-selected": string;
}

/**
 * Parses an OKLCH color string (with optional alpha) into its components.
 * Lightness (L) can be a percentage (e.g., "39.8%") or a number (e.g., "0.398").
 * If L is a number, it's converted to the 0-100 scale (0.398 -> 39.8).
 * @param oklchColorString - e.g., "oklch(39.8% 0.195 277.366)" or "oklch(0.21 0.01 0)"
 * @returns Parsed OklchColor object or null if invalid.
 */
function parseOklch(oklchColorString: string): OklchColor | null {
    const matchResult = oklchColorString.match(
        /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)/i
    );

    if (matchResult && matchResult[1] !== undefined && matchResult[3] !== undefined && matchResult[4] !== undefined) {
        let lightnessValue = parseFloat(matchResult[1]);
        const lightnessUnit = matchResult[2];

        if (lightnessUnit === "") {
            lightnessValue *= 100;
        }

        const chromaValue = parseFloat(matchResult[3]);
        const hueValue = parseFloat(matchResult[4]);
        let alphaValue: number | undefined = undefined;

        if (matchResult[5] !== undefined) {
            alphaValue = parseFloat(matchResult[5]);
        }

        return { l: lightnessValue, c: chromaValue, h: hueValue, a: alphaValue };
    }
    return null;
}

/**
 * Formats OklchColor components back into an OKLCH string.
 * Ensures L is clamped [0, 100], C is non-negative, and H is wrapped [0, 360).
 * Alpha is included if defined and < 1. L is always formatted as a percentage.
 * Matches precision of the input example.
 * @param colorComponents - OklchColor object
 * @returns Formatted OKLCH string.
 */
function formatOklch(colorComponents: OklchColor): string {
    const clampedLightness = Math.max(0, Math.min(100, colorComponents.l));
    const clampedChroma = Math.max(0, colorComponents.c);
    let wrappedHue = colorComponents.h % 360;
    if (wrappedHue < 0) {
        wrappedHue += 360;
    }

    let oklchOutputString = `oklch(${clampedLightness.toFixed(1)}% ${clampedChroma.toFixed(3)} ${wrappedHue.toFixed(3)}`;

    if (colorComponents.a !== undefined && colorComponents.a < 1.0) {
        const clampedAlpha = Math.max(0, Math.min(1, colorComponents.a));
        oklchOutputString += ` / ${clampedAlpha.toString()}`;
    }
    oklchOutputString += `)`;
    return oklchOutputString;
}

/**
 * Generates a primary color palette based on a given primary OKLCH color.
 * The relationships are derived from the example provided, with adjustments
 * for a "more white-y" foreground.
 * @param primaryOklchString The primary color in OKLCH string format.
 * @returns An object containing the generated color palette.
 * @throws Error if the primaryOklchString is invalid.
 */
export function generatePrimaryColorPalette(primaryOklchString: string): ColorPalette {
    const primaryColor = parseOklch(primaryOklchString);
    if (!primaryColor) {
        throw new Error("Invalid primary color string. Expected format: oklch(L[%] C H [/ A])");
    }

    const colorPalette: ColorPalette = {
        "--color-primary": formatOklch(primaryColor),
        "--color-primary-foreground": "",
        "--color-primary-hover": "",
        "--color-primary-active": "",
        "--color-primary-selected": "",
        "--color-secondary-selected": ""
    };

    // --color-primary-foreground: Adjusted for a "more white-y" appearance
    // L: Increased to 97.5% (was 94.3%)
    // C: Decreased to 0.005 (was 0.029) to be more achromatic
    // H: Kept the primaryColor.h + 17.222 relationship
    colorPalette["--color-primary-foreground"] = formatOklch({
        l: 97.5, // Higher lightness for more "whiteness"
        c: 0.005, // Lower chroma for more neutrality (closer to pure white)
        h: primaryColor.h + 17.222
    });

    colorPalette["--color-primary-hover"] = formatOklch({
        l: primaryColor.l + 4,
        c: primaryColor.c,
        h: primaryColor.h
    });

    colorPalette["--color-primary-active"] = formatOklch({
        l: primaryColor.l - 4,
        c: primaryColor.c,
        h: primaryColor.h
    });

    colorPalette["--color-primary-selected"] = formatOklch({
        l: primaryColor.l + 9,
        c: primaryColor.c,
        h: primaryColor.h
    });

    colorPalette["--color-secondary-selected"] = formatOklch({
        l: primaryColor.l + 4, // Same LCH as primary-hover
        c: primaryColor.c,
        h: primaryColor.h,
        a: 0.5
    });

    return colorPalette;
}
