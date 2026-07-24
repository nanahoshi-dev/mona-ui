import { NgComponentOutlet } from "@angular/common";
import { Component, inject, input, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CardActionDirective,
    CardComponent,
    CardDescriptionDirective,
    CardFooterComponent,
    CardHeaderComponent,
    CardTitleDirective
} from "@nanahoshi/mona-ui/card";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
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
    imports: [
        CardComponent,
        ButtonDirective,
        CardFooterComponent,
        CardHeaderComponent,
        LabelComponent,
        TextBoxComponent,
        CardTitleDirective,
        CardDescriptionDirective,
        CardActionDirective
    ],
    template: `
        @let featureData = features();
        <mona-card [rounded]="rounded()" class="w-72">
            @if (featureData["header"].active) {
                <mona-card-header>
                    <h3 class="font-semibold text-sm" *monaCardTitle>Card Title</h3>
                    <p class="text-sm text-foreground/70" *monaCardDescription>This is the card description.</p>
                    <button monaButton look="ghost" *monaCardAction>Sign up</button>
                </mona-card-header>
            }
            @if (featureData["footer"].active) {
                <mona-card-footer class="bg-gray-100 flex items-center justify-end">
                    <button monaButton>Accept</button>
                </mona-card-footer>
            }
            <div *monaCardDescription>
                <div class="p-2 flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <mona-label [for]="username">Username</mona-label>
                        <mona-text-box #username></mona-text-box>
                    </div>
                    <div class="flex flex-col gap-2">
                        <mona-label [for]="password">Password</mona-label>
                        <mona-text-box #password></mona-text-box>
                    </div>
                </div>
            </div>
        </mona-card>
    `
})
export class CardWrapperComponent implements ComponentInputsAsSignal<CardComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly rounded = input<ReturnType<CardComponent["rounded"]>>("medium");
}
