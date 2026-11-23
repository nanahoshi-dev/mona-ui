## Overview

Tabs organizes related content into named panels and shows one panel at a time. Each panel is declared as a `<mona-tab>` projected inside `<mona-tabs>`; `TabsComponent` renders the clickable tab strip and swaps the visible panel when the consumer selects a different tab.

**Use Tabs when:**

- Content naturally divides into a small, fixed set of named sections that share the same context (for example, "Login" and "Register" panels in the same card).
- Only one section needs to be visible at a time, and switching between them should not navigate to a different route.

Tabs is not a routing mechanism. Switching tabs does not change the URL. To deep-link to a tab, read the route yourself and bind `selectedIndex`, or `selected` on the tab.

When the tabs sit apart from what they show, such as browser-style tabs in a window's titlebar over the page below, use `<mona-tab-strip>`. It draws only the tab list, and you render each tab's panel wherever it goes. See [Tabs whose panels are elsewhere](#tabs-whose-panels-are-elsewhere).

## Import & Quick Start

```typescript
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";
```

For a strip whose panels you render yourself, import `TabStripComponent` instead of `TabsComponent`.

```html
<mona-tabs aria-label="Account">
    <mona-tab title="Profile">
        <ng-template monaTabContentTemplate>
            <p>Profile content.</p>
        </ng-template>
    </mona-tab>
    <mona-tab title="Settings">
        <ng-template monaTabContentTemplate>
            <p>Settings content.</p>
        </ng-template>
    </mona-tab>
</mona-tabs>
```

A `<mona-tab>` renders no content of its own — content must be provided through a `monaTabContentTemplate` template, as shown above. A tab with no `monaTabContentTemplate` renders an empty panel.

## Anatomy

Each structural directive below is an `ng-template` placed as projected content inside `<mona-tab>...</mona-tab>`. Neither template exposes a template context.

| Directive                     | Selector                              | Template context | Replaces                                                                    |
|-------------------------------|---------------------------------------|------------------|-----------------------------------------------------------------------------|
| `TabContentTemplateDirective` | `ng-template[monaTabContentTemplate]` | None             | No default — the tab's panel renders empty without it                       |
| `TabTitleTemplateDirective`   | `ng-template[monaTabTitleTemplate]`   | None             | The default `<span>{{ title }}</span>` rendering of the tab's `title` input |

```html
<mona-tab>
    <ng-template monaTabTitleTemplate>
        <svg lucideSettings [size]="16" aria-hidden="true"></svg>
        <span>Settings</span>
    </ng-template>
    <ng-template monaTabContentTemplate>
        <p>Settings content.</p>
    </ng-template>
</mona-tab>
```

A title template renders inside the tab, whose content is presentational to assistive technology, so it can hold text and icons but not links or other controls.

`<mona-tab-strip>` takes the same `<mona-tab>` children and the same title template. It renders no panels, so it ignores a `monaTabContentTemplate`.

## Examples

### Setting the selected tab

`selectedIndex` is the zero-based index of the selected tab, and works two-way. Writing it selects that tab. A disabled or out-of-range index is refused, and the value goes back to the selected tab's index. If the tabs haven't arrived yet, the index waits for them.

```example
tabs/selected-index
```

`selected` on a `mona-tab` does the same from the tab's side, which suits tabs added conditionally, where the index isn't known. The two stay in sync: `[(selected)]` follows the selection, and `selectedIndex` follows `selected`. Setting `selected` to `true` selects the tab unless it's disabled. A newly flagged tab takes the selection from the tab that has it, and if several are flagged at once, the first wins. Setting `selected` to `false` is refused, because the group always keeps one tab selected, and the value goes back to `true`. Use one or the other: when both are set at the start, `selected` wins.

With nothing set, the first enabled tab is selected. When every `mona-tab` is disabled, none is. `disabled` on `mona-tabs` doesn't count here: it stops the user changing the selection, and code can still change it.

`selectedIndexChange` fires for every change, including the ones the component makes itself. `tabSelect` fires only for a click or key, before it selects a tab. It doesn't fire for a value written to `selectedIndex` or `selected`, or when the selected tab is removed, so it can't veto those.

### Closable tabs

`closable` on `mona-tabs` shows a close button on every tab. A tab's own `closable` input, when `true`, shows a close button for that tab even if the parent's `closable` is `false` — see [`closable` and `disabled` on a tab and its parent](#closable-and-disabled-on-a-tab-and-its-parent).

```example
tabs/closable
```

A middle-click on a tab that can close asks to close it too, as it does on a browser's tabs. It doesn't select the tab, and it stops the middle button from starting to autoscroll the page. `tabClose` carries the click as its `originalEvent`.

Closing a tab is entirely the consumer's responsibility — see [Tabs are removed by the consumer](#tabs-are-removed-by-the-consumer).

### Reordering tabs

`sortable` lets the user reorder the tabs: by dragging one along the strip, or with `Control+Shift` and the arrow keys along it, `Home` or `End` (`Command+Shift` on macOS). As with closing, the component only reports the move: `tabReorder` carries the tab's `previousIndex` and `currentIndex`, and moving it in whatever renders the `mona-tab` elements is what moves it. `moveItem` from `@nanahoshi/mona-ui/sortable` returns the reordered copy of an array.

```example
tabs/sortable
```

The selected tab stays selected wherever it moves, and `selectedIndex` follows it. A disabled tab can't be dragged or moved, but other tabs move past it. Each move is announced: "main.ts moved to position 1 of 4". On a touch screen, press and hold a tab to pick it up, so a swipe still scrolls the strip.

### Disabled tabs

`disabled` on `mona-tabs` disables every tab. `disabled` on an individual `mona-tab` disables only that tab, even if the parent's `disabled` is `false`. A disabled tab cannot be selected or closed by pointer or keyboard. A tab that becomes disabled while it's selected stays selected until something else is chosen, so its panel doesn't disappear from under the user.

```html
<mona-tabs>
    <mona-tab title="Available">
        <ng-template monaTabContentTemplate>Available content.</ng-template>
    </mona-tab>
    <mona-tab title="Locked" [disabled]="true">
        <ng-template monaTabContentTemplate>Locked content.</ng-template>
    </mona-tab>
</mona-tabs>
```

### Preserving tab content when switching tabs

`keepTabContent` (default `true`) keeps every tab's panel mounted in the DOM and toggles its visibility, so component state inside an inactive tab (such as unsaved form input) survives switching away and back. Set it to `false` to mount only the active tab's content, destroying and recreating panels as the consumer switches tabs.

```html
<mona-tabs [keepTabContent]="false">
    <mona-tab title="Draft"><ng-template monaTabContentTemplate>...</ng-template></mona-tab>
    <mona-tab title="Preview"><ng-template monaTabContentTemplate>...</ng-template></mona-tab>
</mona-tabs>
```

### Position

`position` places the tab strip on one of the four edges of the tab content. Top and bottom strips lay out horizontally; left and right strips lay out vertically. This strip is on the left, and its titles use a `monaTabTitleTemplate` to add icons.

```example
tabs/vertical
```

A left or right strip requires a constrained available height so its tabs can scroll vertically when they overflow — see [Vertical layout constraints](#vertical-layout-constraints).

### Size

`size` controls the tab strip's dimensions.

```html
<mona-tabs size="small">
    <mona-tab title="A"><ng-template monaTabContentTemplate>A</ng-template></mona-tab>
    <mona-tab title="B"><ng-template monaTabContentTemplate>B</ng-template></mona-tab>
</mona-tabs>
```

### The pill look

`look="pill"` rounds every tab and raises the selected one on a background with a shadow, in place of the indicator line, and drops the rule between the strip and the content. It suits a strip that stands on its own, such as one in a titlebar. `look` takes the same values on `mona-tabs` and `mona-tab-strip`, and defaults to `"line"`.

```html
<mona-tab-strip aria-label="Open folders" look="pill">...</mona-tab-strip>
```

The selected pill's background is `--mona-tab-pill-background` when it's set, and the theme's raised surface, `--color-surface-raised`, when it isn't. The shadow is the theme's `--shadow-raised`. A theme whose raised surface sits too close to the color behind the strip can point the property at a token of its own, on the strip or anywhere above it:

```css
.app-titlebar {
    --mona-tab-pill-background: var(--color-surface-active);
}
```

Pills keep one font weight, so selecting a tab doesn't change its width. In forced colors, where backgrounds and shadows don't paint, the selected pill gets a ring in the system highlight color instead. When the user asks for more contrast, it gets a ring in the text color as well as its background.

### Tabs whose panels are elsewhere

`<mona-tab-strip>` renders only the tab list. Each tab's panel is yours to render, anywhere on the page, which suits browser-style tabs in a window's titlebar over the content below. It takes the same `<mona-tab>` children as `mona-tabs`, and keeps the same `selectedIndex`, `closable`, `sortable`, keyboard and scrolling behavior.

```example
tabs/strip
```

The tab and its panel still name each other, so assistive technology can go from one to the other:

- `panelId` on each `mona-tab` is the id of the panel you render. The tab names it in `aria-controls`. Tabs can share one panel when the page shows one place at a time, as above. A tab without a `panelId` has no `aria-controls`.
- `tabId` on each `mona-tab` is the id of the tab element. Set it to know it, or read it back from the tab when it's generated. Point the panel's `aria-labelledby` at the selected tab's `tabId`.
- Give the panel `role="tabpanel"` and, unless the first thing in it takes focus, `tabindex="0"`.

```html
<mona-tab-strip aria-label="Open folders" look="pill" [(selectedIndex)]="selectedIndex">
    @for (folder of folders(); track folder.id) {
        <mona-tab [tabId]="'folder-tab-' + folder.id" panelId="folder-view" [title]="folder.name"></mona-tab>
    }
</mona-tab-strip>

<div id="folder-view" role="tabpanel" tabindex="0" [attr.aria-labelledby]="'folder-tab-' + selected().id">...</div>
```

In `mona-tabs`, `tabId` and `panelId` set the ids of the tab and of the panel the component renders, and both are generated when they're empty.

`Tab` on a strip goes to the next control after it, such as a new-tab button, rather than into the panel, since the panel may be anywhere on the page. See [A strip in a row of controls](#a-strip-in-a-row-of-controls) for the layout.

### Migrating from the removed `rounded` input

The `rounded` input has been removed. The tab strip is separated from the content by a rule and the active tab is marked by an indicator line, so no radius is applied to the strip or the content. For rounded tabs, use the [pill look](#the-pill-look).

```text
Before:
<mona-tabs rounded="large">

After, with the line look:
<mona-tabs>

After, with rounded tabs:
<mona-tabs look="pill">
```

Tab content no longer receives a default card-like surface. Consumers that need that appearance should wrap their tab content in `mona-card` or apply their own surface styles.

For compact value selection that does not switch panels — `List | Grid`, `Day | Week | Month`, `Discover | My courses` — use `SegmentedComponent` instead.

### Reacting to and canceling tab selection

`tabSelect` emits before the newly clicked or keyboard-activated tab becomes active. Calling `preventDefault()` on the emitted `TabSelectEvent` keeps the current tab selected. Arrow keys still move focus to a tab you veto, so the keyboard can reach the tabs after it.

```example
tabs/cancel-select
```

## Behavior

### Tabs are removed by the consumer

`TabsComponent` and `TabStripComponent` do not remove a `<mona-tab>` from the DOM when it is closed. `tabClose` only notifies the consumer that a close was requested (by clicking the close button, pressing Delete/Backspace on a tab, or middle-clicking it); the consumer is responsible for removing the corresponding tab from whatever collection drives the projected `<mona-tab>` elements (typically an `@for` loop).

### What happens when the selected tab goes away

The next enabled tab is selected, or the nearest enabled one before it when there's none after. `selectedIndexChange` reports it, and `tabSelect` doesn't fire. If focus was on the removed tab or its close button, it moves to the selected tab. If it had already left the tab strip, it stays where it is.

### `tabClose` has nothing to prevent

`TabCloseEvent` extends `PreventableEvent`, like the other events, but since the component never removes a tab, there's no default action. Calling `preventDefault()` in a `tabClose` handler has no effect. To refuse a close, don't remove the tab.

### `closable` and `disabled` on a tab and its parent

A tab shows a close button when either its own `closable` or the parent's is on, and is disabled when either `disabled` is on. A tab can't opt out of what its parent turns on: there is no way to hide the close button on one tab when the parent's `closable` is `true`.

### Panels are kept by tab, not by value

Changing a tab's `title`, `disabled` or `closable` leaves its panel and everything in it alone, including what's been typed there. Only removing the `mona-tab` itself destroys the panel.

### Lazy content

`keepTabContent` is all or nothing: `true` creates every panel's content at the start, and `false` destroys content on each switch. There's no mode that renders on first visit and then keeps it. For heavy content in a tab, use `@if` inside the template with your own "has been visited" flag.

### Scrolling is automatic and pointer-only

When the tab strip overflows its container, scroll buttons appear automatically — this is not controlled by a public input. Top and bottom strips overflow horizontally (left/right scroll buttons); left and right strips overflow vertically (up/down scroll buttons). The scroll buttons are hidden from assistive technology and are not a Tab stop. Keyboard users can still reach tabs outside the visible area because moving focus with the arrow keys scrolls the newly focused tab into view. A tab selected by code is scrolled into view within the strip, without scrolling the page. Scroll buttons don't animate when the user asks for reduced motion.

### A strip in a row of controls

A `mona-tab-strip` is as wide as its tabs and shrinks with the row it's in, down to nothing, scrolling its tabs once they don't fit. In a titlebar, put it in a flex row and let the space after it grow, so the strip gives way before the controls around it:

```html
<header class="flex h-12 items-center gap-1">
    <mona-tab-strip aria-label="Open folders" look="pill" size="small">...</mona-tab-strip>
    <button monaButton look="ghost" [iconOnly]="true" aria-label="New tab" (click)="add()">+</button>
    <!-- Drag space: it grows to fill the row, and shrinks to its minimum before the strip does. -->
    <div class="h-full min-w-6 flex-1"></div>
</header>
```

The strip is only as tall as its tabs, so center it in a taller row. With the pill look it draws no rule along its edge. A strip is always horizontal.

### Vertical layout constraints

A left or right tab strip needs a constrained available height. If the strip is as tall as its content, the tabs have no room to scroll and overflow tabs become unreachable. Give the `mona-tabs` host a bounded height (for example `class="h-96"`) when using `position="left"` or `position="right"`.

- `"top" | "bottom" | "left" | "right"`. The values of the `position` input.

## Forms Integration

Not applicable. `TabsComponent` and `TabComponent` are not form controls and do not implement `ControlValueAccessor` or the signal forms control interfaces.

## Accessibility

### Keyboard

| Key                                            | Action                                                                                        |
|------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `ArrowLeft` / `ArrowRight` (top/bottom)        | Select the previous/next enabled tab, wrapping around at the ends. Disabled tabs are skipped. |
| `ArrowUp` / `ArrowDown` (left/right)           | Select the previous/next enabled tab, wrapping around at the ends. Disabled tabs are skipped. |
| `Home` / `End`                                 | Select the first/last enabled tab.                                                            |
| `Delete` / `Backspace`                         | Close the tab that has focus, if it is closable and not disabled.                             |
| `Control+Shift` with the strip's arrow keys, `Home` or `End` (`Command+Shift` on macOS) | With `sortable`: move the focused tab one place, or to the start or end of the strip. |
| `Tab`                                          | Moves focus from the tab strip into the selected tab's panel. In `mona-tab-strip`, moves on to the next control after the strip. |
| `Shift+Tab` (while the panel itself has focus) | Moves focus back to the selected tab.                                                         |

In a right-to-left layout, `ArrowLeft` and `ArrowRight` swap, so they still follow the strip.

These keys are left to the browser when `Alt`, `Ctrl` or `Meta` is held, so `Alt+ArrowLeft` still goes back, and when `Shift` is held on the arrows, except for the moves of a `sortable` strip.

The close button on each tab is not a Tab stop; keyboard users close a tab with `Delete`/`Backspace` instead of activating the close button directly. With a pointer, a middle-click on a tab that can close does the same as its close button.

A vetoed tab can have focus without being selected. `Tab` still goes to the selected tab's panel, and coming back lands on the selected tab.

### Focus

The selected tab is the only tab in the Tab order (`tabindex="0"`); all other tabs have `tabindex="-1"` (roving tabindex). The active panel has `tabindex="0"` and becomes a Tab stop while visible. Both show a solid outline when focused from the keyboard, drawn inside their edges because the strip and the content area clip anything outside them.

### ARIA

| Element  | Attribute          | When present                                                   | Value                                                                                    |
|----------|--------------------|----------------------------------------------------------------|------------------------------------------------------------------------------------------|
| Tab list | `role`             | Always                                                         | `"tablist"`                                                                              |
| Tab list | `aria-label`       | When the `aria-label` input is set                             | The input's value                                                                        |
| Tab list | `aria-labelledby`  | When the `aria-labelledby` input is set                        | The input's value                                                                        |
| Tab list | `aria-orientation` | Always                                                         | `"horizontal"` for top/bottom positions, `"vertical"` for left/right                     |
| Tab      | `role`             | Always                                                         | `"tab"`                                                                                  |
| Tab      | `id`               | Always                                                         | The tab's `tabId`, generated when it isn't set                                           |
| Tab      | `aria-selected`   | Always                                                         | Reflects whether the tab is the active tab                                               |
| Tab      | `aria-disabled`   | Always                                                         | Reflects the tab's effective disabled state (own `disabled`, or the parent's `disabled`) |
| Tab      | `aria-controls`   | Always in `mona-tabs`; in `mona-tab-strip`, when the tab has a `panelId` | The corresponding panel's element id: the tab's `panelId`, or the generated id of the panel `mona-tabs` renders |
| Tab      | `aria-keyshortcuts` | The tab can close, or the strip is `sortable`, and the tab isn't disabled | `"Delete Backspace"` when it can close, then the moves, such as `"Control+Shift+ArrowLeft Control+Shift+ArrowRight Control+Shift+Home Control+Shift+End"` |
| Panel    | `role`            | Always                                                         | `"tabpanel"`                                                                             |
| Panel    | `aria-hidden`     | Always                                                         | `"true"` on a kept panel that isn't the active one, otherwise `"false"`                  |
| Panel    | `aria-labelledby` | Always                                                         | The corresponding tab's element id                                                       |

The panel rows are for `mona-tabs`. With `mona-tab-strip`, the panel is yours: give it `role="tabpanel"` and an `aria-labelledby` naming the selected tab's `tabId`, as in [Tabs whose panels are elsewhere](#tabs-whose-panels-are-elsewhere).

Give the tab list a name with `aria-label` or `aria-labelledby` on `mona-tabs` when the page has more than one set of tabs, or when nothing nearby says what they're for. The inputs go to the tab list, not the host.

A tab list may only contain tabs, and a tab's content is presentational, so a close button can't be exposed in either place. Axe rejects one anywhere inside the tab list, even beside the tab. That's why the visible close button, which is there for the pointer, is hidden from assistive technology with `aria-hidden` and `tabindex="-1"`. Each closable tab also gets a visually hidden button after the tab list, named "Close tab" plus the tab's title, which screen readers can reach and activate, including on touch devices. It's out of the Tab order too, since the keyboard's route is `Delete` or `Backspace`. Its text comes from `closeTab` in the `tabs` messages.

<!-- verification-checklist
- [x] TabsComponent inputs/outputs/defaults verified against tabs.component.ts source and cross-checked against component-metadata.json's TabsComponent entry (class, closable, disabled, keepTabContent, position, size, tabClose, tabSelect); rounded input confirmed removed from source and metadata
- [x] position input type "top" | "bottom" | "left" | "right" and default "top" verified against tabs.component.ts
- [x] TabComponent inputs/defaults verified against tab.component.ts source and cross-checked against component-metadata.json's TabComponent entry (closable, disabled, selected, title); selected is a model, so selectedChange is its only output
- [x] Confirmed TabsComponent, TabComponent, TabCloseEvent, TabSelectEvent, TabContentTemplateDirective, TabTitleTemplateDirective are exported via lib/index.ts; confirmed TabListComponent, TabListItemDirective, TabItem, ScrollIntent are NOT exported and were excluded from public API docs
- [x] "A tab renders no content without monaTabContentTemplate" verified against tab.component.ts (template: "") and tabs.component.html ([ngTemplateOutlet]="tab.contentTemplate")
- [x] Template contexts for TabContentTemplateDirective/TabTitleTemplateDirective confirmed as none: [ngTemplateOutlet] bindings in tabs.component.html and tab-list.component.html pass no context object
- [x] Keyboard map verified against tab-list.component.ts's handleKeyboardEvents (ArrowLeft/ArrowRight/ArrowUp/ArrowDown via getNavigationDirection based on orientation, Home/End filtered to enabled tabs, Delete/Backspace guarded by disabled/closable) and tabs.component.ts's handlePanelKeyDown (Shift+Tab only when event.target === event.currentTarget)
- [x] Roving tabindex and panel tabindex verified against tab-list.component.html ([tabindex]="selected ? 0 : -1") and tabs.component.html (tabindex="0" on the panel)
- [x] ARIA table verified against tab-list.component.html (role="tablist" on the <ul>, [attr.aria-orientation]="orientation()", role="tab", aria-selected, aria-disabled, aria-controls) and tabs.component.html (role="tabpanel", aria-hidden, aria-labelledby, id); getTabOrientation maps top/bottom to horizontal and left/right to vertical
- [x] Close buttons verified against tab-list.component.html: the visible one is aria-hidden beside the tab, the hidden one sits outside the tablist with aria-labelledby; axe runs in tabs-behavior.spec.ts
- [x] "tabClose has nothing to prevent" verified: the component never removes a tab, and tab-list.component.ts doesn't read isDefaultPrevented() on the close event
- [x] Selection verified against tabs-behavior.spec.ts: selectedIndex and selected both ways, neighbor on removal, focus after removal
- [x] closable and disabled verified against tab-list.component.html's (tab.closable || closable()) and (tab.disabled || disabled())
- [x] Automatic scrolling (horizontal for top/bottom, vertical for left/right) and scroll button aria-hidden/tabindex=-1 verified against tab-list.component.ts's ResizeObserver-driven overflowControlsVisible signal, updateScrollVisibility (scrollWidth/scrollHeight), performScroll (scrollBy left/top), and tab-list.component.html's scroll button markup
- [x] Vertical layout constraints verified against tabs.styles.ts position recipes and the left/right overflow detection path (scrollHeight > clientHeight)
- [x] Form interaction "not applicable" verified: no ControlValueAccessor, NG_VALUE_ACCESSOR provider, formField input, or signal-forms control interface implemented by TabsComponent or TabComponent
- [x] No internal-only symbols (TabListComponent, TabListItemDirective, TabItem, ScrollIntent, Tailwind class names, data-tab-id/data-selected attributes) documented as public API
- [x] TabStripComponent inputs/outputs/defaults verified against tab-strip.component.ts (aria-label, aria-labelledby, closable, disabled, look, selectedIndex, size, sortable, tabClose, tabReorder, tabSelect, class); it has no position, keepTabContent or panels, and its template renders only mona-tab-list
- [x] tabId (default generated, `<id>-tab`) and panelId (default "") on TabComponent verified against tab.component.ts; tab-list.component.html renders `[id]="tab.tabId"` and aria-controls from panelIdOf, which is the named panelId in a strip (absent when empty) and ownPanelId in mona-tabs; tabs.component.html renders the panel with ownPanelId and aria-labelledby tab.tabId; covered by tests/tab-strip.spec.ts and tests/tabs-ids-and-look.spec.ts
- [x] Tab in a strip not intercepted: handleTabKey returns unless rendersPanels, which only mona-tabs sets; covered by "leaves Tab to the browser"
- [x] Middle-click verified against tab-list.component.ts's onTabAuxClick (button 1, isTabClosable, preventDefault, emitTabClose with the MouseEvent) and onTabMouseDown (preventDefault on button 1 for a closable tab); covered by the middle-click specs
- [x] look="pill" verified against tabs.styles.ts: list gap-1 p-1, no strip border, li rounded-md font-medium, selected pill [background-color:var(--mona-tab-pill-background,var(--color-surface-raised))] shadow-(--shadow-raised) with themeSelectionBorderClasses and forced-colors:after:border-[Highlight]; line look unchanged
-->
