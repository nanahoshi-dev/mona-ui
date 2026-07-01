import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
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
import { NavigationKeys } from "../../../common/utils/navigation.utils";
import { PagerFocusableDirective } from "../../directives/pager-focusable.directive";
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
    pagerListItemThemeVariants,
    pagerListThemeVariants,
    type PagerVariantInputs,
    type PagerVariantProps
} from "../../styles/pager.styles";

const PAGER_FOCUSABLE_ATTRIBUTE = "data-mona-pager-focusable";
const FOCUSABLE_TARGET_SELECTOR = "button, input, select, textarea, a[href], [tabindex]";

@Component({
    selector: "mona-pager",
    templateUrl: "./pager.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonDirective,
        NumericTextBoxComponent,
        FormsModule,
        DropdownListComponent,
        PagerFocusableDirective,
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
        "[attr.tabindex]": "navigable() ? 0 : null",
        "[class]": "baseClasses()",
        "(keydown)": "onKeydown($event)"
    }
})
export class PagerComponent implements PagerVariantInputs {
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #infoVisible = signal(true);
    readonly #innerNavigationActive = signal(false);
    readonly #managedFocusTargets = new Set<HTMLElement>();
    readonly #originalTabIndices = new WeakMap<HTMLElement, string | null>();
    readonly #skip = linkedSignal(() => this.skip());
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
    protected readonly firstPageLabel = "First page";
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
    protected readonly inputValue = linkedSignal(() => this.page());
    protected readonly jumpNextLabel = computed(() => `Jump forward ${this.visiblePages()} pages`);
    protected readonly jumpPreviousLabel = computed(() => `Jump back ${this.visiblePages()} pages`);
    protected readonly lastPageLabel = "Last page";
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
    protected readonly nextPageLabel = "Next page";
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
    protected readonly pagerPageSize = linkedSignal(() => this.pageSize());
    protected readonly pages = computed(() => {
        return this.preparePages(this.page(), this.visiblePages(), this.pageCount());
    });
    protected readonly previousJumperVisible = computed(
        () => this.pages().length > this.visiblePages() && this.pages()[1].page - 1 > 1
    );
    protected readonly previousPageLabel = "Previous page";
    protected readonly previousPageNavigationTemplate = computed(() => {
        const navigationTemplates = this.navigationButtonsTemplateList();
        return navigationTemplates.find(t => t.type() === "previous");
    });

    /**
     * @description Shows the first and last page navigation buttons.
     * @default true
     */
    public readonly firstLast = input(true);

    /**
     * @description Enables keyboard navigation on the pager wrapper and its inner controls.
     * @default true
     */
    public readonly navigable = input(true);

    /**
     * @description Emitted when the current page changes.
     */
    public readonly pageChange = output<PageChangeEvent>();

    /**
     * @description Shows a numeric input for jumping directly to a page.
     * @default false
     */
    public readonly pageInput = input(false);

    /**
     * @description Number of items displayed per page.
     * @default 5
     */
    public readonly pageSize = input(5);

    /**
     * @description Emitted when the page size changes. Cancelable via `preventDefault()` on the event.
     */
    public readonly pageSizeChange = output<PageSizeChangeEvent>();

    /**
     * @description Page-size options shown in the page-size dropdown. Set to `false` or an empty array to hide the dropdown.
     * @default [5, 10, 20, 50, 100]
     */
    public readonly pageSizeValues = input<number[] | boolean>([5, 10, 20, 50, 100]);

    /**
     * @description Shows the previous and next page navigation buttons.
     * @default true
     */
    public readonly previousNext = input(true);

    /**
     * @description Collapses sections of the pager as the host element narrows.
     * @default true
     */
    public readonly responsive = input(true);

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<PagerVariantProps["rounded"]>("medium");

    /**
     * @description Displays the summary of the current page range and total item count.
     * @default true
     */
    public readonly showInfo = input(true);

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<PagerVariantProps["size"]>("medium");

    /**
     * @description Number of items to skip before the current page. Determines the current page together with `pageSize`.
     * @default 0
     */
    public readonly skip = input(0);

    /**
     * @description Total number of items in the paged collection.
     * @default 0
     */
    public readonly total = input(0);

    /**
     * @description Visual mode of the pager: numeric page buttons, or a page-jump input.
     * @default "numeric"
     */
    public readonly type = input<PagerType>("numeric");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClasses = input<string>("", { alias: "class" });

    /**
     * @description Number of numeric page buttons shown at once before collapsing into jump controls.
     * @default 5
     */
    public readonly visiblePages = input(5);

    public constructor() {
        effect(() => {
            const pageSize = this.pageSize();
            untracked(() => (this.#previousPageSize = pageSize));
        });
        effect(() => {
            const navigable = this.navigable();
            if (!navigable) {
                untracked(() => {
                    this.#innerNavigationActive.set(false);
                    this.restoreManagedFocusTargets();
                });
            }
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
        afterRenderEffect(() => {
            this.navigable();
            this.#innerNavigationActive();
            this.firstLast();
            this.page();
            this.pageCount();
            this.pageInput();
            this.pageInputVisible();
            this.pageListVisible();
            this.pageSizeDropdownData();
            this.pages();
            this.previousNext();
            this.type();
            untracked(() => this.syncFocusableTabIndexes());
        });
        inject(DestroyRef).onDestroy(() => this.#widthObserver?.disconnect());
    }

    protected onJumpNextClick(): void {
        const page = Math.min(this.page() + this.visiblePages(), this.pageCount());
        this.setPage(page);
    }

    protected onJumpPreviousClick(): void {
        const page = Math.max(this.page() - this.visiblePages(), 1);
        this.setPage(page);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (!this.navigable()) {
            return;
        }

        if (event.key === NavigationKeys.Home) {
            event.preventDefault();
            this.setKeyboardPage(1);
            return;
        }

        if (event.key === NavigationKeys.End) {
            event.preventDefault();
            this.setKeyboardPage(this.pageCount());
            return;
        }

        if (this.#innerNavigationActive()) {
            this.handleInnerNavigationKeydown(event);
            return;
        }

        if (event.target !== this.#hostElementRef.nativeElement) {
            return;
        }

        switch (event.key) {
            case NavigationKeys.Enter:
                event.preventDefault();
                this.activateInnerNavigation();
                break;
            case NavigationKeys.ArrowLeft:
            case NavigationKeys.PageUp:
                event.preventDefault();
                this.setKeyboardPage(this.page() - 1);
                break;
            case NavigationKeys.ArrowRight:
            case NavigationKeys.PageDown:
                event.preventDefault();
                this.setKeyboardPage(this.page() + 1);
                break;
        }
    }

    protected onNextPageClick(): void {
        const page = Math.min(this.page() + 1, this.pageCount());
        this.setPage(page);
    }

    protected onPageClick(page: number): void {
        if (page === this.page()) {
            return;
        }
        this.setPage(page);
    }

    protected onPageInputBlur(): void {
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

    protected onPageSizeValueChange(value: number): void {
        if (value === this.pagerPageSize()) {
            return;
        }
        const event = new PageSizeChangeEvent(value, this.pagerPageSize());
        const pageSizeDropdownList = this.pageSizeDropdownList();

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

    protected onPreviousPageClick(): void {
        const page = Math.max(this.page() - 1, 1);
        this.setPage(page);
    }

    protected pageItemClasses(active: boolean): string {
        return pagerListItemThemeVariants(this.#themeService.theme())({ active });
    }

    private activateInnerNavigation(): void {
        const targets = this.getFocusableTargets();
        if (targets.length === 0) {
            return;
        }
        this.#innerNavigationActive.set(true);
        targets[0].focus();
    }

    private focusNextTarget(backwards: boolean): void {
        const targets = this.getFocusableTargets();
        if (targets.length === 0) {
            return;
        }

        const activeElement = this.#document.activeElement as HTMLElement | null;
        const currentIndex = activeElement
            ? targets.findIndex(target => target === activeElement || target.contains(activeElement))
            : -1;
        const nextIndex =
            currentIndex === -1 ? 0 : (currentIndex + (backwards ? -1 : 1) + targets.length) % targets.length;

        targets[nextIndex].focus();
    }

    private getFocusableTargets(): HTMLElement[] {
        const host = this.#hostElementRef.nativeElement;
        const markedElements = Array.from(host.querySelectorAll<HTMLElement>(`[${PAGER_FOCUSABLE_ATTRIBUTE}="true"]`));
        const targets: HTMLElement[] = [];
        const seen = new Set<HTMLElement>();

        for (const element of markedElements) {
            const target = this.resolveFocusableTarget(element);
            if (!target || seen.has(target) || this.isElementDisabled(target) || this.isElementHidden(target)) {
                continue;
            }
            seen.add(target);
            targets.push(target);
        }

        return targets;
    }

    private handleInnerNavigationKeydown(event: KeyboardEvent): void {
        if (event.key === NavigationKeys.Escape) {
            event.preventDefault();
            this.#innerNavigationActive.set(false);
            this.#hostElementRef.nativeElement.focus();
            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();
            this.focusNextTarget(event.shiftKey);
        }
    }

    private isElementDisabled(element: HTMLElement): boolean {
        if (
            (element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement) &&
            element.disabled
        ) {
            return true;
        }

        return element.getAttribute("aria-disabled") === "true" || element.hasAttribute("disabled");
    }

    private isElementHidden(element: HTMLElement): boolean {
        if (element.closest("[hidden]") || element.getAttribute("aria-hidden") === "true") {
            return true;
        }

        const style = this.#document.defaultView?.getComputedStyle(element);
        return style?.display === "none" || style?.visibility === "hidden";
    }

    private overrideTabIndex(element: HTMLElement): void {
        if (!this.#originalTabIndices.has(element)) {
            this.#originalTabIndices.set(element, element.getAttribute("tabindex"));
        }
        element.setAttribute("tabindex", "-1");
        this.#managedFocusTargets.add(element);
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

    private resolveFocusableTarget(element: HTMLElement): HTMLElement | null {
        if (element.matches(FOCUSABLE_TARGET_SELECTOR)) {
            return element;
        }

        return (
            Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE_TARGET_SELECTOR)).find(
                target => !this.isElementDisabled(target) && !this.isElementHidden(target)
            ) ?? null
        );
    }

    private restoreManagedFocusTarget(element: HTMLElement): void {
        const originalTabIndex = this.#originalTabIndices.get(element);
        if (originalTabIndex == null) {
            element.removeAttribute("tabindex");
        } else {
            element.setAttribute("tabindex", originalTabIndex);
        }
        this.#managedFocusTargets.delete(element);
    }

    private restoreManagedFocusTargets(): void {
        for (const element of Array.from(this.#managedFocusTargets)) {
            this.restoreManagedFocusTarget(element);
        }
    }

    private setKeyboardPage(page: number): void {
        const pageCount = this.pageCount();
        if (pageCount < 1) {
            return;
        }

        this.setPage(Math.min(Math.max(page, 1), pageCount));
    }

    private setPage(page: number): void {
        this.#skip.set((page - 1) * this.pagerPageSize());
    }

    private syncFocusableTabIndexes(): void {
        const focusableTargets = this.getFocusableTargets();
        const currentTargets = new Set(focusableTargets);

        for (const element of Array.from(this.#managedFocusTargets)) {
            if (!this.navigable() || !currentTargets.has(element)) {
                this.restoreManagedFocusTarget(element);
            }
        }

        if (!this.navigable()) {
            return;
        }

        for (const target of focusableTargets) {
            this.overrideTabIndex(target);
        }
    }
}
