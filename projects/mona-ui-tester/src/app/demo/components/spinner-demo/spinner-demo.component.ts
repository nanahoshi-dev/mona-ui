import { NgComponentOutlet } from "@angular/common";
import { Component, ElementRef, inject, input, signal, viewChild } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    SpinnerComponent,
    type SpinnerRef,
    SpinnerService
} from "@nanahoshi/mona-ui/spinner";
import { timer } from "rxjs";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-spinner-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./spinner-demo.component.html"
})
export class SpinnerDemoComponent extends AbstractDemoComponent<SpinnerComponent> {
    readonly #injector = createFeatureInjector({});

    protected readonly config = signal<ComponentConfig<SpinnerComponent>>({
        code: `
            <mona-spinner
                [appearance]="appearance()"
                [size]="size()"
                [decorative]="decorative()">
            </mona-spinner>
        `,
        inputs: {
            appearance: {
                type: "dropdown",
                value: ["default", "pulsing", "infinite-spinner", "converging-spinner"],
                defaultValue: "default"
            },
            decorative: {
                type: "boolean",
                value: false
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SpinnerComponent");
    protected readonly SpinnerWrapperComponent = SpinnerWrapperComponent;
}

@Component({
    imports: [SpinnerComponent, ButtonDirective],
    template: `
        <div class="flex flex-col gap-6 w-full max-w-lg items-center">
            <!-- Inline Component Preview -->
            <div class="flex flex-col items-center gap-3 p-6 rounded-lg border border-border bg-card w-full">
                <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inline Component Preview</span>
                <div class="flex items-center gap-3 p-4">
                    <mona-spinner
                        [appearance]="appearance()"
                        [size]="size()"
                        [decorative]="decorative()"
                        class="text-primary">
                    </mona-spinner>
                    <span class="text-sm font-medium">Processing request...</span>
                </div>
            </div>

            <!-- Imperative Service Showcase -->
            <div #panel class="relative flex flex-col gap-3 p-6 rounded-lg border border-border bg-card w-full min-h-48 justify-center items-center">
                <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Element Container</span>
                <p class="text-sm text-center text-muted-foreground">
                    Click buttons below to trigger SpinnerService loading overlays over this container or full-page.
                </p>

                <div class="flex flex-wrap gap-2 justify-center mt-2">
                    <button monaButton size="small" (click)="showLocalSpinner()">Element Overlay (3s)</button>
                    <button monaButton size="small" look="secondary" (click)="showCancellableSpinner()">Cancellable Overlay</button>
                    <button monaButton size="small" look="outline" (click)="testConcurrency()">Concurrency Test</button>
                    <button monaButton size="small" look="ghost" (click)="showFullPageSpinner()">Full Page (2s)</button>
                    <button monaButton size="small" look="outline" (click)="trackRxJs()">RxJS track()</button>
                </div>
            </div>
        </div>
    `
})
class SpinnerWrapperComponent implements ComponentInputsAsSignal<SpinnerComponent> {
    readonly #spinnerService = inject(SpinnerService);
    protected readonly panelRef = viewChild<ElementRef<HTMLElement>>("panel");

    public readonly appearance = input<ReturnType<SpinnerComponent["appearance"]>>("default");
    public readonly decorative = input<ReturnType<SpinnerComponent["decorative"]>>(false);
    public readonly size = input<ReturnType<SpinnerComponent["size"]>>("medium");

    protected showCancellableSpinner(): void {
        const target = this.panelRef()?.nativeElement;
        if (!target) return;

        this.#spinnerService.show({
            target,
            appearance: this.appearance(),
            size: this.size(),
            text: "Loading records (click cancel to abort)...",
            cancellable: {
                text: "Cancel Operation",
                onCancel: () => console.log("Spinner cancelled by user")
            }
        });
    }

    protected showFullPageSpinner(): void {
        const ref = this.#spinnerService.show({
            appearance: this.appearance(),
            size: "large",
            text: "Processing full-page request...",
            cancellable: true
        });

        setTimeout(() => {
            ref.close();
        }, 2000);
    }

    protected showLocalSpinner(): void {
        const target = this.panelRef()?.nativeElement;
        if (!target) return;

        const ref = this.#spinnerService.show({
            target,
            appearance: this.appearance(),
            size: this.size(),
            text: "Fetching data..."
        });

        setTimeout(() => {
            ref.close();
        }, 3000);
    }

    protected testConcurrency(): void {
        const target = this.panelRef()?.nativeElement;
        if (!target) return;

        // Operation A (takes 4s)
        const refA = this.#spinnerService.show({
            target,
            appearance: "default",
            text: "Operation A (4s)"
        });

        // Operation B starts 1s later (takes 1.5s)
        setTimeout(() => {
            const refB = this.#spinnerService.show({
                target,
                appearance: "pulsing",
                text: "Operation B (1.5s)"
            });

            setTimeout(() => {
                refB.close(); // When B closes, presentation falls back to A!
            }, 1500);
        }, 1000);

        setTimeout(() => {
            refA.close(); // When A closes, overlay is removed
        }, 4000);
    }

    protected trackRxJs(): void {
        const target = this.panelRef()?.nativeElement;
        if (!target) return;

        this.#spinnerService
            .track(timer(2500), {
                target,
                appearance: this.appearance(),
                text: "RxJS tracked observable (2.5s)..."
            })
            .subscribe();
    }
}
