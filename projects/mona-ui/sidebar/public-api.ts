/*
 * Public API Surface of @nanahoshi/mona-ui/sidebar
 */

export * from "./components/sidebar/sidebar.component";
export * from "./components/sidebar-layout/sidebar-layout.component";
export * from "./components/sidebar-menu-skeleton/sidebar-menu-skeleton.component";

export * from "./directives/sidebar-content.directive";
export * from "./directives/sidebar-footer.directive";
export * from "./directives/sidebar-group.directive";
export * from "./directives/sidebar-group-action.directive";
export * from "./directives/sidebar-group-content.directive";
export * from "./directives/sidebar-group-header.directive";
export * from "./directives/sidebar-group-label.directive";
export * from "./directives/sidebar-header.directive";
export * from "./directives/sidebar-input.directive";
export * from "./directives/sidebar-inset.directive";
export * from "./directives/sidebar-menu-action.directive";
export * from "./directives/sidebar-menu-badge.directive";
export * from "./directives/sidebar-menu.directive";
export * from "./directives/sidebar-menu-button.directive";
export * from "./directives/sidebar-menu-item.directive";
export * from "./directives/sidebar-menu-sub.directive";
export * from "./directives/sidebar-rail.directive";
export * from "./directives/sidebar-separator.directive";
export * from "./directives/sidebar-trigger.directive";

export type { SidebarCollapsibleMode } from "./models/SidebarCollapsibleMode";
export type { SidebarController } from "./models/SidebarController";
export type { SidebarMenuButtonSize } from "./models/SidebarMenuButtonSize";
export type { SidebarLogicalSide, SidebarSide } from "./models/SidebarSide";
export type { SidebarStorage } from "./models/SidebarStorage";
export type { SidebarVariant } from "./models/SidebarVariant";

export { provideSidebarStorage } from "./providers/sidebar.providers";
export { LocalStorageSidebarStorage } from "./strategies/local-storage-sidebar.strategy";
export { SIDEBAR_STORAGE } from "./tokens/sidebar.tokens";

/*
 * `SidebarService` is deliberately not exported. Its structural setters exist so `mona-sidebar` can
 * publish its own inputs, and calling them from a consumer leaves the service and the component
 * disagreeing about the same sidebar until the next change detection pass. `injectSidebar()` returns
 * the reads and the commands that are safe from anywhere.
 */
export { injectSidebar } from "./utils/inject-sidebar";
