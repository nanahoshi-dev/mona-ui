# Sidebar

**Selectors:** `mona-sidebar-layout`, `mona-sidebar`, `[monaSidebarInset]`, `[monaSidebarTrigger]`, and the menu parts below

Sidebar is a composable application shell. `mona-sidebar-layout` owns the shared state and lays out a `mona-sidebar` beside a `[monaSidebarInset]` main region. Everything else — headers, groups, menus, rows, footers — is a directive you apply to your own markup, so the structure stays yours.

On wide viewports the sidebar is a column that can collapse to an icon rail or off-canvas entirely. Below `mobileBreakpoint` it presents as a modal overlay drawer with its own open state, a backdrop, focus trapping, and Escape to dismiss.
