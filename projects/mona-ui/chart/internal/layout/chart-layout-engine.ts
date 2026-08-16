import type { ChartScene } from "../scene/chart-scene";
import { CartesianLayoutEngine, type CartesianLayoutOptions } from "./cartesian-layout-engine";

export class ChartLayoutEngine {
    public static computeScene(options: CartesianLayoutOptions): ChartScene {
        return CartesianLayoutEngine.computeScene(options);
    }
}
