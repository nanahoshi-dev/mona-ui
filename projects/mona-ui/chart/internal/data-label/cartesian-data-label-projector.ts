import type {} from "../../directives/chart-data-label-template.directive";
import type { ChartRect, ChartSize } from "../../models/chart.models";
import type {
    ChartCartesianSeriesRegistrationBase,
    ChartFinancialSeriesRegistrationBase,
    ChartSeriesRegistration
} from "../context/chart-registration-context";
import type {
    CartesianDataLabelScene,
    SceneDefaultDataLabel,
    SceneTemplateDataLabel
} from "../scene/cartesian-data-label-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { ChartMarkIdentityResolver } from "../interaction/chart-mark-identity-resolver";
import { ChartDataLabelCollisionIndex } from "./chart-data-label-collision-index";
import { ChartDataLabelContextBuilder } from "./chart-data-label-context-builder";
import {
    normalizeChartDataLabelOptions
} from "./chart-data-label-options";
import { ChartDataLabelPlacement } from "./chart-data-label-placement";
import { ChartDataLabelTextMeasurer } from "./chart-data-label-text-measurer";

export interface CartesianDataLabelProjectorOptions {
    readonly defaultColor?: string;
    readonly font?: string;
    readonly haloColor?: string;
    readonly haloWidth?: number;
    readonly hitTargets: readonly SceneHitTarget[];
    readonly orientation?: "horizontal" | "vertical";
    readonly plotRect: ChartRect;
    readonly resolvedSeriesColors?: ReadonlyMap<string, string>;
    readonly scene?: import("../scene/chart-scene").CartesianXYChartScene | null;
    readonly selectedMarkIds: ReadonlySet<string>;
    readonly seriesRegistrations: readonly ChartSeriesRegistration[];
    readonly templateMeasurements?: ReadonlyMap<string, ChartSize>;
}

export class CartesianDataLabelProjector {
    public static project(options: CartesianDataLabelProjectorOptions): CartesianDataLabelScene {
        const {
            defaultColor = "#1e293b",
            font = "500 11px system-ui, sans-serif",
            haloColor = "rgba(255, 255, 255, 0.85)",
            haloWidth = 2,
            hitTargets,
            orientation,
            plotRect,
            resolvedSeriesColors,
            scene,
            selectedMarkIds,
            seriesRegistrations,
            templateMeasurements
        } = options;

        if (hitTargets.length === 0 || seriesRegistrations.length === 0) {
            return { defaultLabels: [], templateLabels: [] };
        }

        const seriesMap = new Map<string, ChartSeriesRegistration>();
        for (const reg of seriesRegistrations) {
            seriesMap.set(reg.id, reg);
        }

        const hitsBySeries = new Map<string, SceneHitTarget[]>();
        for (const hit of hitTargets) {
            let list = hitsBySeries.get(hit.seriesId);
            if (!list) {
                list = [];
                hitsBySeries.set(hit.seriesId, list);
            }
            list.push(hit);
        }

        const collisionIndex = new ChartDataLabelCollisionIndex(48);
        const defaultLabels: SceneDefaultDataLabel[] = [];
        const templateLabels: SceneTemplateDataLabel[] = [];

        for (const [seriesId, seriesHits] of hitsBySeries.entries()) {
            const registration = seriesMap.get(seriesId);
            if (!registration) {
                continue;
            }

            const cartesianReg = registration as ChartCartesianSeriesRegistrationBase | ChartFinancialSeriesRegistrationBase;
            const dataLabelsInput = cartesianReg.dataLabels?.();
            const normalizedOptions = normalizeChartDataLabelOptions(dataLabelsInput);

            if (!normalizedOptions.enabled || normalizedOptions.maxLabels <= 0) {
                continue;
            }

            const rawColor = "color" in cartesianReg && typeof (cartesianReg as ChartCartesianSeriesRegistrationBase).color === "function"
                ? (cartesianReg as ChartCartesianSeriesRegistrationBase).color()
                : undefined;
            const seriesColor = (rawColor && rawColor.trim() !== "")
                ? rawColor
                : (resolvedSeriesColors?.get(seriesId) ?? undefined);

            const template = cartesianReg.dataLabelTemplate?.();
            const sampledHits = CartesianDataLabelProjector.#sampleHits(seriesHits, normalizedOptions.maxLabels);

            for (const hit of sampledHits) {
                const markId = ChartMarkIdentityResolver.resolve(hit);
                const isSelected = selectedMarkIds.has(markId);
                const context = ChartDataLabelContextBuilder.buildContext(hit, isSelected, seriesColor, scene);

                if (template) {
                    const measureKey1 = `${hit.seriesId}:${markId}`;
                    const measured =
                        templateMeasurements?.get(measureKey1) ??
                        templateMeasurements?.get(markId) ??
                        { height: 20, width: 44 };

                    const placements = ChartDataLabelPlacement.resolvePlacements(
                        hit,
                        normalizedOptions,
                        measured.width,
                        measured.height,
                        plotRect,
                        orientation
                    );

                    for (const placement of placements) {
                        const collides =
                            !normalizedOptions.allowOverlap &&
                            collisionIndex.collides(placement.bounds, normalizedOptions.collisionPadding);

                        if (!collides) {
                            collisionIndex.insert(placement.bounds, normalizedOptions.collisionPadding);
                            templateLabels.push({
                                anchor: placement.anchor,
                                bounds: placement.bounds,
                                context,
                                markId,
                                placement: placement.placement,
                                seriesId: hit.seriesId,
                                template
                            });
                            break;
                        }
                    }
                } else {
                    const text = ChartDataLabelContextBuilder.resolveDefaultText(context, normalizedOptions);
                    if (!text) {
                        continue;
                    }

                    const measured = ChartDataLabelTextMeasurer.measure(text, font);
                    const placements = ChartDataLabelPlacement.resolvePlacements(
                        hit,
                        normalizedOptions,
                        measured.width,
                        measured.height,
                        plotRect,
                        orientation
                    );

                    for (const placement of placements) {
                        const collides =
                            !normalizedOptions.allowOverlap &&
                            collisionIndex.collides(placement.bounds, normalizedOptions.collisionPadding);

                        if (!collides) {
                            collisionIndex.insert(placement.bounds, normalizedOptions.collisionPadding);
                            defaultLabels.push({
                                anchor: placement.anchor,
                                bounds: placement.bounds,
                                color: normalizedOptions.color ?? defaultColor,
                                font,
                                haloColor,
                                haloWidth,
                                markId,
                                placement: placement.placement,
                                seriesId: hit.seriesId,
                                text
                            });
                            break;
                        }
                    }
                }
            }
        }

        return { defaultLabels, templateLabels };
    }

    static #sampleHits(hits: readonly SceneHitTarget[], maxLabels: number): readonly SceneHitTarget[] {
        if (hits.length <= maxLabels) {
            return hits;
        }

        if (maxLabels === 1) {
            return [hits[0]];
        }

        const result: SceneHitTarget[] = [hits[0]];
        const count = maxLabels - 2;
        const step = (hits.length - 1) / (maxLabels - 1);

        for (let i = 1; i <= count; i++) {
            const index = Math.round(i * step);
            if (index > 0 && index < hits.length - 1) {
                result.push(hits[index]);
            }
        }

        result.push(hits[hits.length - 1]);
        return result;
    }
}
