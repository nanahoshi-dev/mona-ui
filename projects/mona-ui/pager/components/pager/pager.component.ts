import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    afterRenderEffect,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    linkedSignal,
    model,
    output,
    type Signal,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import {
    LucideChevronLeft,
    LucideChevronRight,
    LucideChevronsLeft,
    LucideChevronsRight,
    LucideEllipsis
} from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { DropdownListComponent, DropdownListValueTemplateDirective } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownItemTemplateDirective, DropdownVirtualScrollDirective } from "@nanahoshi/mona-ui/dropdowns";
import { formatNumber, injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId, NavigationKeys } from "@nanahoshi/mona-ui/internal";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { twMerge } from "tailwind-merge";
import { PagerInfoTemplateDirective } from "../../directives/pager-info-template.directive";
import { PagerNavigationButtonsTemplateDirective } from "../../directives/pager-navigation-buttons-template.directive";
import { PagerNumericButtonsTemplateDirective } from "../../directives/pager-numeric-buttons-template.directive";
import { PagerPageSizeTemplateDirective } from "../../directives/pager-page-size-template.directive";
import { PAGER_DEFAULT_MESSAGES } from "../../i18n/pager.default-messages";
import type { InfoTemplateContext } from "../../models/InfoTemplateContext";
import type { NavigationButtonsTemplateContext } from "../../models/NavigationButtonsTemplateContext";
import type { NumericButtonsTemplateContext } from "../../models/NumericButtonsTemplateContext";
import type { PageChangeEvent } from "../../models/PageChangeEvent";
import type { PagerContext } from "../../models/PagerContext";
import type { PagerType } from "../../models/PagerType";
import { PageSizeChangeEvent } from "../../models/PageSizeChangeEvent";
import type { PageSizeTemplateContext } from "../../models/PageSizeTemplateContext";
import {
    pagerBaseThemeVariants,
    pagerInfoThemeVariants,
    pagerInputThemeVariants,
    pagerListItemThemeVariants,
    pagerListThemeVariants,
    type PagerVariantInputs,
    type PagerVariantProps
} from "../../styles/pager.styles";

type NavigationButtonType = "first" | "last" | "next" | "previous";

type PagerItem =
    | { readonly key: string; readonly kind: "page"; readonly page: number }
    | { readonly direction: "backward" | "forward"; readonly key: string; readonly kind: "jump"; readonly page: number };

/** Below this width (in CSS pixels) a responsive pager replaces its page buttons with a page dropdown. */
const COMPACT_WIDTH = 480;
const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_PAGE_SIZES: readonly number[] = [5, 10, 20, 50, 100];

/** A whole number at least `minimum`, or `fallback` when the value isn't a finite number. */
function toCount(value: unknown, fallback: number, minimum: number): number {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? Math.max(minimum, Math.floor(numeric)) : fallback;
}

@Component({
    selector: "mona-pager",
    templateUrl: "./pager.component.html",
    imports: [
        ButtonDirective,
        NumericTextBoxComponent,
        DropdownListComponent,
        DropdownVirtualScrollDirective,
        NgTemplateOutlet,
        DropdownListValueTemplateDirective,
        DropdownItemTemplateDirective,
        LucideEllipsis,
        LucideChevronsLeft,
        LucideChevronLeft,
        LucideChevronRight,
        LucideChevronsRight
    ],
    host: {
        "[attr.aria-label]": "ariaLabelledBy() ? null : ariaLabel() || messages().pagerLabel",
        "[attr.aria-labelledby]": "ariaLabelledBy() || null",
        "[class]": "baseClasses()",
        "(keydown)": "onKeydown($event)",
        role: "navigation"
    }
})
export class PagerComponent implements PagerVariantInputs {
    readonly #compact = signal(false);
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #id = createElementControlId();
    readonly #injector = inject(Injector);
    #widthObserver: ResizeObserver | null = null;
    private readonly navigationButtonsTemplateList = contentChildren(PagerNavigationButtonsTemplateDirective);
    protected readonly baseClasses = computed(() =>
        twMerge(pagerBaseThemeVariants({ rounded: this.rounded(), size: this.size() }), this.userClasses())
    );
    protected readonly compact = this.#compact.asReadonly();

    /** The position of the last item on the current page, or 0 when there are no items. */
    protected readonly end = computed(() =>
        this.hasPages() ? Math.min(this.page() * this.pageSizeValue(), this.total()) : 0
    );
    protected readonly firstNavigationContext = computed(() => this.createNavigationContext("first"));
    protected readonly firstPageNavigationTemplate = computed(() => this.findNavigationTemplate("first"));
    protected readonly hasPages = computed(() => this.pageCount() > 0);
    protected readonly iconSize = computed(() => {
        switch (this.size()) {
            case "small":
                return 18;
            case "large":
                return 22;
            default:
                return 20;
        }
    });
    protected readonly infoClasses = pagerInfoThemeVariants();
    protected readonly infoContext = computed<InfoTemplateContext>(() => {
        const context = this.pagerContext();
        return { ...context, $implicit: context };
    });
    protected readonly inputClasses = pagerInputThemeVariants();
    protected readonly inputValue = linkedSignal<number | null>(() => this.page());
    protected readonly jumpNextLabel = computed(() => this.messages().jumpForwardLabel(this.visiblePages()));
    protected readonly jumpPreviousLabel = computed(() => this.messages().jumpBackwardLabel(this.visiblePages()));
    protected readonly lastNavigationContext = computed(() => this.createNavigationContext("last"));
    protected readonly lastPageNavigationTemplate = computed(() => this.findNavigationTemplate("last"));
    protected readonly listClasses = pagerListThemeVariants();

    /** Announces page changes made by the user; programmatic changes stay silent. */
    protected readonly liveStatus = signal("");
    protected readonly messages = this.#i18n.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
    protected readonly nextNavigationContext = computed(() => this.createNavigationContext("next"));
    protected readonly nextPageNavigationTemplate = computed(() => this.findNavigationTemplate("next"));
    protected readonly numericButtonsContext = computed<NumericButtonsTemplateContext>(() => {
        const context = this.pagerContext();
        const pages = this.pageItems()
            .filter(item => item.kind === "page")
            .map(item => item.page);
        return { ...context, $implicit: context, pages };
    });
    protected readonly numericButtonsTemplate = contentChild(PagerNumericButtonsTemplateDirective);

    /** The current page: the page holding `skip`, clamped to the last page. */
    protected readonly page = computed(() => {
        const pageCount = this.pageCount();
        const page = Math.floor(this.skipValue() / this.pageSizeValue()) + 1;
        return pageCount === 0 ? 1 : Math.min(page, pageCount);
    });
    protected readonly pageCount = computed(() => Math.ceil(this.total() / this.pageSizeValue()));
    protected readonly pageInputId = `${this.#id}-page`;
    protected readonly pageInputLabelledBy = `${this.#id}-page-prefix ${this.#id}-page ${this.#id}-page-suffix`;
    protected readonly pageInputPrefixId = `${this.#id}-page-prefix`;
    protected readonly pageInputSuffixId = `${this.#id}-page-suffix`;
    protected readonly pageItems = computed(() => this.buildPageItems(this.page(), this.visiblePages(), this.pageCount()));
    protected readonly pageList = computed(() => Array.from({ length: this.pageCount() }, (_, index) => index + 1));
    protected readonly pageSizeContext = computed<PageSizeTemplateContext>(() => ({
        ...this.pagerContext(),
        $implicit: this.pageSizeOptions()
    }));
    protected readonly pageSizeDropdownList: Signal<DropdownListComponent<number> | undefined> =
        viewChild("pageSizeDropdownList");
    protected readonly pageSizeOptions = computed<readonly number[]>(() => {
        const values = this.pageSizeValues();
        if (values === false) {
            return [];
        }
        return Array.isArray(values) ? values : DEFAULT_PAGE_SIZES;
    });
    protected readonly pageSizeTemplate = contentChild(PagerPageSizeTemplateDirective, { read: TemplateRef });

    /** The page size in use: `pageSize`, or the size the user picked since, as a whole number of at least 1. */
    protected readonly pageSizeValue = computed(() => toCount(this.pageSize(), DEFAULT_PAGE_SIZE, 1));
    protected readonly pagerContext = computed<PagerContext>(() => ({
        currentPage: this.page(),
        end: this.end(),
        goToPage: (page: number) => this.goToPage(page),
        pageSize: this.pageSizeValue(),
        pageSizes: this.pageSizeOptions(),
        setPageSize: (pageSize: number | null) => this.changePageSize(pageSize),
        skip: (this.page() - 1) * this.pageSizeValue(),
        start: this.start(),
        total: this.total(),
        totalPages: this.pageCount()
    }));
    protected readonly pagerInfo = computed(() => this.messages().rangeStatus(this.start(), this.end(), this.total()));
    protected readonly pagerInfoTemplate = contentChild(PagerInfoTemplateDirective);
    protected readonly previousNavigationContext = computed(() => this.createNavigationContext("previous"));
    protected readonly previousPageNavigationTemplate = computed(() => this.findNavigationTemplate("previous"));

    /** `skip` as a whole number of at least 0. */
    protected readonly skipValue = computed(() => toCount(this.skip(), 0, 0));

    /** The position of the first item on the current page, or 0 when there are no items. */
    protected readonly start = computed(() => (this.hasPages() ? (this.page() - 1) * this.pageSizeValue() + 1 : 0));

    /**
     * @description Accessible name of the pager's navigation landmark. Defaults to the localized "Pagination";
     * name each pager when a page has several.
     */
    public readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

    /**
     * @description Id of the element that names the pager. Takes precedence over `aria-label`.
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Shows the first and last page navigation buttons.
     * @default true
     */
    public readonly firstLast = input(true, { transform: booleanAttribute });

    /**
     * @description Enables page shortcuts while a pager button has focus: Page Up and Page Down go to the
     * previous and next page, Home and End to the first and last, and the left and right arrows to the previous
     * and next page (mirrored right to left). The buttons themselves are always ordinary tab stops.
     * @default true
     */
    public readonly navigable = input(true, { transform: booleanAttribute });

    /**
     * @description Emitted when the user changes the page or the page size, or when the pager corrects a `skip`
     * that is past the last page or not on a page boundary. Setting `skip` or `pageSize` from code to a valid
     * value doesn't emit it.
     */
    public readonly pageChange = output<PageChangeEvent>();

    /**
     * @description Shows a numeric input for jumping directly to a page.
     * @default false
     */
    public readonly pageInput = input(false, { transform: booleanAttribute });

    /**
     * @description Number of items displayed per page; values below 1 count as 1. Supports two-way binding
     * (`[(pageSize)]`): `pageSizeChange` emits the new size after the user changes it, and `pageChange` reports it
     * as `take`.
     * @default 5
     */
    public readonly pageSize = model(DEFAULT_PAGE_SIZE);

    /**
     * @description Emitted when the user picks a page size, before it is applied. Call `preventDefault()` on the
     * event to keep the current size.
     */
    public readonly pageSizeSelect = output<PageSizeChangeEvent>();

    /**
     * @description Page-size options shown in the page-size dropdown. `true` shows the default options; `false`
     * or an empty array hides the dropdown.
     * @default [5, 10, 20, 50, 100]
     */
    public readonly pageSizeValues = input<readonly number[] | boolean>(DEFAULT_PAGE_SIZES);

    /**
     * @description Shows the previous and next page navigation buttons.
     * @default true
     */
    public readonly previousNext = input(true, { transform: booleanAttribute });

    /**
     * @description Replaces the page buttons with a page dropdown when the pager is narrower than 480px.
     * Other sections wrap onto a new line instead of being hidden.
     * @default true
     */
    public readonly responsive = input(true, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<PagerVariantProps["rounded"]>("medium");

    /**
     * @description Displays the summary of the current page range and total item count.
     * @default true
     */
    public readonly showInfo = input(true, { transform: booleanAttribute });

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<PagerVariantProps["size"]>("medium");

    /**
     * @description Number of items before the current page. Supports two-way binding. A value past the last page,
     * or between page boundaries, is corrected to the start of the page that holds it, and `pageChange` reports it.
     * @default 0
     */
    public readonly skip = model(0);

    /**
     * @description Total number of items in the paged collection.
     * @default 0
     */
    public readonly total = input(0, { transform: (value: unknown) => toCount(value, 0, 0) });

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
     * @description Number of page buttons shown between the first and last page before the rest collapse into
     * jump buttons. At least 1.
     * @default 5
     */
    public readonly visiblePages = input(5, { transform: (value: unknown) => toCount(value, 5, 1) });

    public constructor() {
        effect(() => {
            const pageCount = this.pageCount();
            const skip = this.skip();
            const alignedSkip = (this.page() - 1) * this.pageSizeValue();
            if (pageCount === 0 || skip === alignedSkip) {
                return;
            }
            untracked(() => {
                this.skip.set(alignedSkip);
                this.emitPageChange();
            });
        });
        afterRenderEffect(() => {
            if (!this.responsive()) {
                this.#widthObserver?.disconnect();
                this.#widthObserver = null;
                untracked(() => this.#compact.set(false));
                return;
            }
            if (this.#widthObserver == null) {
                const host = this.#hostElementRef.nativeElement;
                this.#widthObserver = new ResizeObserver(() => {
                    untracked(() => this.#compact.set(host.clientWidth < COMPACT_WIDTH));
                });
                this.#widthObserver.observe(host);
            }
        });
        this.#destroyRef.onDestroy(() => this.#widthObserver?.disconnect());
    }

    protected changePageSize(value: number | null): void {
        const previous = this.pageSizeValue();
        if (value == null || !Number.isFinite(value) || value < 1 || value === previous) {
            return;
        }
        const event = new PageSizeChangeEvent(value, previous);
        this.pageSizeSelect.emit(event);
        if (event.isDefaultPrevented()) {
            this.pageSizeDropdownList()?.setValue(previous);
            return;
        }
        const firstItemSkip = (this.page() - 1) * previous;
        const focused = this.focusedInside();
        this.pageSize.set(value);
        this.skip.set(Math.floor(firstItemSkip / value) * value);
        this.emitPageChange();
        this.afterUserChange(focused);
    }

    protected commitPageInput(): void {
        const value = this.inputValue();
        if (value == null || !Number.isFinite(value) || !this.hasPages()) {
            this.inputValue.set(this.page());
            return;
        }
        const page = Math.min(Math.max(Math.round(value), 1), this.pageCount());
        this.inputValue.set(page);
        this.goToPage(page);
    }

    protected formatPageNumber(value: number): string {
        return formatNumber(value, this.#i18n.localeId(), { maximumFractionDigits: 0 });
    }

    /** Goes to a page (clamped to the page range), as a user action: emits `pageChange` and announces the range. */
    protected goToPage(page: number | null): void {
        if (page == null || !Number.isFinite(page) || !this.hasPages()) {
            return;
        }
        const target = Math.min(Math.max(Math.round(page), 1), this.pageCount());
        const skip = (target - 1) * this.pageSizeValue();
        if (target === this.page() && skip === this.skip()) {
            return;
        }
        const focused = this.focusedInside();
        this.skip.set(skip);
        this.emitPageChange();
        this.afterUserChange(focused);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (
            !this.navigable() ||
            event.defaultPrevented ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            !(event.target instanceof HTMLButtonElement) ||
            !this.hasPages()
        ) {
            return;
        }
        const rtl = this.#direction() === "rtl";
        let page: number;
        switch (event.key) {
            case NavigationKeys.Home:
                page = 1;
                break;
            case NavigationKeys.End:
                page = this.pageCount();
                break;
            case NavigationKeys.PageUp:
                page = this.page() - 1;
                break;
            case NavigationKeys.PageDown:
                page = this.page() + 1;
                break;
            case NavigationKeys.ArrowLeft:
                page = this.page() + (rtl ? 1 : -1);
                break;
            case NavigationKeys.ArrowRight:
                page = this.page() + (rtl ? -1 : 1);
                break;
            default:
                return;
        }
        event.preventDefault();
        this.goToPage(page);
    }

    protected onPageInputEnter(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.isComposing || keyboardEvent.keyCode === 229) {
            return;
        }
        keyboardEvent.preventDefault();
        this.commitPageInput();
    }

    protected pageItemClasses(active: boolean): string {
        return pagerListItemThemeVariants({ active });
    }

    /**
     * After a user change: announces the new range, and keeps focus in the pager when the focused control was
     * removed or disabled (a jump button that is no longer needed, Next on the last page).
     */
    private afterUserChange(focusedInside: boolean): void {
        this.liveStatus.set(this.pagerInfo());
        if (!focusedInside) {
            return;
        }
        const host = this.#hostElementRef.nativeElement;
        afterNextRender(
            {
                read: () => {
                    const active = this.#document.activeElement;
                    if (active instanceof HTMLElement && host.contains(active) && !this.isDisabled(active)) {
                        return;
                    }
                    const target =
                        host.querySelector<HTMLElement>("button[aria-current='page']") ??
                        Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find(b => !b.disabled);
                    target?.focus();
                }
            },
            { injector: this.#injector }
        );
    }

    /**
     * The page buttons: the first and last page, a window of `visiblePages` pages around the current one, and a
     * jump button for each longer gap. A gap of one page shows that page instead.
     */
    private buildPageItems(current: number, visible: number, count: number): PagerItem[] {
        const page = (value: number): PagerItem => ({ key: `page-${value}`, kind: "page", page: value });
        if (count === 0) {
            return [];
        }
        if (count <= visible + 2) {
            return Array.from({ length: count }, (_, index) => page(index + 1));
        }
        const windowStart = Math.min(Math.max(current - Math.floor((visible - 1) / 2), 2), count - visible);
        const windowEnd = windowStart + visible - 1;
        const items: PagerItem[] = [page(1)];
        if (windowStart === 3) {
            items.push(page(2));
        } else if (windowStart > 3) {
            items.push({
                direction: "backward",
                key: "jump-backward",
                kind: "jump",
                page: Math.max(current - visible, 1)
            });
        }
        for (let value = windowStart; value <= windowEnd; value++) {
            items.push(page(value));
        }
        if (windowEnd === count - 2) {
            items.push(page(count - 1));
        } else if (windowEnd < count - 2) {
            items.push({
                direction: "forward",
                key: "jump-forward",
                kind: "jump",
                page: Math.min(current + visible, count)
            });
        }
        items.push(page(count));
        return items;
    }

    private createNavigationContext(type: NavigationButtonType): NavigationButtonsTemplateContext {
        const context = this.pagerContext();
        const page = this.page();
        const pageCount = this.pageCount();
        const backward = type === "first" || type === "previous";
        const targetPage =
            type === "first" ? 1 : type === "previous" ? page - 1 : type === "next" ? page + 1 : pageCount;
        const disabled = !this.hasPages() || (backward ? page <= 1 : page >= pageCount);
        return {
            ...context,
            $implicit: context,
            disabled,
            navigate: () => this.goToPage(targetPage),
            targetPage: Math.min(Math.max(targetPage, 1), Math.max(pageCount, 1))
        };
    }

    private emitPageChange(): void {
        const take = this.pageSizeValue();
        this.pageChange.emit({ page: this.page(), skip: (this.page() - 1) * take, take });
    }

    private findNavigationTemplate(type: NavigationButtonType): PagerNavigationButtonsTemplateDirective | undefined {
        return this.navigationButtonsTemplateList().find(template => template.type() === type);
    }

    private focusedInside(): boolean {
        const active = this.#document.activeElement;
        return active != null && this.#hostElementRef.nativeElement.contains(active);
    }

    private isDisabled(element: HTMLElement): boolean {
        return (element as HTMLButtonElement).disabled === true || element.getAttribute("aria-disabled") === "true";
    }
}
