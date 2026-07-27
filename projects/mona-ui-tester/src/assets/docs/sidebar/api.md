## Overview & Usage Guidelines

The sidebar is split into a small number of structural pieces and a set of content directives.

- `SidebarLayoutComponent` (`mona-sidebar-layout`) provides the shared state and the row layout. It is the only piece that must wrap the others.
- `SidebarComponent` (`mona-sidebar`) is the panel. It owns `width`, `collapsible`, `variant` and `side`, and switches itself to a modal drawer on compact viewports.
- `SidebarInsetDirective` (`[monaSidebarInset]`) marks the main region beside the panel. It fills the remaining width, scrolls independently, and goes inert behind an open drawer.
- `SidebarTriggerDirective` (`[monaSidebarTrigger]`) toggles a sidebar from anywhere inside the layout, naming one with `for` where there is more than one.

Content is projected in author order, so a header, content region and footer appear exactly where you write them. None of the directives add wrapper elements.

## Import & Basic Usage

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

## Accessibility Requirements

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

`monaSidebarRail` is deliberately outside the tab order: it is a pointer shortcut, and a tab stop onto a 4px strip would be noise. It is **not** a substitute for a trigger. Always render a `monaSidebarTrigger` as well, or the sidebar cannot be opened from the keyboard at all.

Give both an accessible name:

```html
<button monaSidebarTrigger aria-label="Toggle sidebar">…</button>
<button monaSidebarRail aria-label="Toggle sidebar"></button>
```

A `button` host needs nothing further. On any other element the trigger supplies `role`, a tab stop, and Enter/Space activation itself.

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

While collapsed to icons the labels are clipped away. Set `tooltip` on every row so the icon keeps an accessible name — it is applied as `title`, and an ancestor carrying `monaTooltip` with `mode="content"` renders it as a styled tooltip instead.

## State & Behavior

### Controlled state

`expanded` is a two-way model on `mona-sidebar`. On a compact viewport it reflects the drawer, so one binding drives both presentations:

```html
<mona-sidebar-layout>
    <mona-sidebar [(expanded)]="sidebarOpen">…</mona-sidebar>
</mona-sidebar-layout>
```

### More than one sidebar

A layout can hold more than one sidebar — a navigation column on one edge and an inspector on the other. Each keeps its own state on its own binding, and each needs an `id` so a trigger can name it:

```html
<mona-sidebar-layout>
    <mona-sidebar id="nav" side="start" [(expanded)]="navOpen">…</mona-sidebar>
    <main monaSidebarInset>
        <button monaSidebarTrigger for="nav" aria-label="Toggle navigation">Menu</button>
        <button monaSidebarTrigger for="inspector" aria-label="Toggle inspector">Details</button>
    </main>
    <mona-sidebar id="inspector" side="end" [(expanded)]="inspectorOpen">…</mona-sidebar>
</mona-sidebar-layout>
```

A trigger with no `for` drives the sidebar it is written inside, falling back to the first sidebar in the layout — which is all a layout with a single sidebar ever needs. A `for` naming no sidebar leaves the trigger inert rather than throwing.

On a compact viewport only one drawer is open at a time: opening one closes the other, and they share the single backdrop the layout paints behind them. The inset steps out of the way for whichever drawer is open, and takes its surface from the first sidebar in author order.

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

The controller exposes `expanded`, `state`, `iconOnly`, `compact`, `mobileOpen`, `side`, `variant`, `collapsible` and `sidebarId` as signals, plus `expand()`, `collapse()` and `toggle()`.

Structural facts are readable but not settable. `side`, `variant` and `collapsible` are authored as inputs on `mona-sidebar`; writing them from a descendant would leave the component and the shared state disagreeing until the next change detection pass. Bind the inputs instead.

Pass `{ optional: true }` for a component that may be used outside a sidebar.

### Collapsible modes

| Mode | Collapsed behaviour |
| --- | --- |
| `offcanvas` (default) | Panel shrinks to nothing and is made `inert`, so nothing inside stays focusable |
| `icon` | Panel narrows to `iconWidth`; labels, badges, trailing actions and submenus stand aside |
| `none` | Collapsing is disabled; the panel is always at full width |

### Submenus on the icon rail

A submenu cannot render in a rail one icon wide. While on the rail the item keeps its disclosure closed, so the trigger's `aria-expanded` stays truthful and the content stays `inert`. A submenu that was open before collapsing is restored when the sidebar expands again.

### Responsive behaviour

Below `mobileBreakpoint` (default `768`) the sidebar becomes a modal drawer:

- Slides in from its docked edge; the rest of the layout goes `inert` and stops scrolling
- Focus is trapped inside it and restored to the trigger on close
- Escape and backdrop clicks close it; a docked sidebar ignores Escape
- Drawer state is separate from the desktop state and resets whenever the viewport crosses the breakpoint
- Activating a row closes the drawer, since the destination is underneath it — opt out with `[closeOnSelect]="false"`

Set `mobileBreakpoint` to `0` to keep the docked presentation at every size.

```html
<mona-sidebar-layout [mobileBreakpoint]="1024">
    <mona-sidebar mobileWidth="20rem">…</mona-sidebar>
</mona-sidebar-layout>
```

### Direction

Prefer `side="start"` and `side="end"`, which follow the document's writing direction. `"left"` and `"right"` are retained as aliases of them — they were always a poor description, since the layout orders the sidebar with flexbox and `side="left"` already rendered on the right under RTL. All borders and rail positioning use logical properties.

### Server rendering

Supply a stable `id` on `mona-sidebar` so the client does not hydrate onto a different generated id:

```html
<mona-sidebar id="app-sidebar">…</mona-sidebar>
```

Where `matchMedia` is unavailable — a server render, a test environment — the sidebar keeps its docked presentation, which is the one that degrades gracefully.

## Theming

The sidebar draws from its own colour roles, so it can sit apart from the page content without restyling every part: `--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-primary`, `--color-sidebar-primary-foreground`, `--color-sidebar-accent`, `--color-sidebar-accent-foreground`, `--color-sidebar-border` and `--color-sidebar-ring`.

Every built-in theme defines them for each of its variants. A custom theme can build the whole set from one background with `createSidebarColorRoles()` from `@nanahoshi/mona-ui/theme`.

### Variants

| Variant | Treatment |
| --- | --- |
| `sidebar` (default) | Flush against the edge with a single border |
| `floating` | Detached on its own rounded, shadowed surface |
| `inset` | Transparent; the raised surface moves onto the inset region instead |

`width`, `iconWidth` and `mobileWidth` are the width the sidebar's *contents* receive. The variant's border is added on top, so a `3rem` icon rail always leaves exactly one `2rem` icon square whatever border the variant draws.
