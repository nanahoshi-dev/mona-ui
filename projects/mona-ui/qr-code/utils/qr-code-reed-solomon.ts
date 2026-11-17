/*
 * Reed-Solomon error correction over GF(256), with the field polynomial x^8 + x^4 + x^3 + x^2 + 1 the QR code standard
 * uses.
 */

const FIELD_POLYNOMIAL = 0x11d;

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

{
    let value = 1;
    for (let power = 0; power < 255; power++) {
        EXP[power] = value;
        LOG[value] = power;
        value <<= 1;
        if (value & 0x100) {
            value ^= FIELD_POLYNOMIAL;
        }
    }
    // A second copy saves a modulo when multiplying.
    for (let power = 255; power < 512; power++) {
        EXP[power] = EXP[power - 255];
    }
}

const generatorCache = new Map<number, Uint8Array>();

export function gfMultiply(a: number, b: number): number {
    return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
}

/**
 * The generator polynomial of a degree, (x - α^0)(x - α^1)…(x - α^(degree-1)), as its coefficients from the highest
 * power down. The leading 1 is left out.
 */
export function generatorPolynomial(degree: number): Uint8Array {
    const cached = generatorCache.get(degree);
    if (cached) {
        return cached;
    }
    // coefficients[0] is the highest power after the leading 1.
    const coefficients = new Uint8Array(degree);
    coefficients[degree - 1] = 1;
    let root = 1;
    for (let step = 0; step < degree; step++) {
        // Multiply by (x - root). In GF(2^8), subtracting is adding.
        for (let index = 0; index < degree; index++) {
            coefficients[index] = gfMultiply(coefficients[index], root);
            if (index + 1 < degree) {
                coefficients[index] ^= coefficients[index + 1];
            }
        }
        root = gfMultiply(root, 2);
    }
    generatorCache.set(degree, coefficients);
    return coefficients;
}

/** The error correction codewords of a block: the remainder of data · x^degree divided by the generator. */
export function reedSolomonRemainder(data: Uint8Array, degree: number): Uint8Array {
    const generator = generatorPolynomial(degree);
    const remainder = new Uint8Array(degree);
    for (const byte of data) {
        const factor = byte ^ remainder[0];
        remainder.copyWithin(0, 1);
        remainder[degree - 1] = 0;
        for (let index = 0; index < degree; index++) {
            remainder[index] ^= gfMultiply(generator[index], factor);
        }
    }
    return remainder;
}
