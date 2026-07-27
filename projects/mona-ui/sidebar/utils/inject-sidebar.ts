import { inject } from "@angular/core";
import type { SidebarController } from "../models/SidebarController";
import { SidebarService } from "../services/sidebar.service";

/**
 * @description
 * Reads the sidebar that encloses the calling component or directive. Must be called from an
 * injection context inside a `mona-sidebar-layout`.
 *
 * Returns the sidebar's state and the commands that are safe to issue from anywhere — opening,
 * closing and toggling, each routed to whichever presentation is current. Structural facts such as
 * the side, variant and collapsible mode are readable but not settable; those are authored as inputs
 * on `mona-sidebar`, and writing them from a descendant would only desynchronise the two.
 *
 * @param options.optional Returns `null` instead of throwing when there is no enclosing layout.
 */
export function injectSidebar(): SidebarController;
export function injectSidebar(options: { optional: true }): SidebarController | null;
export function injectSidebar(options?: { optional: true }): SidebarController | null {
    const service = inject(SidebarService, { optional: options?.optional ?? false });
    return service?.controller ?? null;
}
