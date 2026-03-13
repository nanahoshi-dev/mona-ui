import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import { ChevronsRight, LucideAngularModule, Slash } from "lucide-angular";
import {
    BreadcrumbComponent,
    BreadcrumbItem,
    BreadcrumbItemComponent,
    BreadcrumbItemTemplateDirective,
    BreadcrumbSeparatorTemplateDirective
} from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-breadcrumb-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./breadcrumb-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbDemoComponent extends AbstractDemoComponent<BreadcrumbComponent> {
    readonly #injector = createFeatureInjector({
        itemTemplate: {
            code: ``,
            active: false,
            name: "Item Template",
            description: "Use a custom template for the breadcrumb items."
        },
        separatorTemplate: {
            code: ``,
            active: false,
            name: "Separator Icon",
            description: "Use a custom icon for the breadcrumb separator."
        }
    });
    readonly #itemSets = [
        {
            text: "Shopping",
            value: [
                { text: "Cart", title: "Cart" },
                { text: "Billing", title: "Billing" },
                { text: "Shipping", title: "Shipping" },
                { text: "Payment", title: "Payment" }
            ] as BreadcrumbItem[]
        }
    ];
    protected readonly BreadcrumbWrapperComponent = BreadcrumbWrapperComponent;
    protected readonly config = signal<ComponentConfig<BreadcrumbComponent>>({
        inputs: {
            items: {
                type: "customDropdown",
                textField: "text",
                valueField: "value",
                value: this.#itemSets,
                defaultValue: this.#itemSets[0].value
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("BreadcrumbComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [
        BreadcrumbComponent,
        BreadcrumbItemTemplateDirective,
        BreadcrumbSeparatorTemplateDirective,
        LucideAngularModule,
        BreadcrumbItemComponent
    ],
    template: `
        @let featureData = features();
        <mona-breadcrumb>
            @for (item of items(); track $index) {
                <mona-breadcrumb-item [disabled]="$index === 2">{{ item.text }}</mona-breadcrumb-item>
            }

            @if (featureData["itemTemplate"].active) {
                <ng-template monaBreadcrumbItemTemplate let-item>
                    <span class="text-violet-600 font-medium">{{ item.text }}</span>
                </ng-template>
            }
            @if (featureData["separatorTemplate"].active) {
                <ng-template monaBreadcrumbSeparatorTemplate>
                    <lucide-icon [img]="separatorIcon" [size]="16"></lucide-icon>
                </ng-template>
            }
        </mona-breadcrumb>
    `
})
class BreadcrumbWrapperComponent implements ComponentInputsAsSignal<BreadcrumbComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly separatorIcon = ChevronsRight;
    public readonly items = input<Iterable<BreadcrumbItem>>([]);
}
