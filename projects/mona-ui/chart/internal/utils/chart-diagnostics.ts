export interface ChartDiagnostic {
    readonly code: string;
    readonly message: string;
    readonly severity: "error" | "warning";
    readonly signature: string;
}

export class ChartDiagnostics {
    public static warnOnce(warnedSignatures: Set<string>, diagnostic: ChartDiagnostic): void {
        if (typeof ngDevMode !== "undefined" && !ngDevMode) {
            return;
        }
        if (!warnedSignatures.has(diagnostic.signature)) {
            warnedSignatures.add(diagnostic.signature);
            // eslint-disable-next-line no-console
            console.warn(`[MonaChart] ${diagnostic.message}`);
        }
    }
}
