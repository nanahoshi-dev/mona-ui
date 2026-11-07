import { inject } from "@angular/core";
import type { SidebarController } from "../models/SidebarController";
import { SidebarLayoutService } from "../services/sidebar-layout.service";
import { SidebarService } from "../services/sidebar.service";

export interface InjectSidebarOptions {
    /** Reads the sidebar with this id in the enclosing layout, rather than the nearest one. */
    readonly for?: string;
    /** Returns `null` instead of throwing when there is no enclosing sidebar or layout. */
    readonly optional?: boolean;
}

/**
 * @description
 * Reads a sidebar from an injection context: the one that encloses the caller, or from elsewhere in a
 * `mona-sidebar-layout`, such as a toolbar in the inset, the layout's first sidebar. Name another one with `for`.
 *
 * Returns the sidebar's state and the commands that are safe to issue from anywhere — opening,
 * closing and toggling, each routed to whichever presentation is current. Structural facts such as
 * the side, variant and collapsible mode are readable but not settable; those are authored as inputs
 * on `mona-sidebar`, and writing them from a descendant would only desynchronise the two.
 *
 * In a layout it follows the sidebar rather than holding it, because the caller may be created first. Until there is
 * one, it reads as closed and its commands do nothing.
 *
 * @param options.optional Returns `null` instead of throwing when there is no enclosing sidebar or layout.
 * @param options.for The id of the `mona-sidebar` to read, in the enclosing layout.
 */
export function injectSidebar(options: InjectSidebarOptions & { optional: true }): SidebarController | null;
export function injectSidebar(options?: InjectSidebarOptions): SidebarController;
export function injectSidebar(options?: InjectSidebarOptions): SidebarController | null {
    const service = inject(SidebarService, { optional: true });
    if (service && !options?.for) {
        return service.controller;
    }
    const layout = inject(SidebarLayoutService, { optional: true });
    if (layout) {
        return layout.controllerFor(options?.for);
    }
    // Asked again without `optional`, for the framework's own error when there's nothing to read.
    return options?.optional ? null : inject(SidebarService).controller;
}
