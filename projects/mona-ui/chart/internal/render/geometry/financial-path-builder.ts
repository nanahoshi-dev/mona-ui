import type { SceneCandlestickMark, SceneOhlcMark } from "../../scene/scene-geometry";

export function buildCandlestickWickPath(mark: SceneCandlestickMark): string {
    return `M ${mark.centerX} ${mark.highY} L ${mark.centerX} ${mark.lowY}`;
}

export function buildOhlcPath(mark: SceneOhlcMark): string {
    const cx = mark.centerX;
    return `M ${cx} ${mark.highY} L ${cx} ${mark.lowY} M ${cx - mark.tickWidth} ${mark.openY} L ${cx} ${mark.openY} M ${cx} ${mark.closeY} L ${cx + mark.tickWidth} ${mark.closeY}`;
}
