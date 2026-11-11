## Overview

The sidebar is split into a small number of structural pieces and a set of content directives.

- `SidebarLayoutComponent` (`mona-sidebar-layout`) provides the row layout and what the panels share — the breakpoint, and the one backdrop behind whichever drawer is open. It is the only piece that must wrap the others.
- `SidebarComponent` (`mona-sidebar`) is the panel, and owns its own state. It takes `width`, `collapsible`, `variant`, `side` and `expanded`, and switches itself to a modal drawer on compact viewports. A layout can hold more than one.
- `SidebarInsetDirective` (`[monaSidebarInset]`) marks the main region beside the panel. It fills the remaining width, scrolls independently, and goes inert behind an open drawer.
- `SidebarTriggerDirective` (`[monaSidebarTrigger]`) toggles a sidebar from anywhere inside the layout, naming one with `for` where there is more than one.

Content is projected in author order, so a header, content region and footer appear exactly where you write them. None of the directives add wrapper elements.

| Topic | Page |
| :--- | :--- |
| The panel's regions, its look, its width and its side | This page |
| Groups, rows, submenus, badges, actions, loading rows and the icon rail's tooltips | [Sidebar Menus](/components/sidebar/menus) |
| Collapsing, `[(expanded)]`, `persistKey`, `injectSidebar()`, the drawer and server rendering | [Sidebar State & Behavior](/components/sidebar/state) |

### The parts

Apart from the skeleton, everything below is a directive applied to your own element. None of them are required, and none add markup of their own.

| Part | Host | Purpose |
| --- | --- | --- |
| `[monaSidebarHeader]` | any | Pinned region at the top, above the scrolling content |
| `[monaSidebarContent]` | any | The scrolling region between header and footer |
| `[monaSidebarFooter]` | any | Pinned region at the bottom |
| `[monaSidebarSeparator]` | any | A rule between regions |
| `[monaSidebarRail]` | `button` | A pointer shortcut along the panel's edge; not a keyboard control — see below |
| `[monaSidebarGroup]` and its parts | any | A titled section of rows, described on [Sidebar Menus](/components/sidebar/menus) |
| `[monaSidebarMenu]` and its parts | `ul` | A list of rows, described on [Sidebar Menus](/components/sidebar/menus) |
| `[monaSidebarInput]` | `input` | A text input sized for the sidebar; stands down on the rail |

## Import & Quick Start

```typescript
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective,
    SidebarTriggerDirective
} from "@nanahoshi/mona-ui/sidebar";
```

```html
<mona-sidebar-layout>
    <mona-sidebar collapsible="icon">
        <nav monaSidebarContent aria-label="Main">
            <ul monaSidebarMenu>
                <li monaSidebarMenuItem [active]="true">
                    <a monaSidebarMenuButton href="/inbox" tooltip="Inbox">
                        <svg lucideInbox [size]="16"></svg>
                        <span>Inbox</span>
                    </a>
                </li>
            </ul>
        </nav>
    </mona-sidebar>

    <main monaSidebarInset>
        <button monaSidebarTrigger aria-label="Toggle sidebar">Menu</button>
        <router-outlet></router-outlet>
    </main>
</mona-sidebar-layout>
```

## Examples

### Collapsing to icons

With `collapsible="icon"` the panel narrows to a rail of icons. Each row's `tooltip` names it there, and the rail along the edge and the trigger both toggle it.

```example
sidebar/icon-rail
```

## Theming

The sidebar draws from its own colour roles, so it can sit apart from the page content without restyling every part: `--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-primary`, `--color-sidebar-primary-foreground`, `--color-sidebar-accent`, `--color-sidebar-accent-foreground`, `--color-sidebar-border` and `--color-sidebar-ring`.

Every built-in theme defines them for each of its variants. A custom theme can build the whole set from one background with `createSidebarColorRoles()` from `@nanahoshi/mona-ui/theme`.

### Variants

| Variant | Treatment |
| --- | --- |
| `sidebar` (default) | Flush against the edge with a single border |
| `floating` | Detached on its own rounded, shadowed surface |
| `inset` | Transparent; the raised surface moves onto the inset region instead |

### Width

`width`, `iconWidth` and `mobileWidth` are the width the sidebar's *contents* receive, and take a CSS length or a number of pixels. The variant's border is added on top, so a `3rem` icon rail always leaves exactly one `2rem` icon square whatever border the variant draws. The `sidebar` variant has no border as a drawer, so `mobileWidth` is its whole width.

## Behavior

### Direction

Prefer `side="start"` and `side="end"`, which follow the document's writing direction. `"left"` and `"right"` are aliases of them rather than physical sides, so `side="left"` sits on the right under RTL.

The panel's border, the drawer's edge and the rail don't use logical properties. Each resolves to a physical left or right from the direction, so they follow it too. To override that border through `class`, name the physical side, such as `border-r-0`. `tailwind-merge` treats `border-e-0` as a different class, so it doesn't replace the border.

## Accessibility

These are requirements, not suggestions. The component supplies what it can and relies on you for the rest. Rows have rules of their own, on [Sidebar Menus](/components/sidebar/menus#accessibility).

### Provide a landmark

`mona-sidebar` deliberately carries no ARIA role. A sidebar usually holds more than navigation — a team switcher, a search box, a profile menu — so labelling the whole region `navigation` would over-describe it.

Wrap the menus in a labelled `nav` instead:

```html
<nav monaSidebarContent aria-label="Main">…</nav>
```

If the entire region really is navigation, set the role on the panel and give it a name:

```html
<mona-sidebar role="navigation" aria-label="Main">…</mona-sidebar>
```

Label every landmark. Two unlabelled `nav` elements on a page are indistinguishable to a screen reader user.

### Provide a trigger

`monaSidebarRail` is deliberately outside the tab order: it is a pointer shortcut, and a tab stop onto a 4px strip would be noise. It is **not** a substitute for a trigger. Always render a `monaSidebarTrigger` as well, or the sidebar cannot be opened from the keyboard at all. That includes small viewports, where the rail is hidden: below `640px`, and inside a drawer at any width.

Give the trigger an accessible name. The rail has a localized one by default, and takes an `aria-label` if you want another. The rail goes inside the sidebar, which positions it, and the trigger can go anywhere in the layout:

```html
<mona-sidebar>
    …
    <button monaSidebarRail></button>
</mona-sidebar>
<main monaSidebarInset>
    <button monaSidebarTrigger aria-label="Toggle sidebar">…</button>
</main>
```

A `button` host needs nothing further. On any other element, including an `a` without `href`, the trigger supplies `role`, a tab stop, and Enter/Space activation itself.

On a sidebar that can't collapse (`collapsible="none"`) a trigger has nothing to do on a wide viewport, so it reports `aria-disabled` there rather than an open disclosure. A `for` that finds no sidebar leaves the trigger inert and warns in development. `for` only reaches sidebars in the trigger's own layout.
