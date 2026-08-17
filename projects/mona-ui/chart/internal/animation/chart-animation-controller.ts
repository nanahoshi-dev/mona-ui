import type { ChartScene } from "../scene/chart-scene";
import { BrowserAnimationClock, type ChartAnimationClock } from "./chart-animation-clock";
import { getEasingFunction } from "./chart-easing";
import type {
    ChartAnimationCancelMode,
    ChartAnimationRenderFrame,
    ChartTransitionPlan
} from "./chart-transition-types";
import { SceneTransitionSampler } from "./scene-transition-sampler";

export interface ChartAnimationCallbacks {
    onComplete: (targetScene: ChartScene) => void;
    onFrame: (frame: ChartAnimationRenderFrame) => void;
}

export class ChartAnimationController {
    readonly #clock: ChartAnimationClock;
    #activePlan: ChartTransitionPlan | null = null;
    #callbacks: ChartAnimationCallbacks | null = null;
    #currentFrame: ChartAnimationRenderFrame | null = null;
    #frameId: number | null = null;
    #startTime: number = 0;

    public constructor(clock: ChartAnimationClock = new BrowserAnimationClock()) {
        this.#clock = clock;
    }

    public currentScene(): ChartScene | null {
        return this.#currentFrame?.scene ?? this.#activePlan?.toScene ?? null;
    }

    public isRunning(): boolean {
        return this.#frameId !== null && this.#activePlan !== null;
    }

    public start(plan: ChartTransitionPlan, callbacks: ChartAnimationCallbacks): void {
        this.cancel("keep-current");

        this.#activePlan = plan;
        this.#callbacks = callbacks;
        this.#startTime = this.#clock.now();

        if (plan.mode === "immediate" || plan.duration <= 0) {
            const finalFrame: ChartAnimationRenderFrame = {
                mode: plan.mode,
                progress: 1,
                scene: plan.toScene,
                toScene: plan.toScene
            };
            this.#currentFrame = finalFrame;
            callbacks.onFrame(finalFrame);
            callbacks.onComplete(plan.toScene);
            this.#activePlan = null;
            this.#callbacks = null;
            return;
        }

        // Produce initial frame
        const easingFn = getEasingFunction(plan.easing);
        const initialEasedProgress = easingFn(0);
        const initialFrame = SceneTransitionSampler.sampleFrame(plan, initialEasedProgress);
        this.#currentFrame = initialFrame;
        callbacks.onFrame(initialFrame);

        // Schedule RAF
        this.#scheduleNextFrame();
    }

    public retarget(newPlan: ChartTransitionPlan, callbacks: ChartAnimationCallbacks): void {
        this.start(newPlan, callbacks);
    }

    public cancel(mode: ChartAnimationCancelMode = "finish-target"): void {
        if (this.#frameId !== null) {
            this.#clock.cancelFrame(this.#frameId);
            this.#frameId = null;
        }

        const activePlan = this.#activePlan;
        const callbacks = this.#callbacks;

        this.#activePlan = null;
        this.#callbacks = null;

        if (mode === "finish-target" && activePlan && callbacks) {
            const finalFrame: ChartAnimationRenderFrame = {
                mode: activePlan.mode,
                progress: 1,
                scene: activePlan.toScene,
                toScene: activePlan.toScene
            };
            this.#currentFrame = finalFrame;
            callbacks.onFrame(finalFrame);
            callbacks.onComplete(activePlan.toScene);
        }
    }

    public finish(): void {
        this.cancel("finish-target");
    }

    public destroy(): void {
        if (this.#frameId !== null) {
            this.#clock.cancelFrame(this.#frameId);
            this.#frameId = null;
        }
        this.#activePlan = null;
        this.#callbacks = null;
        this.#currentFrame = null;
    }

    #scheduleNextFrame(): void {
        this.#frameId = this.#clock.requestFrame(timestamp => {
            this.#frameId = null;
            this.#onTick(timestamp);
        });
    }

    #onTick(timestamp: number): void {
        if (!this.#activePlan || !this.#callbacks) {
            return;
        }

        const duration = this.#activePlan.duration;
        const elapsed = timestamp - this.#startTime;
        const rawProgress = duration > 0 ? Math.max(0, Math.min(1, elapsed / duration)) : 1;

        const easingFn = getEasingFunction(this.#activePlan.easing);
        const easedProgress = easingFn(rawProgress);

        if (rawProgress >= 1) {
            // Final frame must be exact target scene
            const finalFrame: ChartAnimationRenderFrame = {
                mode: this.#activePlan.mode,
                progress: 1,
                scene: this.#activePlan.toScene,
                toScene: this.#activePlan.toScene
            };
            this.#currentFrame = finalFrame;
            const cb = this.#callbacks;
            const targetScene = this.#activePlan.toScene;
            this.#activePlan = null;
            this.#callbacks = null;

            cb.onFrame(finalFrame);
            cb.onComplete(targetScene);
            return;
        }

        const frame = SceneTransitionSampler.sampleFrame(this.#activePlan, easedProgress);
        this.#currentFrame = frame;
        this.#callbacks.onFrame(frame);

        this.#scheduleNextFrame();
    }
}
