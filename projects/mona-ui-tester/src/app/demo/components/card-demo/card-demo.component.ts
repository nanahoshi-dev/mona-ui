import { NgComponentOutlet } from "@angular/common";
import { Component, inject, input, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CardActionDirective,
    CardComponent,
    CardContentDirective,
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
            active: true,
            code: ``,
            description: "Render card footer.",
            name: "Footer"
        },
        header: {
            active: true,
            code: ``,
            description: "Render card header.",
            name: "Header"
        }
    });
    protected readonly config = signal<ComponentConfig<CardComponent>>({
        inputs: {
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "xlarge", "xxlarge", "none"],
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
        CardActionDirective,
        CardContentDirective
    ],
    template: `
        @let featureData = features();
        <mona-card [rounded]="rounded()" class="w-96">
            @if (featureData["header"].active) {
                <mona-card-header>
                    <h3 class="font-semibold text-sm" *monaCardTitle="let id" [id]="id">Login to your account</h3>
                    <p class="text-sm text-foreground/70" *monaCardDescription="let id" [id]="id">
                        Enter your username below to login to your account
                    </p>
                    <button monaButton look="link" size="small" *monaCardAction>Sign up</button>
                </mona-card-header>
            }

            <div class="px-4 flex flex-col gap-4" *monaCardContent>
                <div class="flex flex-col gap-2">
                    <mona-label [for]="username">Username</mona-label>
                    <mona-text-box placeholder="Enter your username..." #username></mona-text-box>
                </div>
                <div class="flex flex-col gap-2">
                    <mona-label [for]="password">Password</mona-label>
                    <mona-text-box placeholder="Enter your password..." #password></mona-text-box>
                </div>
            </div>

            @if (featureData["footer"].active) {
                <mona-card-footer class="flex flex-col gap-2">
                    <button monaButton look="primary" size="small" class="w-full">Log in</button>
                    <button monaButton size="small" class="w-full">Log in with Google</button>
                </mona-card-footer>
            }
        </mona-card>
    `
})
export class CardWrapperComponent implements ComponentInputsAsSignal<CardComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly rounded = input<ReturnType<CardComponent["rounded"]>>("medium");
}
