import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, signal } from "@angular/core";
import {
    ChevronsRight,
    CircleCheck,
    CreditCard,
    LucideAngularModule,
    LucideIconData,
    ShoppingCart,
    Truck
} from "lucide-angular";
import { BreadcrumbComponent, BreadcrumbItemComponent, BreadcrumbSeparatorTemplateDirective } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

interface BreadcrumbDemoItem {
    icon: LucideIconData;
    text: string;
    title: string;
}

@Component({
    selector: "app-breadcrumb-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./breadcrumb-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbDemoComponent extends AbstractDemoComponent<BreadcrumbComponent> {
    readonly #injector = createFeatureInjector({
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
                { text: "Cart", title: "Cart", icon: ShoppingCart },
                { text: "Billing", title: "Billing", icon: CreditCard },
                { text: "Shipping", title: "Shipping", icon: Truck },
                { text: "Complete", title: "Complete", icon: CircleCheck }
            ] as BreadcrumbDemoItem[]
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
    imports: [BreadcrumbComponent, BreadcrumbSeparatorTemplateDirective, LucideAngularModule, BreadcrumbItemComponent],
    template: `
        @let featureData = features();
        <mona-breadcrumb>
            @for (item of items(); track $index) {
                <mona-breadcrumb-item [disabled]="$index === 3" (itemClick)="onItemClick(item)">
                    <div class="flex flex-row gap-2 items-center">
                        <lucide-icon [img]="item.icon" [size]="16"></lucide-icon>
                        <span [title]="item.title">{{ item.text }}</span>
                    </div>
                </mona-breadcrumb-item>
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
    public readonly items = input<Iterable<BreadcrumbDemoItem>>([]);

    protected onItemClick(item: BreadcrumbDemoItem) {
        console.log(`Item clicked: ${item.text}`);
    }
}
