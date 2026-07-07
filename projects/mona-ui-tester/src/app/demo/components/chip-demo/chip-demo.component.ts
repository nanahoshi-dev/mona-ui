import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, model, signal } from "@angular/core";
import { AvatarComponent } from "mona-ui";
import { ChipComponent, ChipPrefixTemplateDirective } from "mona-ui/chip";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-chip-demo",
    imports: [NgComponentOutlet, DemoContainerComponent],
    templateUrl: "./chip-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipDemoComponent extends AbstractDemoComponent<ChipComponent> {
    readonly #injector = createFeatureInjector({
        prefixTemplate: {
            code: ``,
            active: false,
            name: "Prefix Template",
            description: "Allows custom prefix content to be displayed before the chip label."
        }
    });
    protected readonly ChipWrapperComponent = ChipWrapperComponent;
    protected readonly config = signal<ComponentConfig<ChipComponent>>({
        code: `
             <mona-chip
                [look]="look()"
                [disabled]="disabled()"
                [removable]="removable()"
                [rounded]="rounded()"
                [size]="size()"
                [label]="label()"
                (remove)="onRemove($event)">
                Chip
            </mona-chip>
        `,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            look: {
                type: "dropdown",
                value: ["default", "outline", "primary", "success", "error", "warning", "info", "secondary", "ghost"],
                defaultValue: "default"
            },
            label: {
                type: "string",
                value: "Chip Label"
            },
            removable: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            selected: {
                type: "boolean",
                value: false
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            },
            toggleable: {
                type: "boolean",
                value: false
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ChipComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [ChipComponent, ChipPrefixTemplateDirective, AvatarComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-chip
            [disabled]="disabled()"
            [label]="label()"
            [look]="look()"
            [removable]="removable()"
            (remove)="onRemove($event)"
            [rounded]="rounded()"
            [selected]="selected()"
            (selectedChange)="onSelectedChange($event)"
            [size]="size()"
            [toggleable]="toggleable()">
            @if (featureData["prefixTemplate"].active) {
                <ng-template monaChipPrefixTemplate>
                    <mona-avatar
                        [label]="'N'"
                        [image]="'https://photos.smugmug.com/photos/i-fgmzcP4/0/LcnnHTpqhgGgTjHtbmvtjgmLWrVH2JhVGckRnpZqq/Th/i-fgmzcP4-Th.png'"
                        [width]="16"
                        [height]="16"
                        [borderRadius]="'50%'"
                        [borderWidth]="0"></mona-avatar>
                </ng-template>
            }
            Chip
        </mona-chip>
        <span>Selected: {{ isSelected() }}</span>
    `
})
export class ChipWrapperComponent implements ComponentInputsAsSignal<ChipComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly isSelected = linkedSignal(() => this.selected());
    public readonly disabled = input<ReturnType<ChipComponent["disabled"]>>(false);
    public readonly label = input<ReturnType<ChipComponent["label"]>>("Mona Chip");
    public readonly look = input<ReturnType<ChipComponent["look"]>>("default");
    public readonly removable = input<ReturnType<ChipComponent["removable"]>>(false);
    public readonly rounded = input<ReturnType<ChipComponent["rounded"]>>("medium");
    public readonly selected = model<ReturnType<ChipComponent["selected"]>>(false);
    public readonly size = input<ReturnType<ChipComponent["size"]>>("medium");
    public readonly toggleable = input<ReturnType<ChipComponent["toggleable"]>>(false);

    protected onRemove(event: Event): void {
        console.log("Chip removed", event);
    }

    protected onSelectedChange(selected: boolean): void {
        console.log("Chip selected changed", selected);
        this.isSelected.set(selected);
    }
}
