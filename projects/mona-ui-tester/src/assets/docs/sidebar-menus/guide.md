## Overview

A sidebar's content is groups of rows. Every part below is a directive on your own element, apart from the skeleton, and none of them are required.

| Part | Host | Purpose |
| --- | --- | --- |
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
| `mona-sidebar-menu-skeleton` | element | A loading placeholder row |

The panel around them, its regions and its look are on the [Sidebar](/components/sidebar) page.

## Import & Quick Start

```typescript
import {
    SidebarGroupContentDirective,
    SidebarGroupDirective,
    SidebarGroupHeaderDirective,
    SidebarGroupLabelDirective,
    SidebarMenuBadgeDirective,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective
} from "@nanahoshi/mona-ui/sidebar";
```

A row is an item plus a control, and optionally something trailing:

```html
<div monaSidebarGroup>
    <div monaSidebarGroupHeader>
        <span monaSidebarGroupLabel>Mail</span>
    </div>
    <div monaSidebarGroupContent>
        <ul monaSidebarMenu>
            <li monaSidebarMenuItem [active]="isCurrent()">
                <a monaSidebarMenuButton routerLink="/inbox" tooltip="Inbox">
                    <svg lucideInbox [size]="16"></svg>
                    <span>Inbox</span>
                </a>
                <span monaSidebarMenuBadge>12</span>
            </li>
        </ul>
    </div>
</div>
```

## Examples

### Badges, actions and loading rows

A group action in the header, a badge and an overflow action on a row, a disabled row, and a group still loading.

```example
sidebar-menus/rows
```

### With a submenu

A submenu is a `monaCollapsible` item whose content is a `monaSidebarMenuSub` list.

```example
sidebar-menus/submenus
```

## Behavior

### Rows

`active` goes on the **item**, which owns the row's highlight, so a badge or a trailing action stays inside one continuous highlight. The row's control picks up `aria-current="page"` from it.

`size="large"` is for a row that opens with something avatar sized, such as a profile row in the footer. The icon rail lets it fill the square edge to edge instead of insetting and clipping it, and the row is taller while the sidebar is expanded.

`disabled` suppresses the row's activation, including a `routerLink` and any `click` handler on it. A disabled `button` gets the native `disabled` attribute. A disabled anchor gives up its `href`, and keeps a tab stop and `aria-disabled` so it is still announced.

### Closing the drawer

On a compact viewport the sidebar is a drawer that covers the page, so activating a row closes it: the destination is underneath. Opt out with `[closeOnSelect]="false"` on a row that doesn't navigate. A row that opens a submenu leaves the drawer open without that binding.

### Submenus

A submenu is an ordinary `monaCollapsible` on an ordinary item — the sidebar adds no disclosure of its own. Apply `monaCollapsible` to the item, `monaCollapsibleTrigger` to its control, and `monaCollapsibleContent` to a `monaSidebarMenuSub` list, as in the [With a submenu](#with-a-submenu) example.

Nesting is not limited to one level: a `monaSidebarMenuSub` can hold another collapsible item, as deep as the navigation needs. Each level is a disclosure in its own right, with its own trigger and its own open state.

### On the icon rail

With `collapsible="icon"` a collapsed sidebar keeps only each row's leading visual, in a square:

- Labels are clipped, and each row's `tooltip` names it instead.
- Group headers collapse away, and group labels fade out.
- Badges, trailing actions, group actions and `monaSidebarInput` stand down.
- A skeleton row clips its label bar, as the real labels are.

A submenu cannot render in a rail one icon wide, and there's no flyout. While on the rail every item keeps its disclosure closed, at every depth, so each trigger's `aria-expanded` stays truthful and the content stays `inert`. Activating a submenu's row on the rail expands the sidebar and opens that submenu, so its pages can always be reached. A row with no submenu leaves the rail as it is. Whatever was open before collapsing is restored when the sidebar expands again — level by level, so a submenu that was closed stays closed.

### Loading rows

`mona-sidebar-menu-skeleton` goes in an item in place of the row's control, laid out exactly like a real row, so the two animate as one. Vary `labelWidth` across a list so the placeholder doesn't look like a rigid grid, and set `[showIcon]="false"` for rows that have no icon.

The skeleton is hidden from assistive technology. Mark what's loading on its container instead, with `aria-busy="true"`, and remove it when the rows arrive.

## Accessibility

### Use anchors for destinations

`monaSidebarMenuButton` applies to both `a` and `button`. Use an anchor for anything that navigates:

```html
<a monaSidebarMenuButton routerLink="/billing" tooltip="Billing">…</a>
```

A button cannot be opened in a new tab, middle-clicked, previewed in the status bar, or followed when JavaScript fails. Reserve `button` for actions — a disclosure trigger, a sign-out.

### Label the icon rail

While collapsed to icons the labels are clipped away. Set `tooltip` on every row, and the row shows it as a tooltip on hover and on keyboard focus, on the rail only. Keep a label inside the row as well: that's its accessible name, in both states.

`mona-sidebar` shows these itself, and they open toward the content. There's nothing to import, and it isn't a `title`: the browser adds no tooltip of its own, and a `monaTooltip` in `content` mode around the sidebar doesn't pick the row up. A `title` you put on a row yourself stays there, so use one or the other.

### Name the icon-only controls

`monaSidebarGroupAction` and `monaSidebarMenuAction` hold only an icon, so each needs an `aria-label` that says what it acts on, such as "Inbox actions" rather than "More".
