import { computed, Directive, ElementRef, inject, input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { BREADCRUMB_ITEM_CONTEXT } from "../models/breadcrumb.tokens";
import { breadcrumbLinkThemeVariants } from "../styles/breadcrumb.styles";

/**
 * Makes a projected anchor the item's link, so the browser and the router treat it as one: ctrl-click, copy link, `href`,
 * `routerLink`, `target`. The item then renders no button around it.
 */
@Directive({
    selector: "a[monaBreadcrumbLink]",
    host: {
        "[attr.aria-current]": "current() ? 'page' : null",
        "[attr.aria-disabled]": "disabled() ? true : null",
        "[attr.tabindex]": "disabled() ? -1 : null",
        "[class]": "linkClass()"
    }
})
export class BreadcrumbLinkDirective {
    readonly #item = inject(BREADCRUMB_ITEM_CONTEXT, { optional: true });
    protected readonly current = computed(() => this.#item?.current() ?? false);
    protected readonly disabled = computed(() => this.#item?.effectiveDisabled() ?? false);
    protected readonly linkClass = computed(() => {
        const variantClass = breadcrumbLinkThemeVariants({ current: this.current(), disabled: this.disabled() });
        return twMerge(variantClass, this.userClass());
    });

    /**
     * @description Additional CSS classes merged onto the link via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    public constructor() {
        const host = inject<ElementRef<HTMLAnchorElement>>(ElementRef).nativeElement;
        // In the capture phase, so a disabled link stops a click before `routerLink`'s own listener can act on it.
        fromEvent<MouseEvent>(host, "click", { capture: true })
            .pipe(takeUntilDestroyed())
            .subscribe(event => {
                if (this.disabled()) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                } else if (!this.current()) {
                    this.#item?.itemClick.emit(event);
                }
            });
    }
}
