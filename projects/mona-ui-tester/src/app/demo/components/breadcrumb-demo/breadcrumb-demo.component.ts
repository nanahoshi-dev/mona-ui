import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import {
    ChevronsRight,
    CircleCheck,
    CreditCard,
    Download,
    File,
    HardDrive,
    LucideAngularModule,
    LucideIconData,
    Music,
    ShoppingCart,
    Slash,
    Truck,
    User
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
        dataSet: {
            code: ``,
            hasCode: false,
            active: false,
            description: `Sets a predefined data set for the breadcrumb.`,
            name: "Data Set",
            type: "dropdown",
            dropdownDataSource: ["Shopping", "File Tree"],
            dropdownValue: "Shopping"
        },
        separatorTemplate: {
            code: ``,
            active: false,
            name: "Separator Icon",
            description: "Use a custom icon for the breadcrumb separator."
        }
    });
    protected readonly BreadcrumbWrapperComponent = BreadcrumbWrapperComponent;
    protected readonly config = signal<ComponentConfig<BreadcrumbComponent>>({
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("BreadcrumbComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata(["BreadcrumbItemComponent"]);
}

@Component({
    imports: [BreadcrumbComponent, BreadcrumbSeparatorTemplateDirective, LucideAngularModule, BreadcrumbItemComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-breadcrumb [disabled]="disabled()">
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
                    <lucide-icon [img]="separatorIcon()" [size]="16"></lucide-icon>
                </ng-template>
            }
        </mona-breadcrumb>
    `
})
class BreadcrumbWrapperComponent implements ComponentInputsAsSignal<BreadcrumbComponent> {
    readonly #itemSets = [
        {
            text: "Shopping",
            value: [
                { text: "Cart", title: "Cart", icon: ShoppingCart },
                { text: "Billing", title: "Billing", icon: CreditCard },
                { text: "Shipping", title: "Shipping", icon: Truck },
                { text: "Complete", title: "Complete", icon: CircleCheck }
            ] as BreadcrumbDemoItem[]
        },
        {
            text: "File Tree",
            value: [
                { text: "C", title: "C", icon: HardDrive },
                { text: "User", title: "User", icon: User },
                { text: "Downloads", title: "Downloads", icon: Download }
            ] as BreadcrumbDemoItem[]
        }
    ];
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly items = computed(() => {
        const dataSet = this.features()["dataSet"].dropdownValue;
        return this.#itemSets.find(itemSet => itemSet.text === dataSet)?.value ?? [];
    });
    protected readonly separatorIcon = computed(() => {
        const dataSet = this.features()["dataSet"].dropdownValue;
        return dataSet === "Shopping" ? ChevronsRight : Slash;
    });
    public readonly disabled = input<ReturnType<BreadcrumbComponent["disabled"]>>(false);

    protected onItemClick(item: BreadcrumbDemoItem) {
        console.log(`Item clicked: ${item.text}`);
    }
}
