import type { OutputEmitterRef, Signal } from "@angular/core";
import { InjectionToken } from "@angular/core";

/** What a `mona-breadcrumb-item` reads from its breadcrumb, without a circular import. */
export interface BreadcrumbContext {
    readonly currentItem: Signal<unknown>;
    readonly disabled: Signal<boolean>;
}

/** What a `monaBreadcrumbLink` reads from its item, without a circular import. */
export interface BreadcrumbItemContext {
    readonly current: Signal<boolean>;
    readonly effectiveDisabled: Signal<boolean>;
    readonly itemClick: OutputEmitterRef<MouseEvent>;
}

export const BREADCRUMB_CONTEXT = new InjectionToken<BreadcrumbContext>("MONA_BREADCRUMB_CONTEXT");

export const BREADCRUMB_ITEM_CONTEXT = new InjectionToken<BreadcrumbItemContext>("MONA_BREADCRUMB_ITEM_CONTEXT");
