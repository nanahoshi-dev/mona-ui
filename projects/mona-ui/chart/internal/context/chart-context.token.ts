import { InjectionToken } from "@angular/core";
import type { ChartRegistrationContext } from "./chart-registration-context";

export const CHART_CONTEXT = new InjectionToken<ChartRegistrationContext>("CHART_CONTEXT");
