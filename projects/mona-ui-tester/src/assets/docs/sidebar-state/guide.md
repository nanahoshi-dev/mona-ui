## Overview

| What | How | Event |
| :--- | :--- | :--- |
| What collapsing does | `collapsible` on `mona-sidebar` | — |
| Open or closed | `[(expanded)]` on `mona-sidebar`, or a `monaSidebarTrigger` | `expandedChange` |
| Remembered across reloads | `persistKey` on `mona-sidebar`; `provideSidebarStorage()` | — |
| Read or driven from code | `injectSidebar()` | — |
| When it becomes a drawer | `mobileBreakpoint` on `mona-sidebar-layout` | — |
| How far the drawer's modality reaches | `modalScope` on `mona-sidebar-layout` | — |

Each sidebar keeps its own state. A layout with two sidebars has two of everything on this page.

## Import & Quick Start

```typescript
import { SidebarComponent, SidebarLayoutComponent, SidebarTriggerDirective } from "@nanahoshi/mona-ui/sidebar";
```

```html
<mona-sidebar-layout [mobileBreakpoint]="1024">
    <mona-sidebar collapsible="icon" persistKey="nav" [(expanded)]="navOpen">…</mona-sidebar>
    <main monaSidebarInset>
        <button monaSidebarTrigger aria-label="Toggle sidebar">…</button>
    </main>
</mona-sidebar-layout>
```

## Examples

### Remembered and read from code

The sidebar keeps whether it was left open under `persistKey`, so reloading the page brings it back that way. The toolbar in the inset reads it with `injectSidebar()`.

```example
sidebar-state/remembered
```

### Two sidebars

Each sidebar has an `id`, and each trigger names the one it toggles with `for`.

```example
sidebar-state/two-sidebars
```

## Behavior

### Collapsible modes

| Mode | Collapsed behaviour |
| --- | --- |
| `offcanvas` (default) | Panel shrinks to nothing and is made `inert`, so nothing inside stays focusable |
| `icon` | Panel narrows to `iconWidth`; labels, badges, trailing actions and submenus stand aside, as described on [Sidebar Menus](/components/sidebar/menus#on-the-icon-rail) |
| `none` | Collapsing is disabled; the panel stays at full width. Below `mobileBreakpoint` it's still a drawer that opens and closes |

If focus is on something that collapsing takes away, it moves to a trigger for that sidebar, or to its rail when there's no trigger, rather than falling to the page.

### Controlled state

`expanded` is a two-way model on `mona-sidebar`. On a compact viewport it reflects the drawer, so one binding drives both presentations:

```html
<mona-sidebar-layout>
    <mona-sidebar [(expanded)]="sidebarOpen">…</mona-sidebar>
</mona-sidebar-layout>
```

### More than one sidebar

A layout can hold more than one sidebar — a navigation column on one edge and an inspector on the other. Each keeps its own state on its own binding, and each needs an `id` so a trigger can name it, as in the [Two sidebars](#two-sidebars) example.

A trigger with no `for` drives the sidebar it is written inside, falling back to the first sidebar in the layout — which is all a layout with a single sidebar ever needs. A `for` naming no sidebar leaves the trigger inert rather than throwing.

On a compact viewport only one drawer is open at a time: opening one closes the other, and they share the single backdrop the layout paints behind them. When one drawer opens another, closing it sends focus back to whatever opened the first. The inset steps out of the way for whichever drawer is open, and takes its surface from the first sidebar in author order.

### Remembering the state across reloads

Set `persistKey` and the sidebar comes back the way it was left:

```html
<mona-sidebar persistKey="nav">…</mona-sidebar>
```

Nothing is stored without a key — the sidebar never writes to storage on its own. Give each sidebar in a layout its own key.

Only the docked state is kept. A drawer is never restored open, because on the viewport that makes one it would cover the page on load, and opening a drawer never overwrites the state the desktop comes back to. A stored value wins over `expanded` and is pushed back out through that binding, so do not set a key on a sidebar whose state is already restored elsewhere.

#### Where it is kept

The default is `localStorage`, under exactly the key given, with no prefix, so pick one nothing else in the application writes to. Storage that is unavailable — a server, private browsing, a full quota — is not an error: the sidebar just opens the way its `expanded` input says.

**A server-rendered application will flash.** `localStorage` cannot be read on the server, so the markup is rendered with the default state and corrected on hydration. To avoid it, supply storage the server can read too — a cookie, or state transferred from the request:

```typescript
import { provideSidebarStorage, type SidebarStorage } from "@nanahoshi/mona-ui/sidebar";

const cookieStorage: SidebarStorage = {
    read: key => { … },  // null when nothing is stored
    write: (key, expanded) => { … }
};

bootstrapApplication(AppComponent, {
    providers: [provideSidebarStorage(cookieStorage)]
});
```

`read` returns `null` when it has nothing for that key, which leaves the sidebar on its input's state. A storage that throws is reported in development and otherwise treated the same way.

`provideSidebarStorage()` also takes a factory, which runs in an injection context, for storage that needs something from the current request:

```typescript
provideSidebarStorage(() => new CookieStorage(inject(REQUEST)))
```

A value the default storage doesn't recognize, such as another feature's entry under the same key, counts as nothing stored, and stays there until the sidebar's state changes. Nothing is written until then. Storage isn't watched, so tabs don't follow each other.

### Reading the sidebar from a descendant

`injectSidebar()` returns the sidebar's state and the commands that are safe to issue from anywhere:

```typescript
import { injectSidebar } from "@nanahoshi/mona-ui/sidebar";

@Component({ … })
export class WorkspaceSwitcherComponent {
    protected readonly sidebar = injectSidebar();

    protected onSelect(): void {
        if (this.sidebar.compact()) {
            this.sidebar.collapse();
        }
    }
}
```

The controller exposes `expanded`, `state`, `iconOnly`, `compact`, `mobileOpen`, `side`, `variant`, `collapsible` and `sidebarId` as signals, plus `expand()`, `collapse()` and `toggle()`. The [API](#api) section describes each one.

Structural facts are readable but not settable. `side`, `variant` and `collapsible` are authored as inputs on `mona-sidebar`; writing them from a descendant would leave the component and the shared state disagreeing until the next change detection pass. Bind the inputs instead.

Inside a `mona-sidebar` it reads that sidebar. Elsewhere in a `mona-sidebar-layout`, such as a toolbar in the inset, it reads the layout's first sidebar in author order, or the one you name with `injectSidebar({ for: "inspector" })`. A sidebar that hasn't rendered yet reads as closed, and commands to it do nothing.

Call it in an injection context. It throws when there's no sidebar or layout around the caller, unless you pass `{ optional: true }`, for a component that may be used outside a layout.

### Responsive behaviour

Below `mobileBreakpoint` (default `768`) the sidebar becomes a modal drawer:

- Slides in from its docked edge; everything outside it goes `inert` and the page stops scrolling
- It's a `dialog` named by `aria-label` or `aria-labelledby`, with a localized default
- Focus is trapped inside it, on the panel itself if it has no controls. On close, however it closed, focus returns to whatever opened it, unless it has already moved somewhere else
- Escape and backdrop clicks close it, wherever focus is. A docked sidebar ignores Escape. A control that calls `preventDefault()` on the key keeps it, and so does a popup opened from the drawer. In nested layouts, it closes only the inner drawer
- Drawer state is separate from the desktop state and resets whenever the viewport crosses the breakpoint
- Activating a row closes the drawer, since the destination is underneath it — opt out with `[closeOnSelect]="false"`. A row that opens a submenu leaves it open without that binding

While the viewport is compact, `[(expanded)]` reports the drawer, so it reads `false` on a phone from the start. To remember the docked state, use `persistKey` rather than saving that value.

Set `mobileBreakpoint` to `0` to keep the docked presentation at every size.

```html
<mona-sidebar-layout [mobileBreakpoint]="1024">
    <mona-sidebar mobileWidth="20rem">…</mona-sidebar>
</mona-sidebar-layout>
```

#### How far the drawer's modality reaches

By default an open drawer makes the whole page inert and locks its scroll, so an app header above the layout can't be reached behind it. Popups opened from the drawer, such as a menu or a tooltip, stay usable. The lock only acts when the page itself scrolls: in an app whose root doesn't, there's nothing for it to lock. The inset stops scrolling behind the drawer either way.

A sidebar embedded in part of a page can keep this to its layout, with `modalScope`. Anything beside the layout that has to stay usable while a drawer is open, such as a toolbar or a Close button, needs this too. What's around the layout stays usable and the page keeps scrolling, so the drawer isn't `aria-modal` then:

```html
<mona-sidebar-layout modalScope="layout">…</mona-sidebar-layout>
```

The backdrop covers the layout either way, and never more than that.

### Server rendering

Supply a stable `id` on `mona-sidebar` so the client does not hydrate onto a different generated id:

```html
<mona-sidebar id="app-sidebar">…</mona-sidebar>
```

Where `matchMedia` is unavailable — a server render, a test environment — the sidebar keeps its docked presentation, which is the one that degrades gracefully.

`persistKey` needs storage the server can read, or the remembered state arrives a frame late. See [Where it is kept](#where-it-is-kept).

## Accessibility

- Keep a `monaSidebarTrigger` in the layout, with an accessible name. The rail is a pointer shortcut and isn't in the tab order, so without a trigger a collapsed sidebar can't be opened from the keyboard. See [Provide a trigger](/components/sidebar#provide-a-trigger).
- Name the drawer, with `aria-label` or `aria-labelledby` on `mona-sidebar`, when the localized default doesn't describe it.
- Use `modalScope="layout"` only when the layout really is part of a page. With the default, a screen reader can't wander out of an open drawer into content it covers.
