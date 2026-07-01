import { NgClass, NgTemplateOutlet } from "@angular/common";
import {
    afterRenderEffect,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    linkedSignal,
    output,
    Signal,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
    LucideChevronLeft,
    LucideChevronRight,
    LucideChevronsLeft,
    LucideChevronsRight,
    LucideEllipsis
} from "@lucide/angular";
import { range } from "@mirei/ts-collections";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { DropDownVirtualScrollDirective } from "../../../dropdowns/directives/drop-down-virtual-scroll.directive";
import { DropdownListComponent } from "../../../dropdowns/drop-down-list/components/dropdown-list/dropdown-list.component";
import { DropDownListValueTemplateDirective } from "../../../dropdowns/drop-down-list/directives/drop-down-list-value-template.directive";
import { NumericTextBoxComponent } from "../../../inputs/numeric-text-box/components/numeric-text-box/numeric-text-box.component";
import { SlicePipe } from "../../../pipes/slice.pipe";
import { ThemeService } from "../../../theme/services/theme.service";
import { PagerInfoTemplateDirective } from "../../directives/pager-info-template.directive";
import { PagerNavigationButtonsTemplateDirective } from "../../directives/pager-navigation-buttons-template.directive";
import { PagerNumericButtonsTemplateDirective } from "../../directives/pager-numeric-buttons-template.directive";
import { PagerPageSizeTemplateDirective } from "../../directives/pager-page-size-template.directive";
import type { InfoTemplateContext } from "../../models/InfoTemplateContext";
import { Page } from "../../models/Page";
import { PageChangeEvent } from "../../models/PageChangeEvent";
import { PagerType } from "../../models/PagerType";
import { PageSizeChangeEvent } from "../../models/PageSizeChangeEvent";
import {
    pagerBaseThemeVariants,
    pagerInfoThemeVariants,
    pagerInputThemeVariants,
    pagerListThemeVariants,
    type PagerVariantInputs,
    type PagerVariantProps
} from "../../styles/pager.styles";

@Component({
    selector: "mona-pager",
    templateUrl: "./pager.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonDirective,
        NgClass,
        NumericTextBoxComponent,
        FormsModule,
        DropdownListComponent,
        SlicePipe,
        DropDownVirtualScrollDirective,
        NgTemplateOutlet,
        DropDownListValueTemplateDirective,
        LucideEllipsis,
        LucideChevronsLeft,
        LucideChevronLeft,
        LucideChevronRight,
        LucideChevronsRight
    ],
    host: {
        "[class]": "baseClasses()"
    }
})
export class PagerComponent implements PagerVariantInputs {
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #infoVisible = signal(true);
    readonly #skip = linkedSignal({
        source: () => this.skip(),
        computation: skip => skip
    });
    readonly #themeService = inject(ThemeService);
    #widthObserver: ResizeObserver | null = null;
    #previousPageSize = 10;
    private readonly navigationButtonsTemplateList = contentChildren(PagerNavigationButtonsTemplateDirective);
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const userClasses = this.userClasses();
        const classes = pagerBaseThemeVariants(theme)({ rounded });
        return twMerge(classes, userClasses);
    });
    protected readonly firstPageNavigationTemplate = computed(() => {
        const navigationTemplates = this.navigationButtonsTemplateList();
        return navigationTemplates.find(t => t.type() === "first");
    });
    protected readonly iconSize = computed(() => {
        const size = this.size();
        switch (size) {
            case "small":
                return 18;
            case "medium":
                return 20;
            case "large":
                return 22;
            default:
                return 20;
        }
    });
    protected readonly infoClasses = computed(() => {
        const theme = this.#themeService.theme();
        return pagerInfoThemeVariants(theme)();
    });
    protected readonly infoVisible = computed(() => {
        const showInfo = this.showInfo();
        const visible = this.#infoVisible();
        return showInfo && visible;
    });
    protected readonly inputClasses = computed(() => {
        const theme = this.#themeService.theme();
        return pagerInputThemeVariants(theme)();
    });
    protected readonly inputValue = linkedSignal({
        source: () => this.page(),
        computation: page => page
    });
    protected readonly lastPageNavigationTemplate = computed(() => {
        const navigationTemplates = this.navigationButtonsTemplateList();
        return navigationTemplates.find(t => t.type() === "last");
    });
    protected readonly listClasses = computed(() => {
        const theme = this.#themeService.theme();
        return pagerListThemeVariants(theme)();
    });
    protected readonly nextJumperVisible = computed(() => {
        const pages = this.pages();
        const visiblePages = this.visiblePages();
        return pages.length > visiblePages && pages[pages.length - 1].page - pages[pages.length - 2].page > 1;
    });
    protected readonly nextPageNavigationTemplate = computed(() => {
        const navigationTemplates = this.navigationButtonsTemplateList();
        return navigationTemplates.find(t => t.type() === "next");
    });
    protected readonly numericButtonsTemplate = contentChild(PagerNumericButtonsTemplateDirective);
    protected readonly page = computed(() => Math.floor(this.#skip() / this.pagerPageSize()) + 1);
    protected readonly pageCount = computed(() => Math.ceil(this.total() / this.pagerPageSize()));
    protected readonly pageInputVisible = signal(true);
    protected readonly pageList = computed(() => {
        return range(1, this.pageCount()).toArray();
    });
    protected readonly pageListVisible = signal(true);
    protected readonly pageSizeDropdownList: Signal<DropdownListComponent<number> | undefined> =
        viewChild("pageSizeDropdownList");
    protected readonly pageSizeDropdownData = computed(() => {
        const values = this.pageSizeValues();
        if (values === false || (Array.isArray(values) && values.length === 0)) {
            return [] as number[];
        }
        if (Array.isArray(values)) {
            return values;
        }
        return [5, 10, 20, 50, 100] as number[];
    });
    protected readonly pageSizeTemplate = contentChild(PagerPageSizeTemplateDirective, { read: TemplateRef });
    protected readonly pagerInfo = computed(() => {
        const start = (this.page() - 1) * this.pagerPageSize() + 1;
        const end = Math.min(this.page() * this.pagerPageSize(), this.total());
        return `${start} - ${end} of ${this.total()} items`;
    });
    protected readonly pagerInfoTemplate = contentChild(PagerInfoTemplateDirective);
    protected readonly pagerInfoTemplateContext = computed(() => {
        return {
            currentPage: this.page(),
            pageSize: this.pagerPageSize(),
            skip: this.#skip(),
            total: this.total(),
            totalPages: this.pageCount()
        } as InfoTemplateContext;
    });
    protected readonly pagerPageSize = linkedSignal({
        source: () => this.pageSize(),
        computation: pageSize => pageSize
    });
    protected readonly pages = computed(() => {
        return this.preparePages(this.page(), this.visiblePages(), this.pageCount());
    });
    protected readonly previousJumperVisible = computed(
        () => this.pages().length > this.visiblePages() && this.pages()[1].page - 1 > 1
    );
    protected readonly previousPageNavigationTemplate = computed(() => {
        const navigationTemplates = this.navigationButtonsTemplateList();
        return navigationTemplates.find(t => t.type() === "previous");
    });

    /**
     * @description Whether to show the first and last page buttons.
     * @default true
     */
    public readonly firstLast = input(true);

    /**
     * @description The event emitted when the page changes.
     * @default () => {}
     */
    public readonly pageChange = output<PageChangeEvent>();

    /**
     * @description Whether to show the page input.
     * @default false
     */
    public readonly pageInput = input(false);

    /**
     * @description The page size.
     * @default 5
     */
    public readonly pageSize = input(5);

    /**
     * @description The event emitted when the page size changes.
     * @default () => {}
     */
    public readonly pageSizeChange = output<PageSizeChangeEvent>();

    /**
     * @description The page size values.
     * @default [5, 10, 20, 50, 100]
     */
    public readonly pageSizeValues = input<number[] | boolean>([5, 10, 20, 50, 100]);

    /**
     * @description Whether to show the previous and next page buttons.
     * @default true
     */
    public readonly previousNext = input(true);

    /**
     * @description Whether to make the pager responsive.
     * @default true
     */
    public readonly responsive = input(true);

    /**
     * @description The rounded of the pager.
     * @default "medium"
     */
    public readonly rounded = input<PagerVariantProps["rounded"]>("medium");

    /**
     * @description Whether to show the info section.
     * @default true
     */
    public readonly showInfo = input(true);

    /**
     * @description The size of the pager.
     * @default "medium"
     */
    public readonly size = input<PagerVariantProps["size"]>("medium");

    /**
     * @description The skip of the pager.
     * @default 0
     */
    public readonly skip = input(0);

    /**
     * @description The total of the pager.
     * @default 0
     */
    public readonly total = input(0);

    /**
     * @description The type of the pager.
     * @default "numeric"
     */
    public readonly type = input<PagerType>("numeric");
    public readonly userClasses = input<string>("", { alias: "class" });

    /**
     * @description The visible pages of the pager.
     * @default 5
     */
    public readonly visiblePages = input(5);

    public constructor() {
        effect(() => {
            const pageSize = this.pageSize();
            untracked(() => (this.#previousPageSize = pageSize));
        });
        effect(() => {
            const page = this.page();
            untracked(() => this.pageChange.emit({ page, skip: this.#skip(), take: this.pagerPageSize() }));
        });
        afterRenderEffect(() => {
            if (this.responsive()) {
                this.#widthObserver = new ResizeObserver(() => {
                    untracked(() => {
                        this.#infoVisible.set(this.#hostElementRef.nativeElement.clientWidth >= 790);
                        this.pageInputVisible.set(this.#hostElementRef.nativeElement.clientWidth >= 640);
                        this.pageListVisible.set(this.#hostElementRef.nativeElement.clientWidth >= 480);
                    });
                });
                this.#widthObserver.observe(this.#hostElementRef.nativeElement);
            } else if (this.#widthObserver) {
                untracked(() => {
                    this.#infoVisible.set(true);
                    this.pageInputVisible.set(true);
                    this.pageListVisible.set(true);
                });
                this.#widthObserver.disconnect();
                this.#widthObserver = null;
            }
        });
        inject(DestroyRef).onDestroy(() => this.#widthObserver?.disconnect());
    }

    public onJumpNextClick(): void {
        const page = Math.min(this.page() + this.visiblePages(), this.pageCount());
        this.setPage(page);
    }

    public onJumpPreviousClick(): void {
        const page = Math.max(this.page() - this.visiblePages(), 1);
        this.setPage(page);
    }

    public onNextPageClick(): void {
        const page = Math.min(this.page() + 1, this.pageCount());
        this.setPage(page);
    }

    public onPageClick(page: number): void {
        if (page === this.page()) {
            return;
        }
        this.setPage(page);
    }

    public onPageInputBlur(): void {
        if (this.inputValue() === null || this.inputValue() === this.page()) {
            this.inputValue.set(this.page());
            return;
        }
        if (this.inputValue() < 1) {
            this.inputValue.set(1);
        } else if (this.inputValue() > this.pageCount()) {
            this.inputValue.set(this.pageCount());
        }
        this.setPage(this.inputValue());
    }

    public onPageSizeValueChange(value: number): void {
        if (value === this.pagerPageSize()) {
            return;
        }
        const event = new PageSizeChangeEvent(value, this.pagerPageSize());
        const pageSizeDropdownList = this.pageSizeDropdownList();
        if (pageSizeDropdownList) {
            pageSizeDropdownList.setValue(this.#previousPageSize);
        }

        this.pageSizeChange.emit(event);
        if (event.isDefaultPrevented()) {
            this.pagerPageSize.set(this.#previousPageSize);
            if (pageSizeDropdownList) {
                pageSizeDropdownList.setValue(this.#previousPageSize);
            }
            return;
        }
        this.#previousPageSize = value;
        this.pagerPageSize.set(value);
        if (pageSizeDropdownList) {
            pageSizeDropdownList.setValue(value);
        }
        this.setPage(1);
    }

    public onPreviousPageClick(): void {
        const page = Math.max(this.page() - 1, 1);
        this.setPage(page);
    }

    private preparePages(currentPage: number, visiblePages: number, maxPages: number): Page[] {
        const half = Math.floor(visiblePages / 2);
        let first = 1;
        let index = 0;
        const pages: Page[] = [];
        if (maxPages <= 5) {
            for (index = 1; index <= maxPages; index++) {
                pages.push({ page: index, text: index.toString() });
            }
        } else if (currentPage < visiblePages) {
            pages.push({ page: first, text: first.toString() });
            for (index = 2; index < (maxPages < visiblePages ? maxPages : visiblePages) + 1; index++) {
                pages.push({ page: index, text: index.toString() });
            }
            pages.push({ page: maxPages, text: maxPages.toString() });
        } else if (currentPage >= visiblePages && currentPage <= maxPages - visiblePages) {
            pages.push({ page: first, text: first.toString() });
            for (index = currentPage - half; index < currentPage + visiblePages - half; index++) {
                pages.push({ page: index, text: index.toString() });
            }
            pages.push({ page: maxPages, text: maxPages.toString() });
        } else if (currentPage >= maxPages - visiblePages) {
            pages.push({ page: first, text: first.toString() });
            index = maxPages - visiblePages < currentPage ? maxPages - visiblePages : currentPage;
            for (; index <= maxPages; index++) {
                pages.push({ page: index, text: index.toString() });
            }
        }
        return pages;
    }

    private setPage(page: number): void {
        this.#skip.set((page - 1) * this.pagerPageSize());
    }
}
