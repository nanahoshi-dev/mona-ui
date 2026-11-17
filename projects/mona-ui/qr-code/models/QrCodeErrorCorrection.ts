/**
 * How much of the code can be damaged or hidden and still read: about 7% at `"L"`, 15% at `"M"`, 25% at `"Q"` and 30%
 * at `"H"`. A higher level holds less data at the same size.
 */
export type QrCodeErrorCorrection = "L" | "M" | "Q" | "H";
