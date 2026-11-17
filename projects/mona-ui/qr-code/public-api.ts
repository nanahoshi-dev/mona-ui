/*
 * Public API Surface of @nanahoshi/mona-ui/qr-code
 */

export * from "./components/qr-code/qr-code.component";
export * from "./i18n/qr-code.default-messages";

export * from "./models/QrCodeEncoding";
export * from "./models/QrCodeErrorCorrection";
export * from "./models/QrCodeExportError";
export * from "./models/QrCodeExportFormat";
export * from "./models/QrCodeExportOptions";
export * from "./models/QrCodeExportResult";
export * from "./models/QrCodeOverlay";
export * from "./models/QrCodeValueError";

export { type QrCodeValidationOptions, validateQrCodeValue } from "./utils/validate-qr-code-value";
