## Overview

The sidebar is split into a small number of structural pieces and a set of content directives.

- `SidebarLayoutComponent` (`mona-sidebar-layout`) provides the row layout and what the panels share — the breakpoint, and the one backdrop behind whichever drawer is open. It is the only piece that must wrap the others.
- `SidebarComponent` (`mona-sidebar`) is the panel, and owns its own state. It takes `width`, `collapsible`, `variant`, `side` and `expanded`, and switches itself to a modal drawer on compact viewports. A layout can hold more than one.
- `SidebarInsetDirective` (`[monaSidebarInset]`) marks the main region beside the panel. It fills the remaining width, scrolls independently, and goes inert behind an open drawer.
- `SidebarTriggerDirective` (`[monaSidebarTrigger]`) toggles a sidebar from anywhere inside the layout, naming one with `for` where there is more than one.

Content is projected in author order, so a header, content region and footer appear exactly where you write them. None of the directives add wrapper elements.

### The parts

Apart from the skeleton, everything below is a directive applied to your own element. None of them are required, and none add markup of their own. The [API](#api) section lists their inputs.

| Part | Host | Purpose |
| --- | --- | --- |
| `[monaSidebarHeader]` | any | Pinned region at the top, above the scrolling content |
| `[monaSidebarContent]` | any | The scrolling region between header and footer |
| `[monaSidebarFooter]` | any | Pinned region at the bottom |
| `[monaSidebarGroup]` | any | A titled section; stack as many as you need |
| `[monaSidebarGroupHeader]` | any | The row holding a group's label and action; collapses away on the rail |
| `[monaSidebarGroupLabel]` | any | The group's name, which the group is labelled by; fades out on the rail |
| `[monaSidebarGroupAction]` | `button` | A control in the group header's corner; needs an `aria-label` |
| `[monaSidebarGroupContent]` | any | The group's body, wrapping its menu |
| `[monaSidebarMenu]` | `ul` | A list of rows |
| `[monaSidebarMenuItem]` | `li` | One row; owns the highlight and `active` |
| `[monaSidebarMenuButton]` | `a` / `button` | The row's control; takes `tooltip`, `size`, `disabled`, `closeOnSelect` |
| `[monaSidebarMenuAction]` | `button` | A trailing control inside the row; needs an `aria-label` |
| `[monaSidebarMenuBadge]` | any | A trailing count or status; stands down on the rail |
| `[monaSidebarMenuSub]` | `ul` | An indented submenu inside a collapsible item |
| `[monaSidebarInput]` | `input` | A text input sized for the sidebar; stands down on the rail |
| `[monaSidebarSeparator]` | any | A rule between regions |
| `[monaSidebarRail]` | `button` | A pointer shortcut along the panel's edge; not a keyboard control — see below |
| `mona-sidebar-menu-skeleton` | element | A loading placeholder row |

A row is an item plus a control, and optionally something trailing:

```html
<li monaSidebarMenuItem [active]="isCurrent()">
    <a monaSidebarMenuButton routerLink="/inbox" tooltip="Inbox">
        <svg lucideInbox [size]="16"></svg>
        <span>Inbox</span>
    </a>
    <span monaSidebarMenuBadge>12</span>
</li>
```

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

### With a submenu

A submenu is a `monaCollapsible` item whose content is a `monaSidebarMenuSub` list.

```example
sidebar/submenus
```

### Two sidebars

Each sidebar has an `id`, and each trigger names the one it toggles with `for`.

```example
sidebar/two-sidebars
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

`width`, `iconWidth` and `mobileWidth` are the width the sidebar's *contents* receive. The variant's border is added on top, so a `3rem` icon rail always leaves exactly one `2rem` icon square whatever border the variant draws. The `sidebar` variant has no border as a drawer, so `mobileWidth` is its whole width.

## Behavior

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

Pass `{ optional: true }` for a component that may be used outside a layout.

### Collapsible modes

| Mode | Collapsed behaviour |
| --- | --- |
| `offcanvas` (default) | Panel shrinks to nothing and is made `inert`, so nothing inside stays focusable |
| `icon` | Panel narrows to `iconWidth`; labels, badges, trailing actions and submenus stand aside |
| `none` | Collapsing is disabled; the panel stays at full width. Below `mobileBreakpoint` it's still a drawer that opens and closes |

If focus is on something that collapsing takes away, it moves to a trigger for that sidebar, or to its rail when there's no trigger, rather than falling to the page.

### Submenus

A submenu is an ordinary `monaCollapsible` on an ordinary item — the sidebar adds no disclosure of its own. Apply `monaCollapsible` to the item, `monaCollapsibleTrigger` to its control, and `monaCollapsibleContent` to a `monaSidebarMenuSub` list, as in the [With a submenu](#with-a-submenu) example.

Nesting is not limited to one level: a `monaSidebarMenuSub` can hold another collapsible item, as deep as the navigation needs. Each level is a disclosure in its own right, with its own trigger and its own open state.

#### On the icon rail

A submenu cannot render in a rail one icon wide, and there's no flyout. While on the rail every item keeps its disclosure closed, at every depth, so each trigger's `aria-expanded` stays truthful and the content stays `inert`. Activating a submenu's row on the rail expands the sidebar and opens that submenu, so its pages can always be reached. A row with no submenu leaves the rail as it is. Whatever was open before collapsing is restored when the sidebar expands again — level by level, so a submenu that was closed stays closed.

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

### Direction

Prefer `side="start"` and `side="end"`, which follow the document's writing direction. `"left"` and `"right"` are aliases of them rather than physical sides, so `side="left"` sits on the right under RTL.

The panel's border, the drawer's edge and the rail don't use logical properties. Each resolves to a physical left or right from the direction, so they follow it too. To override that border through `class`, name the physical side, such as `border-r-0`. `tailwind-merge` treats `border-e-0` as a different class, so it doesn't replace the border.

### Server rendering

Supply a stable `id` on `mona-sidebar` so the client does not hydrate onto a different generated id:

```html
<mona-sidebar id="app-sidebar">…</mona-sidebar>
```

Where `matchMedia` is unavailable — a server render, a test environment — the sidebar keeps its docked presentation, which is the one that degrades gracefully.

`persistKey` needs storage the server can read, or the remembered state arrives a frame late. See [Where it is kept](#where-it-is-kept).

- Call it in an injection context. It throws when there's no sidebar or layout around the caller, unless `optional` is set.

## Accessibility

These are requirements, not suggestions. The component supplies what it can and relies on you for the rest.

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

### Use anchors for destinations

`monaSidebarMenuButton` applies to both `a` and `button`. Use an anchor for anything that navigates:

```html
<a monaSidebarMenuButton routerLink="/billing" tooltip="Billing">…</a>
```

A button cannot be opened in a new tab, middle-clicked, previewed in the status bar, or followed when JavaScript fails. Reserve `button` for actions — a disclosure trigger, a sign-out.

Mark the current destination on the **item**, which owns the row's highlight. The row's control picks up `aria-current="page"` from it:

```html
<li monaSidebarMenuItem [active]="isCurrent()">…</li>
```

### Label the icon rail

While collapsed to icons the labels are clipped away. Set `tooltip` on every row, and the row shows it as a tooltip on hover and on keyboard focus, on the rail only. Keep a label inside the row as well: that's its accessible name, in both states.

`mona-sidebar` shows these itself, and they open toward the content. There's nothing to import, and it isn't a `title`: the browser adds no tooltip of its own, and a `monaTooltip` in `content` mode around the sidebar doesn't pick the row up. A `title` you put on a row yourself stays there, so use one or the other.
