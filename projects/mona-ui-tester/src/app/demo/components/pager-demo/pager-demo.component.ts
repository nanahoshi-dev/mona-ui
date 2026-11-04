import { NgComponentOutlet } from "@angular/common";
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    linkedSignal,
    model,
    signal
} from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { DropdownListComponent, DropdownListValueTemplateDirective } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownItemTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import {
    type PageChangeEvent,
    PagerComponent,
    PagerInfoTemplateDirective,
    PagerNavigationButtonsTemplateDirective,
    PagerNumericButtonsTemplateDirective,
    PagerPageSizeTemplateDirective
} from "@nanahoshi/mona-ui/pager";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";

import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

const INFO_TEMPLATE_CODE = `<ng-template
    monaPagerInfoTemplate
    let-currentPage="currentPage"
    let-pageSize="pageSize"
    let-skip="skip"
    let-total="total"
    let-totalPages="totalPages">
    <div class="flex items-center justify-end flex-1">{{ currentPage }}/{{ totalPages }}</div>
</ng-template>`;

const FIRST_PAGE_BUTTON_TEMPLATE_CODE = `<ng-template
    monaPagerNavigationButtonsTemplate
    type="first"
    let-disabled="disabled"
    let-navigate="navigate">
    <button
        monaButton
        look="info"
        [rounded]="rounded()"
        [size]="size()"
        (click)="navigate()"
        [disabled]="disabled"
        class="mx-0.5">
        F
    </button>
</ng-template>`;

const NUMERIC_BUTTONS_TEMPLATE_CODE = `<ng-template
    monaPagerNumericButtonsTemplate
    let-totalPages="totalPages"
    let-currentPage="currentPage"
    let-goToPage="goToPage">
    <li class="flex items-center h-full px-2">
        <mona-slider
            aria-label="Page"
            [minValue]="1"
            [maxValue]="totalPages"
            [showTicks]="false"
            [showLabels]="false"
            [value]="currentPage"
            (valueChange)="goToPage($event)">
        </mona-slider>
    </li>
</ng-template>`;

const LAST_PAGE_BUTTON_TEMPLATE_CODE = `<ng-template
    monaPagerNavigationButtonsTemplate
    type="last"
    let-disabled="disabled"
    let-navigate="navigate">
    <button
        monaButton
        look="info"
        [rounded]="rounded()"
        [size]="size()"
        (click)="navigate()"
        [disabled]="disabled"
        class="mx-0.5">
        L
    </button>
</ng-template>`;

const NEXT_PAGE_BUTTON_TEMPLATE_CODE = `<ng-template
    monaPagerNavigationButtonsTemplate
    type="next"
    let-disabled="disabled"
    let-navigate="navigate">
    <button
        monaButton
        look="success"
        [rounded]="rounded()"
        [size]="size()"
        (click)="navigate()"
        [disabled]="disabled"
        class="mx-0.5">
        N
    </button>
</ng-template>`;

const PAGE_SIZE_TEMPLATE_CODE = `<ng-template
    monaPagerPageSizeTemplate
    let-pageSizeValues
    let-pageSize="pageSize"
    let-setPageSize="setPageSize">
    <mona-dropdown-list
        [data]="pageSizeValues"
        aria-label="Items per page"
        [value]="pageSize"
        (valueChange)="setPageSize($event)"
        class="w-28">
        <ng-template monaDropDownListValueTemplate let-dataItem>
            <span class="px-2 text-blue-400">{{ dataItem }}</span>
        </ng-template>
        <ng-template monaDropDownListItemTemplate let-dataItem>
            <span class="px-2">{{ dataItem }} / page</span>
        </ng-template>
    </mona-dropdown-list>
</ng-template>`;

const PREVIOUS_PAGE_BUTTON_TEMPLATE_CODE = `<ng-template
    monaPagerNavigationButtonsTemplate
    type="previous"
    let-disabled="disabled"
    let-navigate="navigate">
    <button
        monaButton
        look="success"
        [rounded]="rounded()"
        [size]="size()"
        (click)="navigate()"
        [disabled]="disabled"
        class="mx-0.5">
        P
    </button>
</ng-template>`;

@Component({
    selector: "app-pager-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./pager-demo.component.html"
})
export class PagerDemoComponent extends AbstractDemoComponent<PagerComponent> {
    readonly #injector = createFeatureInjector({
        firstPageButtonTemplate: {
            code: FIRST_PAGE_BUTTON_TEMPLATE_CODE,
            description: `
                This template is used to customize the first page button display.
                Only applicable when the firstLast input is set to true.
            `,
            name: "First Page Button Template",
            active: false
        },
        infoTemplate: {
            code: INFO_TEMPLATE_CODE,
            description: `This template is used to customize the pager info display.`,
            name: "Info Template",
            active: false
        },
        numericButtonsTemplate: {
            code: NUMERIC_BUTTONS_TEMPLATE_CODE,
            description: `
                This template is used to customize the numeric buttons display.
                Only applicable when the pager type is set to "numeric".
            `,
            name: "Numeric Buttons Template",
            active: false
        },
        lastPageButtonTemplate: {
            code: LAST_PAGE_BUTTON_TEMPLATE_CODE,
            description: `
                This template is used to customize the last page button display.
                Only applicable when the firstLast input is set to true.
            `,
            name: "Last Page Button Template",
            active: false
        },
        nextPageButtonTemplate: {
            code: NEXT_PAGE_BUTTON_TEMPLATE_CODE,
            description: `
                This template is used to customize the next page button display.
                Only applicable when the previousNext input is set to true.
            `,
            name: "Next Page Button Template",
            active: false
        },
        pageSizeTemplate: {
            code: PAGE_SIZE_TEMPLATE_CODE,
            description: `
                This template is used to customize the page size dropdown display.
            `,
            name: "Page Size Template",
            active: false
        },
        previousPageButtonTemplate: {
            code: PREVIOUS_PAGE_BUTTON_TEMPLATE_CODE,
            description: `
                This template is used to customize the previous page button display.
                Only applicable when the previousNext input is set to true.
            `,
            name: "Previous Page Button Template",
            active: false
        }
    });
    protected readonly config = computed<ComponentConfig<PagerComponent>>(() => ({
        inputs: deriveInputConfig<PagerComponent>(this.metadata(), {
            pageSize: {
                type: "number",
                value: 5,
                min: 1
            },
            pageSizeValues: {
                type: "dropdown",
                value: [true, false, [5, 10, 20, 50, 100], [10, 25, 50, 100, 200]],
                defaultValue: [5, 10, 20, 50, 100]
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
            skip: {
                type: "number",
                value: 0,
                min: 0
            },
            // The demo curates a total of 100 instead of the library's default of 0.
            total: {
                type: "number",
                value: 100,
                min: 0
            },
            type: {
                type: "dropdown",
                value: ["input", "numeric"],
                defaultValue: "numeric"
            },
            userClasses: {
                alias: "class",
                type: "string",
                value: ""
            },
            visiblePages: {
                type: "number",
                value: 5,
                min: 1
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("PagerComponent");
    protected readonly PagerWrapperComponent = PagerWrapperComponent;
}

@Component({
    imports: [
        PagerComponent,
        PagerInfoTemplateDirective,
        PagerNumericButtonsTemplateDirective,
        SliderComponent,
        PagerNavigationButtonsTemplateDirective,
        ButtonDirective,
        PagerPageSizeTemplateDirective,
        DropdownListComponent,
        DropdownListValueTemplateDirective,
        DropdownItemTemplateDirective
    ],
    template: `
        @let featureData = features();
        <div class="flex flex-col gap-4 w-full">
            <span class="text-4xl font-semibold inline-flex items-center justify-center">{{ page() }}</span>
            <mona-pager
                [firstLast]="firstLast()"
                [navigable]="navigable()"
                [pageInput]="pageInput()"
                [pageSize]="pageSizeValue()"
                [pageSizeValues]="pageSizeValues()"
                [previousNext]="previousNext()"
                [responsive]="responsive()"
                [rounded]="rounded()"
                [showInfo]="showInfo()"
                [size]="size()"
                [(skip)]="skipValue"
                [total]="total()"
                [type]="type()"
                [visiblePages]="visiblePages()"
                [class]="userClasses()"
                (pageChange)="onPageChange($event)">
                @if (featureData["infoTemplate"].active) {
                    <ng-template
                        monaPagerInfoTemplate
                        let-currentPage="currentPage"
                        let-pageSize="pageSize"
                        let-skip="skip"
                        let-total="total"
                        let-totalPages="totalPages">
                        <div class="flex items-center justify-end flex-1">{{ currentPage }}/{{ totalPages }}</div>
                    </ng-template>
                }
                @if (featureData["firstPageButtonTemplate"].active) {
                    <ng-template
                        monaPagerNavigationButtonsTemplate
                        type="first"
                        let-disabled="disabled"
                        let-navigate="navigate">
                        <button
                            monaButton
                            look="info"
                            [rounded]="rounded()"
                            [size]="size()"
                            (click)="navigate()"
                            [disabled]="disabled"
                            class="mx-0.5">
                            F
                        </button>
                    </ng-template>
                }
                @if (featureData["numericButtonsTemplate"].active) {
                    <ng-template
                        monaPagerNumericButtonsTemplate
                        let-totalPages="totalPages"
                        let-currentPage="currentPage"
                        let-goToPage="goToPage">
                        <li class="flex items-center h-full px-2">
                            <mona-slider
                                aria-label="Page"
                                [minValue]="1"
                                [maxValue]="totalPages"
                                [showTicks]="false"
                                [showLabels]="false"
                                [value]="currentPage"
                                (valueChange)="goToPage($event)">
                            </mona-slider>
                        </li>
                    </ng-template>
                }
                @if (featureData["lastPageButtonTemplate"].active) {
                    <ng-template
                        monaPagerNavigationButtonsTemplate
                        type="last"
                        let-disabled="disabled"
                        let-navigate="navigate">
                        <button
                            monaButton
                            look="info"
                            [rounded]="rounded()"
                            [size]="size()"
                            (click)="navigate()"
                            [disabled]="disabled"
                            class="mx-0.5">
                            L
                        </button>
                    </ng-template>
                }
                @if (featureData["nextPageButtonTemplate"].active) {
                    <ng-template
                        monaPagerNavigationButtonsTemplate
                        type="next"
                        let-disabled="disabled"
                        let-navigate="navigate">
                        <button
                            monaButton
                            look="success"
                            [rounded]="rounded()"
                            [size]="size()"
                            (click)="navigate()"
                            [disabled]="disabled"
                            class="mx-0.5">
                            N
                        </button>
                    </ng-template>
                }
                @if (featureData["pageSizeTemplate"].active) {
                    <ng-template
                        monaPagerPageSizeTemplate
                        let-pageSizeValues
                        let-pageSize="pageSize"
                        let-setPageSize="setPageSize">
                        <mona-dropdown-list
                            [data]="pageSizeValues"
                            aria-label="Items per page"
                            [value]="pageSize"
                            (valueChange)="setPageSize($event)"
                            class="w-28">
                            <ng-template monaDropDownListValueTemplate let-dataItem>
                                <span class="px-2 text-blue-400">{{ dataItem }}</span>
                            </ng-template>
                            <ng-template monaDropDownListItemTemplate let-dataItem>
                                <span class="px-2">{{ dataItem }} / page</span>
                            </ng-template>
                        </mona-dropdown-list>
                    </ng-template>
                }
                @if (featureData["previousPageButtonTemplate"].active) {
                    <ng-template
                        monaPagerNavigationButtonsTemplate
                        type="previous"
                        let-disabled="disabled"
                        let-navigate="navigate">
                        <button
                            monaButton
                            look="success"
                            [rounded]="rounded()"
                            [size]="size()"
                            (click)="navigate()"
                            [disabled]="disabled"
                            class="mx-0.5">
                            P
                        </button>
                    </ng-template>
                }
            </mona-pager>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: "w-full"
    }
})
class PagerWrapperComponent implements ComponentInputsAsSignal<PagerComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly page = signal(1);
    protected readonly pageSizeValue = linkedSignal({
        source: () => this.pageSize(),
        computation: pageSize => pageSize
    });
    protected readonly skipValue = linkedSignal({
        source: () => this.skip(),
        computation: skip => skip
    });
    public readonly firstLast = input(true, { transform: booleanAttribute });
    public readonly navigable = input(true, { transform: booleanAttribute });
    public readonly pageInput = input(false, { transform: booleanAttribute });
    public readonly pageSize = input<ReturnType<PagerComponent["pageSize"]>>(5);
    public readonly pageSizeValues = input<ReturnType<PagerComponent["pageSizeValues"]>>([5, 10, 20, 50, 100]);
    public readonly previousNext = input(true, { transform: booleanAttribute });
    public readonly responsive = input(true, { transform: booleanAttribute });
    public readonly rounded = input<ReturnType<PagerComponent["rounded"]>>("medium");
    public readonly showInfo = input(true, { transform: booleanAttribute });
    public readonly size = input<ReturnType<PagerComponent["size"]>>("medium");
    public readonly skip = model(0);
    public readonly total = input(0, { transform: (value: unknown) => Number(value) });
    public readonly type = input<ReturnType<PagerComponent["type"]>>("numeric");
    public readonly userClasses = input<ReturnType<PagerComponent["userClasses"]>>("");
    public readonly visiblePages = input(5, { transform: (value: unknown) => Number(value) });

    protected onPageChange(event: PageChangeEvent) {
        this.page.set(event.page);
        this.pageSizeValue.set(event.take);
    }
}
