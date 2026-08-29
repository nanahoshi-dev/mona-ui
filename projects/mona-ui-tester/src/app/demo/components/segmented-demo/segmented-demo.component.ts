import { NgComponentOutlet } from "@angular/common";
import { Component, computed, inject, input, model } from "@angular/core";
import {
    LucideBell,
    LucideDynamicIcon,
    type LucideIconInput,
    LucideLock,
    LucidePlus,
    LucideUser,
    LucideUserCog
} from "@lucide/angular";
import {
    SegmentedComponent,
    SegmentedItemTemplateDirective,
    type SegmentedOption,
    type SegmentedValue
} from "@nanahoshi/mona-ui/segmented";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-segmented-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./segmented-demo.component.html"
})
export class SegmentedDemoComponent extends AbstractDemoComponent<SegmentedComponent> {
    readonly #injector = createFeatureInjector({
        itemTemplate: {
            name: "Item Template",
            description: "This template allows you to customize the visual content of every segmented option.",
            active: false
        }
    });
    protected readonly config = computed<ComponentConfig<SegmentedComponent>>(() => ({
        inputs: deriveInputConfig<SegmentedComponent>(this.metadata(), {
            alignment: {
                type: "dropdown",
                value: ["start", "center", "end", "stretch"],
                defaultValue: "stretch"
            },
            ariaLabel: {
                alias: "aria-label",
                type: "string",
                value: "Course section"
            },
            ariaLabelledBy: {
                alias: "aria-labelledby",
                type: "string",
                value: ""
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            },
            value: {
                type: "dropdown",
                value: ["personal", "premium", "account", "security", "notifications"],
                defaultValue: "security"
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SegmentedComponent");
    protected readonly SegmentedWrapperComponent = SegmentedWrapperComponent;
}

@Component({
    imports: [SegmentedComponent, SegmentedItemTemplateDirective, LucideDynamicIcon],
    template: `
        @let featureData = features();
        <div class="flex w-full flex-col items-center gap-4">
            <mona-segmented
                [aria-label]="ariaLabel()"
                [aria-labelledby]="ariaLabelledBy()"
                [alignment]="alignment()"
                [animate]="animate()"
                [disabled]="disabled()"
                [invalid]="invalid()"
                [options]="options()"
                [rounded]="rounded()"
                [size]="size()"
                [touched]="touched()"
                [(value)]="value"
                [class]="'w-full ' + userClass()">
                @if (featureData["itemTemplate"].active) {
                    <ng-template monaSegmentedItemTemplate let-option>
                        <span class="flex items-center gap-1.5">
                            <svg [lucideIcon]="iconMap[option.value]" [size]="16"></svg>
                            {{ option.label }}
                        </span>
                    </ng-template>
                }
            </mona-segmented>
            <span>Selected value: {{ value() }}</span>
        </div>
    `
})
class SegmentedWrapperComponent implements ComponentInputsAsSignal<SegmentedComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly iconMap: Record<SegmentedOption["value"], LucideIconInput> = {
        personal: LucideUser,
        premium: LucidePlus,
        account: LucideUserCog,
        security: LucideLock,
        notifications: LucideBell
    };

    public readonly alignment = input<ReturnType<SegmentedComponent["alignment"]>>("stretch");
    public readonly animate = input(true);
    public readonly ariaLabel = input<ReturnType<SegmentedComponent["ariaLabel"]>>("Course section");
    public readonly ariaLabelledBy = input<ReturnType<SegmentedComponent["ariaLabelledBy"]>>("");
    public readonly disabled = input(false);
    public readonly invalid = input(false);
    public readonly options = input<readonly SegmentedOption[]>([
        { label: "Personal", value: "personal" },
        { label: "Premium Features", value: "premium", disabled: true },
        { label: "Account", value: "account" },
        { label: "Security", value: "security" },
        { label: "Notifications", value: "notifications" }
    ]);
    public readonly rounded = input<ReturnType<SegmentedComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<SegmentedComponent["size"]>>("medium");
    public readonly touched = input(false);
    public readonly userClass = input<ReturnType<SegmentedComponent["userClass"]>>("");
    public readonly value = model<SegmentedValue | null>("security");
}
