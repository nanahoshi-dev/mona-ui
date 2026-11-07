import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
    LucideChevronsRight,
    LucideCircleCheck,
    LucideCreditCard,
    LucideDownload,
    LucideDynamicIcon,
    LucideFolder,
    LucideHardDrive,
    type LucideIconInput,
    LucideShoppingCart,
    LucideSlash,
    LucideTruck,
    LucideUser
} from "@lucide/angular";
import {
    BreadcrumbComponent,
    BreadcrumbItemComponent,
    BreadcrumbLinkDirective,
    BreadcrumbSeparatorTemplateDirective
} from "@nanahoshi/mona-ui/breadcrumb";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

interface BreadcrumbDemoItem {
    disabled?: boolean;
    icon: LucideIconInput;
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
            dropdownDataSource: ["Shopping", "File Tree", "Deep Path"],
            dropdownValue: "Shopping"
        },
        links: {
            code: `<mona-breadcrumb-item>
    <a monaBreadcrumbLink routerLink="/products">Products</a>
</mona-breadcrumb-item>`,
            active: false,
            name: "Links",
            description: "Render each item as a real link through monaBreadcrumbLink."
        },
        separatorTemplate: {
            code: ``,
            active: false,
            name: "Separator Icon",
            description: "Use a custom icon for the breadcrumb separator."
        }
    });
    protected readonly BreadcrumbWrapperComponent = BreadcrumbWrapperComponent;
    protected readonly config = computed<ComponentConfig<BreadcrumbComponent>>(() => ({
        inputs: deriveInputConfig<BreadcrumbComponent>(this.metadata(), {
            ariaLabel: {
                alias: "aria-label",
                type: "string",
                value: "Breadcrumb"
            },
            maxItems: {
                type: "number",
                value: null,
                nullable: true,
                min: 0,
                max: 10
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("BreadcrumbComponent");
}

@Component({
    imports: [
        BreadcrumbComponent,
        BreadcrumbLinkDirective,
        BreadcrumbSeparatorTemplateDirective,
        BreadcrumbItemComponent,
        LucideDynamicIcon,
        RouterLink
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-breadcrumb
            [aria-label]="ariaLabel()"
            [disabled]="disabled()"
            [lastItemCurrent]="lastItemCurrent()"
            [maxItems]="maxItems()"
            [class]="userClass()">
            @for (item of items(); track item.text) {
                <mona-breadcrumb-item [disabled]="item.disabled ?? false" (itemClick)="onItemClick(item)">
                    @if (featureData["links"].active) {
                        <a monaBreadcrumbLink [routerLink]="[]" [fragment]="item.text">{{ item.text }}</a>
                    } @else {
                        <span [title]="item.title">
                            <svg class="me-2 align-text-bottom" [lucideIcon]="item.icon" [size]="16"></svg>
                            {{ item.text }}
                        </span>
                    }
                </mona-breadcrumb-item>
            }
            @if (featureData["separatorTemplate"].active) {
                <ng-template monaBreadcrumbSeparatorTemplate>
                    <svg [lucideIcon]="separatorIcon()" [size]="16"></svg>
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
                { text: "Cart", title: "Cart", icon: LucideShoppingCart },
                { text: "Billing", title: "Billing", icon: LucideCreditCard },
                { text: "Shipping", title: "Shipping", icon: LucideTruck },
                { text: "Complete", title: "Complete", icon: LucideCircleCheck, disabled: true }
            ] as BreadcrumbDemoItem[]
        },
        {
            text: "File Tree",
            value: [
                { text: "C", title: "C", icon: LucideHardDrive },
                { text: "User", title: "User", icon: LucideUser },
                { text: "Downloads", title: "Downloads", icon: LucideDownload }
            ] as BreadcrumbDemoItem[]
        },
        {
            text: "Deep Path",
            value: [
                { text: "C", title: "C", icon: LucideHardDrive },
                { text: "Users", title: "Users", icon: LucideUser },
                { text: "Projects", title: "Projects", icon: LucideFolder },
                { text: "Enterprise Readiness", title: "Enterprise Readiness", icon: LucideFolder },
                { text: "Navigation and Containers", title: "Navigation and Containers", icon: LucideFolder },
                { text: "A rather long name for the page you are on", title: "Current page", icon: LucideFolder }
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
        return dataSet === "Shopping" ? LucideChevronsRight : LucideSlash;
    });
    public readonly ariaLabel = input<ReturnType<BreadcrumbComponent["ariaLabel"]>>("Breadcrumb");
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly lastItemCurrent = input(true, { transform: booleanAttribute });
    public readonly maxItems = input<ReturnType<BreadcrumbComponent["maxItems"]>, unknown>(null, {
        transform: value => (value == null ? null : Number(value))
    });
    public readonly userClass = input<ReturnType<BreadcrumbComponent["userClass"]>>("");

    protected onItemClick(item: BreadcrumbDemoItem) {
        console.log(`Item clicked: ${item.text}`);
    }
}
