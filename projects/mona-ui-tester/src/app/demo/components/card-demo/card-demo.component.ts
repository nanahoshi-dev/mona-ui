import { NgComponentOutlet } from "@angular/common";
import { Component, inject, input, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { CardComponent, CardFooterComponent, CardHeaderComponent } from "@nanahoshi/mona-ui/card";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-card-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./card-demo.component.html"
})
export class CardDemoComponent extends AbstractDemoComponent<CardComponent> {
    readonly #injector = createFeatureInjector({
        footer: {
            active: false,
            code: ``,
            description: "Render card footer.",
            name: "Footer"
        },
        header: {
            active: false,
            code: ``,
            description: "Render card header.",
            name: "Header"
        }
    });
    protected readonly config = signal<ComponentConfig<CardComponent>>({
        inputs: {
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "none"],
                defaultValue: "medium"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("CardComponent");
    protected readonly CardWrapperComponent = CardWrapperComponent;
}

@Component({
    imports: [CardComponent, ButtonDirective, CardFooterComponent, CardHeaderComponent],
    template: `
        @let featureData = features();
        <mona-card [rounded]="rounded()" class="w-72">
            @if (featureData["footer"].active) {
                <mona-card-footer class="bg-red-300">
                    <button monaButton>Accept</button>
                </mona-card-footer>
            }
            @if (featureData["header"].active) {
                <mona-card-header class="bg-red-300">
                    <button monaButton>Accept</button>
                </mona-card-header>
            }
        </mona-card>
    `
})
export class CardWrapperComponent implements ComponentInputsAsSignal<CardComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly rounded = input<ReturnType<CardComponent["rounded"]>>("medium");
}
