import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import type {
    CartesianChartScene,
    ChartScene,
    PolarArcChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene
} from "../scene/chart-scene";
import { parseCartesianAxisMeasurementKey } from "./cartesian-axis-measurement-key";

export class ChartLabelMeasurementPruner {
    public static prune(
        measurements: Map<string, ChartLabelMeasurement>,
        scene: ChartScene
    ): void {
        if (scene.coordinateSystem === "cartesian") {
            const cartesianScene = scene as CartesianChartScene;
            const activeAxes = new Set<string>();
            const activeTickKeys = new Set<string>();
            if (cartesianScene.axes) {
                for (const axisScene of cartesianScene.axes) {
                    const id = axisScene.axisId ?? (axisScene.axis === "x" ? "default-x" : "default-y");
                    activeAxes.add(`${axisScene.axis}:${id}`);
                    if (axisScene.ticks) {
                        for (const tick of axisScene.ticks) {
                            if (tick.tickKey) {
                                activeTickKeys.add(tick.tickKey);
                            }
                        }
                    }
                }
            }
            for (const key of Array.from(measurements.keys())) {
                if (key.startsWith("axis:")) {
                    const parsed = parseCartesianAxisMeasurementKey(key);
                    if (!parsed) {
                        measurements.delete(key);
                        continue;
                    }
                    const axisKey = `${parsed.axis}:${parsed.axisId}`;
                    if (!activeAxes.has(axisKey) || (activeTickKeys.size > 0 && !activeTickKeys.has(key))) {
                        measurements.delete(key);
                    }
                } else if (
                    key.startsWith("sector:") ||
                    key.startsWith("slice:") ||
                    key.startsWith("angular:") ||
                    key.startsWith("radial:")
                ) {
                    measurements.delete(key);
                }
            }
        } else if (scene.coordinateSystem === "polar") {
            for (const key of Array.from(measurements.keys())) {
                if (key.startsWith("axis:")) {
                    measurements.delete(key);
                }
            }

            if (scene.polarKind === "sector") {
                const sectorScene = scene as PolarSectorChartScene;
                const validSliceIds = new Set<string>();
                for (const s of sectorScene.series) {
                    for (const sl of s.slices) {
                        validSliceIds.add(`sector:${sl.sliceId}`);
                        validSliceIds.add(sl.sliceId);
                    }
                }
                for (const key of Array.from(measurements.keys())) {
                    if (key.startsWith("sector:") || key.startsWith("slice:")) {
                        if (!validSliceIds.has(key)) {
                            measurements.delete(key);
                        }
                    } else if (key.startsWith("angular:") || key.startsWith("radial:")) {
                        measurements.delete(key);
                    }
                }
            } else if (scene.polarKind === "axis") {
                const axisScene = scene as PolarAxisChartScene;
                const validKeys = new Set<string>();
                for (const tick of axisScene.angularAxis.ticks) {
                    validKeys.add(`angular:${tick.tickKey}`);
                    validKeys.add(`angular:${tick.value}`);
                }
                for (const tick of axisScene.radialAxis.ticks) {
                    validKeys.add(`radial:${tick.tickKey}`);
                    validKeys.add(`radial:${tick.value}`);
                }
                for (const key of Array.from(measurements.keys())) {
                    if (key.startsWith("angular:") || key.startsWith("radial:")) {
                        if (!validKeys.has(key)) {
                            measurements.delete(key);
                        }
                    } else if (key.startsWith("sector:") || key.startsWith("slice:")) {
                        measurements.delete(key);
                    }
                }
            } else if (scene.polarKind === "arc") {
                const arcScene = scene as PolarArcChartScene;
                if (arcScene.arcMode === "rose") {
                    const validKeys = new Set<string>();
                    if (arcScene.angularAxis) {
                        for (const tick of arcScene.angularAxis.ticks) {
                            validKeys.add(`angular:${tick.tickKey}`);
                            validKeys.add(`angular:${tick.value}`);
                        }
                    }
                    if (arcScene.radialAxis) {
                        for (const tick of arcScene.radialAxis.ticks) {
                            validKeys.add(`radial:${tick.tickKey}`);
                            validKeys.add(`radial:${tick.value}`);
                        }
                    }
                    for (const key of Array.from(measurements.keys())) {
                        if (key.startsWith("angular:") || key.startsWith("radial:")) {
                            if (!validKeys.has(key)) {
                                measurements.delete(key);
                            }
                        } else if (key.startsWith("sector:") || key.startsWith("slice:")) {
                            measurements.delete(key);
                        }
                    }
                } else {
                    for (const key of Array.from(measurements.keys())) {
                        if (
                            key.startsWith("angular:") ||
                            key.startsWith("radial:") ||
                            key.startsWith("sector:") ||
                            key.startsWith("slice:")
                        ) {
                            measurements.delete(key);
                        }
                    }
                }
            }
        } else {
            for (const key of Array.from(measurements.keys())) {
                if (
                    key.startsWith("axis:") ||
                    key.startsWith("sector:") ||
                    key.startsWith("slice:") ||
                    key.startsWith("angular:") ||
                    key.startsWith("radial:")
                ) {
                    measurements.delete(key);
                }
            }
        }
    }
}
