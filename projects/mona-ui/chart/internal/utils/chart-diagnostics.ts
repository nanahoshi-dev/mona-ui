export interface ChartDiagnostic {
    readonly code: string;
    readonly message: string;
    readonly severity: "error" | "warning";
    readonly signature: string;
}

export class ChartDiagnostics {
    public static warnOnce(
        warnedSignatures: Set<string>,
        diagnostic: ChartDiagnostic | string,
        signature?: string
    ): void {
        if (typeof ngDevMode !== "undefined" && !ngDevMode) {
            return;
        }
        const sig = typeof diagnostic === "string" ? (signature ?? diagnostic) : diagnostic.signature;
        const msg = typeof diagnostic === "string" ? diagnostic : diagnostic.message;
        if (!warnedSignatures.has(sig)) {
            warnedSignatures.add(sig);
            const outputMsg = msg.startsWith("[MonaChart]") ? msg : `[MonaChart] ${msg}`;

            console.warn(outputMsg);
        }
    }
}
