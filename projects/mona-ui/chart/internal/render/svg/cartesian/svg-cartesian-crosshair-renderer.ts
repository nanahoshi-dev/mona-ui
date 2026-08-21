import type { ChartRect } from "../../../../models/chart.models";
import type { ChartCrosshairRegistration } from "../../../context/chart-registration-context";
import type { ChartCrosshairRenderSnapshot } from "../../../export/chart-export-snapshot";
import type { ChartCrosshairState } from "../../../interaction/chart-crosshair-state";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { setSvgAttribute } from "../svg-attribute-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

interface CrosshairLineItem {
    readonly id: "x" | "y";
    readonly x1: number;
    readonly x2: number;
    readonly y1: number;
    readonly y2: number;
}

function getCrosshairDash(style: string): string | undefined {
    switch (style) {
        case "dotted":
            return "2 3";
        case "solid":
            return undefined;
        case "dashed":
        default:
            return "4 4";
    }
}

export class SvgCartesianCrosshairRenderer {
    readonly #keyedGroup: SvgKeyedGroup<CrosshairLineItem, SVGLineElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<CrosshairLineItem, SVGLineElement>(container);
    }

    public render(
        crosshairState: ChartCrosshairState | null,
        registration: ChartCrosshairRegistration | null,
        plotRect: ChartRect,
        styleResolver: ChartStyleResolver,
        plotClipUrl?: string,
        snapshot?: ChartCrosshairRenderSnapshot | null
    ): void {
        if (snapshot) {
            if (!crosshairState || snapshot.enabled === false) {
                this.#keyedGroup.clear();
                return;
            }
        } else {
            if (!crosshairState || !registration || registration.enabled() === false) {
                this.#keyedGroup.clear();
                return;
            }
        }

        if (!crosshairState.x && !crosshairState.y) {
            this.#keyedGroup.clear();
            return;
        }

        if (plotRect.width <= 0 || plotRect.height <= 0) {
            this.#keyedGroup.clear();
            return;
        }

        const style = snapshot
            ? { color: snapshot.color, opacity: snapshot.opacity, width: snapshot.width }
            : styleResolver.resolveCrosshairStyle(registration!);

        if (style.width <= 0 || style.opacity <= 0) {
            this.#keyedGroup.clear();
            return;
        }

        const dash = snapshot
            ? snapshot.dashArray ?? getCrosshairDash(snapshot.lineStyle)
            : getCrosshairDash(registration!.lineStyle());

        const items: CrosshairLineItem[] = [];

        if (crosshairState.x) {
            const x = Math.round(crosshairState.x.coordinate);
            if (x >= plotRect.x && x <= plotRect.x + plotRect.width) {
                items.push({
                    id: "x",
                    x1: x,
                    x2: x,
                    y1: plotRect.y,
                    y2: plotRect.y + plotRect.height
                });
            }
        }

        if (crosshairState.y) {
            const y = Math.round(crosshairState.y.coordinate);
            if (y >= plotRect.y && y <= plotRect.y + plotRect.height) {
                items.push({
                    id: "y",
                    x1: plotRect.x,
                    x2: plotRect.x + plotRect.width,
                    y1: y,
                    y2: y
                });
            }
        }

        this.#keyedGroup.reconcile(items, {
            key: item => item.id,
            tag: "line",
            update: (element, item) => {
                setSvgAttribute(element, "x1", item.x1);
                setSvgAttribute(element, "y1", item.y1);
                setSvgAttribute(element, "x2", item.x2);
                setSvgAttribute(element, "y2", item.y2);
                setSvgAttribute(element, "stroke", style.color);
                setSvgAttribute(element, "stroke-width", style.width);
                setSvgAttribute(element, "opacity", style.opacity);
                setSvgAttribute(element, "stroke-dasharray", dash);
                setSvgAttribute(element, "shape-rendering", "crispEdges");

                if (plotClipUrl) {
                    setSvgAttribute(element, "clip-path", plotClipUrl);
                } else {
                    element.removeAttribute("clip-path");
                }
            }
        });
    }

    public clear(): void {
        this.#keyedGroup.clear();
    }

    public destroy(): void {
        this.#keyedGroup.destroy();
    }
}
