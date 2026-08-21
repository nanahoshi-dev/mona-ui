/**
 * Fail-closed transform classification for export DOM collection (R4-04 / R5-09).
 *
 * A transform is "simple" (vector-eligible for generic DOM text reconstruction)
 * only when it is provably an identity or pure 2D translation matrix.
 * Finite 2D affine transforms (rotation, scale, skew, 2D matrix) are routed to the raster path.
 * 3D transforms (matrix3d, perspective, rotate3d, etc.) and unparseable/unknown syntax
 * are classified as unsupported for template export.
 */

export type ChartExportTransformKind =
    | "none"
    | "translation-2d"
    | "affine-2d"
    | "three-dimensional"
    | "unknown";

export type ChartExportTransformClassification = "simple" | "complex";

export interface ChartExportTransformAnalysis {
    readonly kind: ChartExportTransformKind;
    readonly matrix?: DOMMatrixReadOnly;
    readonly rasterEligible: boolean;
    readonly vectorEligible: boolean;
}

const EPSILON = 1e-3;

interface Matrix2x2Linear {
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

function isValidLengthToken(token: string): boolean {
    return /^[-+0-9.eE]+(px|em|rem|%|vw|vh|vmin|vmax|cm|mm|in|pt|pc|q)?$/.test(token);
}

const THREE_D_FUNCTION_NAMES = new Set([
    "matrix3d",
    "perspective",
    "rotate3d",
    "rotatex",
    "rotatey",
    "rotatez",
    "scale3d",
    "scalez",
    "translate3d",
    "translatez"
]);

/**
 * Fallback syntactic analyzer when DOMMatrixReadOnly is not available.
 */
function analyzeWithoutDomMatrix(value: string): ChartExportTransformAnalysis {
    const functions = parseTransformFunctions(value);
    if (!functions || functions.length === 0) {
        return {
            kind: "unknown",
            rasterEligible: false,
            vectorEligible: false
        };
    }

    let isPureTranslation = true;
    let is2dAffine = true;

    for (const fn of functions) {
        if (THREE_D_FUNCTION_NAMES.has(fn.name)) {
            return {
                kind: "three-dimensional",
                rasterEligible: false,
                vectorEligible: false
            };
        }

        switch (fn.name) {
            case "matrix": {
                if (fn.args.length !== 6) {
                    return { kind: "unknown", rasterEligible: false, vectorEligible: false };
                }
                const [a, b, c, d, e, f] = fn.args.map(parseFloat);
                if (![a, b, c, d, e, f].every(Number.isFinite)) {
                    return { kind: "unknown", rasterEligible: false, vectorEligible: false };
                }
                if (
                    Math.abs(a - 1) > EPSILON ||
                    Math.abs(b) > EPSILON ||
                    Math.abs(c) > EPSILON ||
                    Math.abs(d - 1) > EPSILON
                ) {
                    isPureTranslation = false;
                }
                break;
            }
            case "translatex":
            case "translatey":
            case "translate":
                if (!fn.args.every(isValidLengthToken)) {
                    return { kind: "unknown", rasterEligible: false, vectorEligible: false };
                }
                break;
            case "rotate": {
                if (fn.args.length !== 1) {
                    return { kind: "unknown", rasterEligible: false, vectorEligible: false };
                }
                const radians = angleToRadians(fn.args[0]);
                if (radians === null) {
                    return { kind: "unknown", rasterEligible: false, vectorEligible: false };
                }
                if (Math.abs(radians) > EPSILON) {
                    isPureTranslation = false;
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
                if (scales.length === 0 || scales.some(Number.isNaN)) {
                    return { kind: "unknown", rasterEligible: false, vectorEligible: false };
                }
                if (!scales.every(s => Math.abs(s - 1) <= EPSILON)) {
                    isPureTranslation = false;
                }
                break;
            }
            case "skewx":
            case "skewy":
            case "skew": {
                for (const arg of fn.args) {
                    const radians = angleToRadians(arg);
                    if (radians === null) {
                        return { kind: "unknown", rasterEligible: false, vectorEligible: false };
                    }
                    if (Math.abs(radians) > EPSILON) {
                        isPureTranslation = false;
                    }
                }
                break;
            }
            default:
                return { kind: "unknown", rasterEligible: false, vectorEligible: false };
        }
    }

    if (isPureTranslation) {
        return {
            kind: "translation-2d",
            rasterEligible: true,
            vectorEligible: true
        };
    }

    if (is2dAffine) {
        return {
            kind: "affine-2d",
            rasterEligible: true,
            vectorEligible: false
        };
    }

    return {
        kind: "unknown",
        rasterEligible: false,
        vectorEligible: false
    };
}

/**
 * Analyzes a CSS transform string and returns a detailed capability analysis.
 */
export function analyzeTransform(rawTransform: string | null | undefined): ChartExportTransformAnalysis {
    const trimmed = (rawTransform ?? "").trim();
    if (!trimmed || trimmed.toLowerCase() === "none") {
        return {
            kind: "none",
            rasterEligible: true,
            vectorEligible: true
        };
    }

    const domMatrixCtor = (globalThis as { DOMMatrixReadOnly?: unknown }).DOMMatrixReadOnly;
    if (typeof domMatrixCtor === "function") {
        try {
            const matrix = new (domMatrixCtor as new (init?: string) => DOMMatrixReadOnly)(trimmed);
            if (!matrix.is2D) {
                return {
                    kind: "three-dimensional",
                    matrix,
                    rasterEligible: false,
                    vectorEligible: false
                };
            }

            const components = [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f];
            if (!components.every(Number.isFinite)) {
                return {
                    kind: "unknown",
                    matrix,
                    rasterEligible: false,
                    vectorEligible: false
                };
            }

            if (isIdentityLinearPart(matrix)) {
                const isIdentity = Math.abs(matrix.e) <= EPSILON && Math.abs(matrix.f) <= EPSILON;
                return {
                    kind: isIdentity ? "none" : "translation-2d",
                    matrix,
                    rasterEligible: true,
                    vectorEligible: true
                };
            }

            return {
                kind: "affine-2d",
                matrix,
                rasterEligible: true,
                vectorEligible: false
            };
        } catch {
            return {
                kind: "unknown",
                rasterEligible: false,
                vectorEligible: false
            };
        }
    }

    return analyzeWithoutDomMatrix(trimmed);
}

/**
 * Classifies a transform into "simple" (vector-eligible) or "complex" (routes away from vector text).
 */
export function classifyTransform(rawTransform: string | null | undefined): ChartExportTransformClassification {
    const analysis = analyzeTransform(rawTransform);
    return analysis.vectorEligible ? "simple" : "complex";
}
