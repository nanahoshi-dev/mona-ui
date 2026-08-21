/**
 * Fail-closed transform classification for export DOM collection (R4-04).
 *
 * A transform is "simple" (vector-eligible for generic DOM text reconstruction)
 * only when it is provably an identity or pure 2D translation matrix.
 * Everything else - 3D matrices, perspective, rotation, scale, skew,
 * unparseable or unknown future syntax - is classified as "complex"
 * and must be routed through the transformed raster-island path.
 */

export type ChartExportTransformClassification = "simple" | "complex";

const EPSILON = 1e-3;

interface Matrix2x2Linear {
    readonly is2D: boolean;
    readonly m11: number;
    readonly m12: number;
    readonly m21: number;
    readonly m22: number;
}

function isIdentityLinearPart(m: Matrix2x2Linear): boolean {
    return (
        Math.abs(m.m11 - 1) <= EPSILON &&
        Math.abs(m.m12) <= EPSILON &&
        Math.abs(m.m21) <= EPSILON &&
        Math.abs(m.m22 - 1) <= EPSILON
    );
}

interface ParsedTransformFunction {
    readonly args: readonly string[];
    readonly name: string;
}

function parseTransformFunctions(value: string): readonly ParsedTransformFunction[] | null {
    const functions: ParsedTransformFunction[] = [];
    const regex = /([a-zA-Z][a-zA-Z0-9]*)\s*\(([^)]*)\)/g;
    let match: RegExpExecArray | null;
    let consumedLength = 0;

    while ((match = regex.exec(value)) !== null) {
        if (value.slice(consumedLength, match.index).trim().length > 0) {
            return null;
        }
        consumedLength = match.index + match[0].length;
        const args = match[2]
            .split(/[,\s]+/)
            .map(a => a.trim())
            .filter(a => a.length > 0);
        functions.push({ args, name: match[1].toLowerCase() });
    }

    if (value.slice(consumedLength).trim().length > 0) {
        return null;
    }
    return functions;
}

function angleToRadians(token: string): number | null {
    const match = /^([-+0-9.eE]+)(deg|grad|rad|turn)?$/.exec(token);
    if (!match) {
        return null;
    }
    const value = parseFloat(match[1]);
    if (!Number.isFinite(value)) {
        return null;
    }
    switch (match[2]) {
        case "grad":
            return (value * Math.PI) / 200;
        case "rad":
            return value;
        case "turn":
            return value * 2 * Math.PI;
        case "deg":
        case undefined:
            return (value * Math.PI) / 180;
        default:
            return null;
    }
}

function lengthIsZero(token: string): boolean {
    const match = /^([-+0-9.eE]+)(px|em|rem|%|vw|vh|vmin|vmax|cm|mm|in|pt|pc|q)?$/.exec(token);
    if (!match) {
        return false;
    }
    return Math.abs(parseFloat(match[1])) <= EPSILON;
}

function isValidLengthToken(token: string): boolean {
    return /^[-+0-9.eE]+(px|em|rem|%|vw|vh|vmin|vmax|cm|mm|in|pt|pc|q)?$/.test(token);
}

/**
 * Conservative syntactic fallback used only when DOMMatrixReadOnly is unavailable
 * (e.g. non-browser test environments). Certifies only forms that are provably
 * identity or pure 2D translation; every unknown construct fails closed.
 */
function classifyWithoutDomMatrix(value: string): ChartExportTransformClassification {
    const functions = parseTransformFunctions(value);
    if (!functions || functions.length === 0) {
        return "complex";
    }

    for (const fn of functions) {
        switch (fn.name) {
            case "matrix": {
                if (fn.args.length !== 6) {
                    return "complex";
                }
                const [a, b, c, d] = fn.args.map(parseFloat);
                if (![a, b, c, d].every(Number.isFinite)) {
                    return "complex";
                }
                if (
                    Math.abs(a - 1) > EPSILON ||
                    Math.abs(b) > EPSILON ||
                    Math.abs(c) > EPSILON ||
                    Math.abs(d - 1) > EPSILON
                ) {
                    return "complex";
                }
                break;
            }
            case "translatex":
            case "translatey":
            case "translate":
                if (!fn.args.every(isValidLengthToken)) {
                    return "complex";
                }
                break;
            case "rotate": {
                if (fn.args.length !== 1) {
                    return "complex";
                }
                const radians = angleToRadians(fn.args[0]);
                if (radians === null || Math.abs(radians) > EPSILON) {
                    return "complex";
                }
                break;
            }
            case "scalex":
            case "scaley":
            case "scale": {
                const scales = fn.args.map(arg => {
                    const numeric = parseFloat(arg);
                    return Number.isFinite(numeric) ? numeric : NaN;
                });
                if (scales.length === 0 || !scales.every(s => Math.abs(s - 1) <= EPSILON)) {
                    return "complex";
                }
                break;
            }
            case "skewx":
            case "skewy":
            case "skew": {
                for (const arg of fn.args) {
                    const radians = angleToRadians(arg);
                    if (radians === null || Math.abs(radians) > EPSILON) {
                        return "complex";
                    }
                }
                break;
            }
            default:
                return "complex";
        }
    }

    return "simple";
}

export function classifyTransform(rawTransform: string | null | undefined): ChartExportTransformClassification {
    const trimmed = (rawTransform ?? "").trim();
    if (!trimmed || trimmed.toLowerCase() === "none") {
        return "simple";
    }

    const domMatrixCtor = (globalThis as { DOMMatrixReadOnly?: unknown }).DOMMatrixReadOnly;
    if (typeof domMatrixCtor === "function") {
        try {
            const matrix = new (domMatrixCtor as new (init?: string) => DOMMatrixReadOnly)(trimmed);
            if (!matrix.is2D) {
                return "complex";
            }
            return isIdentityLinearPart(matrix) ? "simple" : "complex";
        } catch {
            return "complex";
        }
    }

    return classifyWithoutDomMatrix(trimmed);
}
