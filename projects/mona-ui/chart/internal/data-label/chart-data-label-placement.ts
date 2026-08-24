import type { ChartDataLabelPosition } from "../../models/chart-data-label.models";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import { CartesianMarkVisualGeometry } from "../interaction/cartesian-mark-visual-geometry";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { NormalizedChartDataLabelOptions } from "./chart-data-label-options";

export interface DataLabelPlacementResult {
    readonly anchor: ChartPoint;
    readonly bounds: ChartRect;
    readonly placement: ChartDataLabelPosition;
}

export class ChartDataLabelPlacement {
    static readonly #warnedPositions = new Set<string>();

    static #computeBarPlacement(
        hit: SceneHitTarget,
        position: ChartDataLabelPosition,
        offset: number,
        width: number,
        height: number,
        isHorizontal: boolean = false
    ): DataLabelPlacementResult {
        const b = hit.visualBounds ?? hit.bounds ?? { height: 0, width: 0, x: 0, y: 0 };
        const isPositive = hit.isPositive !== false;

        const centerX = b.x + b.width / 2;
        const centerY = b.y + b.height / 2;

        let boundsX = centerX - width / 2;
        let boundsY = centerY - height / 2;
        let anchorX = centerX;
        let anchorY = centerY;

        if (isHorizontal) {
            if (isPositive) {
                switch (position) {
                    case "outside-end":
                    case "right":
                        boundsX = b.x + b.width + offset;
                        boundsY = centerY - height / 2;
                        anchorX = b.x + b.width;
                        anchorY = centerY;
                        break;
                    case "inside-end":
                        boundsX = b.x + b.width - offset - width;
                        boundsY = centerY - height / 2;
                        anchorX = b.x + b.width;
                        anchorY = centerY;
                        break;
                    case "inside-start":
                    case "left":
                        boundsX = b.x + offset;
                        boundsY = centerY - height / 2;
                        anchorX = b.x;
                        anchorY = centerY;
                        break;
                    case "outside-start":
                        boundsX = b.x - offset - width;
                        boundsY = centerY - height / 2;
                        anchorX = b.x;
                        anchorY = centerY;
                        break;
                    case "center":
                    case "inside-center":
                    default:
                        boundsX = centerX - width / 2;
                        boundsY = centerY - height / 2;
                        break;
                }
            } else {
                // Negative horizontal bar
                switch (position) {
                    case "outside-end":
                    case "left":
                        boundsX = b.x - offset - width;
                        boundsY = centerY - height / 2;
                        anchorX = b.x;
                        anchorY = centerY;
                        break;
                    case "inside-end":
                        boundsX = b.x + offset;
                        boundsY = centerY - height / 2;
                        anchorX = b.x;
                        anchorY = centerY;
                        break;
                    case "inside-start":
                    case "right":
                        boundsX = b.x + b.width - offset - width;
                        boundsY = centerY - height / 2;
                        anchorX = b.x + b.width;
                        anchorY = centerY;
                        break;
                    case "outside-start":
                        boundsX = b.x + b.width + offset;
                        boundsY = centerY - height / 2;
                        anchorX = b.x + b.width;
                        anchorY = centerY;
                        break;
                    case "center":
                    case "inside-center":
                    default:
                        boundsX = centerX - width / 2;
                        boundsY = centerY - height / 2;
                        break;
                }
            }
        } else {
            // Vertical bar
            if (isPositive) {
                switch (position) {
                    case "outside-end":
                    case "top":
                        boundsY = b.y - offset - height;
                        boundsX = centerX - width / 2;
                        anchorX = centerX;
                        anchorY = b.y;
                        break;
                    case "inside-end":
                        boundsY = b.y + offset;
                        boundsX = centerX - width / 2;
                        anchorX = centerX;
                        anchorY = b.y;
                        break;
                    case "inside-start":
                    case "bottom":
                        boundsY = b.y + b.height - offset - height;
                        boundsX = centerX - width / 2;
                        anchorX = centerX;
                        anchorY = b.y + b.height;
                        break;
                    case "outside-start":
                        boundsY = b.y + b.height + offset;
                        boundsX = centerX - width / 2;
                        anchorX = centerX;
                        anchorY = b.y + b.height;
                        break;
                    case "center":
                    case "inside-center":
                    default:
                        boundsX = centerX - width / 2;
                        boundsY = centerY - height / 2;
                        break;
                }
            } else {
                // Negative vertical bar
                switch (position) {
                    case "outside-end":
                    case "bottom":
                        boundsY = b.y + b.height + offset;
                        boundsX = centerX - width / 2;
                        anchorX = centerX;
                        anchorY = b.y + b.height;
                        break;
                    case "inside-end":
                        boundsY = b.y + b.height - offset - height;
                        boundsX = centerX - width / 2;
                        anchorX = centerX;
                        anchorY = b.y + b.height;
                        break;
                    case "inside-start":
                    case "top":
                        boundsY = b.y + offset;
                        boundsX = centerX - width / 2;
                        anchorX = centerX;
                        anchorY = b.y;
                        break;
                    case "outside-start":
                        boundsY = b.y - offset - height;
                        boundsX = centerX - width / 2;
                        anchorX = centerX;
                        anchorY = b.y;
                        break;
                    case "center":
                    case "inside-center":
                    default:
                        boundsX = centerX - width / 2;
                        boundsY = centerY - height / 2;
                        break;
                }
            }
        }

        return {
            anchor: { x: anchorX, y: anchorY },
            bounds: { height, width, x: boundsX, y: boundsY },
            placement: position
        };
    }

    static #computePlacement(
        hit: SceneHitTarget,
        position: ChartDataLabelPosition,
        offset: number,
        width: number,
        height: number,
        plotRect: ChartRect,
        orientation?: "horizontal" | "vertical"
    ): DataLabelPlacementResult | null {
        const type = hit.seriesType;
        const isHorizontal = hit.barOrientation === "horizontal" || orientation === "horizontal";

        if (type === "bar" || type === "rangeBar") {
            return ChartDataLabelPlacement.#computeBarPlacement(hit, position, offset, width, height, isHorizontal);
        }

        if (type === "rangeArea") {
            return ChartDataLabelPlacement.#computeRangeAreaPlacement(hit, position, offset, width, height);
        }

        // Point-like / financial / fallback
        return ChartDataLabelPlacement.#computePointPlacement(hit, position, offset, width, height);
    }

    static #computePointPlacement(
        hit: SceneHitTarget,
        position: ChartDataLabelPosition,
        offset: number,
        width: number,
        height: number
    ): DataLabelPlacementResult {
        const center = CartesianMarkVisualGeometry.getVisualCenter(hit);
        const visualRadius = CartesianMarkVisualGeometry.getVisualRadius(hit, 0);
        const effectiveOffset = Math.max(0, visualRadius) + offset;

        let boundsX = center.x - width / 2;
        let boundsY = center.y - height / 2;

        switch (position) {
            case "top":
            case "outside-end":
                boundsY = center.y - effectiveOffset - height;
                boundsX = center.x - width / 2;
                break;
            case "bottom":
            case "outside-start":
                boundsY = center.y + effectiveOffset;
                boundsX = center.x - width / 2;
                break;
            case "right":
                boundsX = center.x + effectiveOffset;
                boundsY = center.y - height / 2;
                break;
            case "left":
                boundsX = center.x - effectiveOffset - width;
                boundsY = center.y - height / 2;
                break;
            case "center":
            case "inside-center":
            default:
                boundsX = center.x - width / 2;
                boundsY = center.y - height / 2;
                break;
        }

        return {
            anchor: center,
            bounds: { height, width, x: boundsX, y: boundsY },
            placement: position
        };
    }

    static #computeRangeAreaPlacement(
        hit: SceneHitTarget,
        position: ChartDataLabelPosition,
        offset: number,
        width: number,
        height: number
    ): DataLabelPlacementResult {
        const highPt = hit.highPoint ?? hit.point ?? { x: 0, y: 0 };
        const lowPt = hit.lowPoint ?? hit.point ?? { x: 0, y: 0 };

        const centerX = (highPt.x + lowPt.x) / 2;
        const centerY = (highPt.y + lowPt.y) / 2;

        const minY = Math.min(highPt.y, lowPt.y);
        const maxY = Math.max(highPt.y, lowPt.y);

        let boundsX = centerX - width / 2;
        let boundsY = centerY - height / 2;

        switch (position) {
            case "top":
            case "outside-end":
                boundsY = minY - offset - height;
                boundsX = centerX - width / 2;
                break;
            case "bottom":
            case "outside-start":
                boundsY = maxY + offset;
                boundsX = centerX - width / 2;
                break;
            case "right":
                boundsX = centerX + offset;
                boundsY = centerY - height / 2;
                break;
            case "left":
                boundsX = centerX - offset - width;
                boundsY = centerY - height / 2;
                break;
            case "center":
            case "inside-center":
            default:
                boundsX = centerX - width / 2;
                boundsY = centerY - height / 2;
                break;
        }

        return {
            anchor: { x: centerX, y: centerY },
            bounds: { height, width, x: boundsX, y: boundsY },
            placement: position
        };
    }

    static #getCandidatePositions(
        hit: SceneHitTarget,
        requested: ChartDataLabelPosition,
        orientation?: "horizontal" | "vertical"
    ): readonly ChartDataLabelPosition[] {
        if (requested !== "auto") {
            return [ChartDataLabelPlacement.#normalizePosition(hit, requested, orientation)];
        }

        const type = hit.seriesType;
        const isHorizontal = hit.barOrientation === "horizontal" || orientation === "horizontal";

        if (type === "bar") {
            if (hit.stackMode) {
                return ["inside-center", "inside-end", "outside-end"];
            }
            return ["outside-end", "inside-end", "inside-center"];
        }

        if (type === "rangeBar") {
            if (isHorizontal) {
                return ["inside-center", "outside-end", "inside-end"];
            }
            return ["inside-center", "outside-end", "inside-end"];
        }

        if (type === "rangeArea") {
            return ["center", "top", "bottom", "right", "left"];
        }

        if (type === "candlestick" || type === "ohlc") {
            return ["right", "left", "top", "bottom"];
        }

        // Point-like: line, area, scatter, bubble
        return ["top", "bottom", "right", "left", "center"];
    }

    static #normalizePosition(
        hit: SceneHitTarget,
        requested: ChartDataLabelPosition,
        _orientation?: "horizontal" | "vertical"
    ): ChartDataLabelPosition {
        const type = hit.seriesType;
        if (type === "line" || type === "area" || type === "scatter" || type === "bubble") {
            if (requested === "inside-start" || requested === "inside-end" || requested === "inside-center") {
                ChartDataLabelPlacement.#warnUnsupportedPosition(type, requested, "center");
                return "center";
            }
            if (requested === "outside-start") {
                return "bottom";
            }
            if (requested === "outside-end") {
                return "top";
            }
        }

        if (type === "candlestick" || type === "ohlc") {
            if (requested === "inside-start" || requested === "inside-end" || requested === "inside-center") {
                ChartDataLabelPlacement.#warnUnsupportedPosition(type, requested, "right");
                return "right";
            }
        }

        return requested;
    }

    static #warnUnsupportedPosition(seriesType: string, requested: string, fallback: string): void {
        if (typeof ngDevMode !== "undefined" && ngDevMode) {
            const key = `${seriesType}:${requested}`;
            if (!ChartDataLabelPlacement.#warnedPositions.has(key)) {
                ChartDataLabelPlacement.#warnedPositions.add(key);

                console.warn(
                    `[Mona Chart] Data label position "${requested}" is not supported for "${seriesType}" series. Falling back to "${fallback}".`
                );
            }
        }
    }

    public static isInside(bounds: ChartRect, plotRect: ChartRect): boolean {
        const tolerance = 0.5;
        return (
            bounds.x >= plotRect.x - tolerance &&
            bounds.y >= plotRect.y - tolerance &&
            bounds.x + bounds.width <= plotRect.x + plotRect.width + tolerance &&
            bounds.y + bounds.height <= plotRect.y + plotRect.height + tolerance
        );
    }

    public static resolvePlacements(
        hit: SceneHitTarget,
        options: NormalizedChartDataLabelOptions,
        labelWidth: number,
        labelHeight: number,
        plotRect: ChartRect,
        orientation?: "horizontal" | "vertical"
    ): readonly DataLabelPlacementResult[] {
        const positions = ChartDataLabelPlacement.#getCandidatePositions(hit, options.position, orientation);
        const results: DataLabelPlacementResult[] = [];

        for (const pos of positions) {
            const placement = ChartDataLabelPlacement.#computePlacement(
                hit,
                pos,
                options.offset,
                labelWidth,
                labelHeight,
                plotRect,
                orientation
            );
            if (placement) {
                if (options.overflow === "clip" || ChartDataLabelPlacement.isInside(placement.bounds, plotRect)) {
                    results.push(placement);
                }
            }
        }

        return results;
    }
}
