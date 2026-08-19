import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import type { ChartDiagnostic } from "../utils/chart-diagnostics";
import { CartesianStageTracker } from "./cartesian-stage-instrumentation";

export interface CartesianSeriesPolicyResult {
    readonly diagnostics: readonly ChartDiagnostic[];
    readonly effectiveSeries: readonly ChartCartesianSeriesRegistration[];
    readonly ignoredSeriesIds: ReadonlySet<string>;
}

export class CartesianSeriesPolicy {
    public static resolve(series: readonly ChartCartesianSeriesRegistration[]): CartesianSeriesPolicyResult {
        CartesianStageTracker.current?.onSeriesPolicy?.();
        const effectiveSeries: ChartCartesianSeriesRegistration[] = [];
        const ignoredSeriesIds = new Set<string>();
        const diagnostics: ChartDiagnostic[] = [];

        let activeFinancialSeriesId: string | null = null;

        for (let i = 0; i < series.length; i++) {
            const s = series[i];
            if (s.type === "candlestick" || s.type === "ohlc") {
                if (activeFinancialSeriesId === null) {
                    activeFinancialSeriesId = s.id;
                    effectiveSeries.push(s);
                } else {
                    ignoredSeriesIds.add(s.id);
                    const name = s.name();
                    diagnostics.push({
                        code: "multiple-financial-series",
                        message: `Only one financial series (candlestick or ohlc) can be active per cartesian chart. Series "${name}" will be ignored.`,
                        severity: "warning",
                        signature: `${s.id}:multiple-financial-series`
                    });
                }
            } else {
                effectiveSeries.push(s);
            }
        }

        return {
            diagnostics,
            effectiveSeries,
            ignoredSeriesIds
        };
    }
}
