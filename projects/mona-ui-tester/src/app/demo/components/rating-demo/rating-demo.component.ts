import { NgComponentOutlet } from "@angular/common";
import { Component, inject, input, model, signal } from "@angular/core";
import { LucideFlame, LucideHeart } from "@lucide/angular";
import {
    RatingComponent,
    RatingHoveredItemTemplateDirective,
    RatingItemTemplateDirective,
    RatingSelectedItemTemplateDirective
} from "@nanahoshi/mona-ui/rating";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-rating-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./rating-demo.component.html"
})
export class RatingDemoComponent extends AbstractDemoComponent<RatingComponent> {
    readonly #injector = createFeatureInjector({
        hoveredTemplate: {
            name: "Hovered Item Template",
            description:
                "This template allows you to customize the overlay shown while the user previews a value via pointer hover.",
            active: false
        },
        itemTemplate: {
            name: "Item Template",
            description: "This template allows you to customize the default (unselected) visual of every rating item.",
            active: false
        },
        selectedTemplate: {
            name: "Selected Item Template",
            description: "This template allows you to customize the overlay shown for the committed selected value.",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<RatingComponent>>({
        code: ``,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            icon: {
                type: "dropdown",
                value: ["star", "heart", "circle", "diamond", "flame"],
                defaultValue: "star"
            },
            itemsCount: {
                type: "number",
                min: 1,
                max: 10,
                nullable: false,
                value: 5
            },
            label: {
                type: "string",
                value: "Product rating"
            },
            labelPosition: {
                type: "dropdown",
                value: ["before", "after"],
                defaultValue: "after"
            },
            precision: {
                type: "dropdown",
                value: ["item", "half"],
                defaultValue: "item"
            },
            readonly: {
                type: "boolean",
                value: false
            },
            selection: {
                type: "dropdown",
                value: ["continuous", "single"],
                defaultValue: "continuous"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            value: {
                type: "number",
                min: 0,
                max: 10,
                nullable: false,
                value: 3
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("RatingComponent");
    protected readonly RatingWrapperComponent = RatingWrapperComponent;
}

@Component({
    imports: [
        RatingComponent,
        RatingItemTemplateDirective,
        RatingHoveredItemTemplateDirective,
        RatingSelectedItemTemplateDirective,
        LucideFlame,
        LucideHeart
    ],
    template: `
        @let featureData = features();
        <div class="flex w-full flex-col items-center gap-4">
            <mona-rating
                aria-label="Product rating"
                [disabled]="disabled()"
                [icon]="icon()"
                [itemsCount]="itemsCount()"
                [label]="label()"
                [labelPosition]="labelPosition()"
                [precision]="precision()"
                [readonly]="readonly()"
                [selection]="selection()"
                [size]="size()"
                [(value)]="value">
                @if (featureData["itemTemplate"].active) {
                    <ng-template monaRatingItemTemplate let-itemValue="itemValue">
                        <span
                            class="flex h-full w-full items-center justify-center rounded-full border border-border text-[10px] font-semibold text-muted-foreground">
                            {{ itemValue }}
                        </span>
                    </ng-template>
                }
                @if (featureData["hoveredTemplate"].active) {
                    <ng-template monaRatingHoveredItemTemplate>
                        <svg lucideFlame class="h-full w-full text-amber-500" fill="currentColor"></svg>
                    </ng-template>
                }
                @if (featureData["selectedTemplate"].active) {
                    <ng-template monaRatingSelectedItemTemplate>
                        <svg lucideHeart class="h-full w-full text-rose-500" fill="currentColor"></svg>
                    </ng-template>
                }
            </mona-rating>
            <span>Selected value: {{ value() }}</span>
        </div>
    `
})
class RatingWrapperComponent implements ComponentInputsAsSignal<RatingComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly disabled = input<ReturnType<RatingComponent["disabled"]>>(false);
    public readonly icon = input<ReturnType<RatingComponent["icon"]>>("star");
    public readonly itemsCount = input<ReturnType<RatingComponent["itemsCount"]>>(5);
    public readonly label = input<ReturnType<RatingComponent["label"]>>(null);
    public readonly labelPosition = input<ReturnType<RatingComponent["labelPosition"]>>("after");
    public readonly precision = input<ReturnType<RatingComponent["precision"]>>("item");
    public readonly readonly = input<ReturnType<RatingComponent["readonly"]>>(false);
    public readonly selection = input<ReturnType<RatingComponent["selection"]>>("continuous");
    public readonly size = input<ReturnType<RatingComponent["size"]>>("medium");
    public readonly value = model<ReturnType<RatingComponent["value"]>>(0);
}
