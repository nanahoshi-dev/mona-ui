## Overview & Component Selection

Tabs organizes related content into named panels and shows one panel at a time. Each panel is declared as a `<mona-tab>` projected inside `<mona-tabs>`; `TabsComponent` renders the clickable tab strip and swaps the visible panel when the consumer selects a different tab.

**Use Tabs when:**

- Content naturally divides into a small, fixed set of named sections that share the same context (for example, "Login" and "Register" panels in the same card).
- Only one section needs to be visible at a time, and switching between them should not navigate to a different route.

Tabs is not a routing mechanism. Switching tabs does not change the URL. To deep-link to a tab, read the route yourself and bind `selectedIndex`, or `selected` on the tab.

## Import & Quick Start

```typescript
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";
```

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

## Anatomy & Public Structural Templates

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

## Feature Examples

### Setting the selected tab

`selectedIndex` is the zero-based index of the selected tab, and works two-way. Writing it selects that tab. A disabled or out-of-range index is refused, and the value goes back to the selected tab's index. If the tabs haven't arrived yet, the index waits for them.

```html
<mona-tabs [(selectedIndex)]="activeTab">
    <mona-tab title="Account"><ng-template monaTabContentTemplate>...</ng-template></mona-tab>
    <mona-tab title="Security"><ng-template monaTabContentTemplate>...</ng-template></mona-tab>
</mona-tabs>
<button monaButton (click)="activeTab.set(1)">Review security</button>
```

`selected` on a `mona-tab` does the same from the tab's side, which suits tabs added conditionally, where the index isn't known. The two stay in sync: `[(selected)]` follows the selection, and `selectedIndex` follows `selected`. Setting `selected` to `true` selects the tab unless it's disabled. A newly flagged tab takes the selection from the tab that has it, and if several are flagged at once, the first wins. Setting `selected` to `false` is refused, because the group always keeps one tab selected, and the value goes back to `true`. Use one or the other: when both are set at the start, `selected` wins.

With nothing set, the first enabled tab is selected. When every `mona-tab` is disabled, none is. `disabled` on `mona-tabs` doesn't count here: it stops the user changing the selection, and code can still change it.

`selectedIndexChange` fires for every change, including the ones the component makes itself. `tabSelect` fires only for a click or key, before it selects a tab. It doesn't fire for a value written to `selectedIndex` or `selected`, or when the selected tab is removed, so it can't veto those.

### Closable tabs

`closable` on `mona-tabs` shows a close button on every tab. A tab's own `closable` input, when `true`, shows a close button for that tab even if the parent's `closable` is `false` — see [`closable` and `disabled` on a tab and its parent](#closable-and-disabled-on-a-tab-and-its-parent).

```html
<mona-tabs closable (tabClose)="onTabClose($event)">
    <mona-tab title="Report 1">
        <ng-template monaTabContentTemplate>Report 1 content.</ng-template>
    </mona-tab>
    <mona-tab title="Report 2">
        <ng-template monaTabContentTemplate>Report 2 content.</ng-template>
    </mona-tab>
</mona-tabs>
```

```typescript
protected onTabClose(event: TabCloseEvent): void {
    // Remove the corresponding tab from the data driving the @for loop.
}
```

Closing a tab is entirely the consumer's responsibility — see [Tabs are removed by the consumer](#tabs-are-removed-by-the-consumer).

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

`position` places the tab strip on one of the four edges of the tab content. Top and bottom strips lay out horizontally; left and right strips lay out vertically.

```html
<mona-tabs position="top">
    <mona-tab title="A"><ng-template monaTabContentTemplate>A</ng-template></mona-tab>
    <mona-tab title="B"><ng-template monaTabContentTemplate>B</ng-template></mona-tab>
</mona-tabs>
```

```html
<mona-tabs position="left" class="h-96">
    <mona-tab title="A"><ng-template monaTabContentTemplate>A</ng-template></mona-tab>
    <mona-tab title="B"><ng-template monaTabContentTemplate>B</ng-template></mona-tab>
</mona-tabs>
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

### Migrating from the removed `rounded` input

The `rounded` input has been removed. Tabs are line-based: the tab strip is separated from the content by a rule and the active tab is marked by an indicator line, so no radius is applied to the strip or the content.

```text
Before:
<mona-tabs rounded="large">

After:
<mona-tabs>
```

Tab content no longer receives a default card-like surface. Consumers that need that appearance should wrap their tab content in `mona-card` or apply their own surface styles.

For compact value selection that does not switch panels — `List | Grid`, `Day | Week | Month`, `Discover | My courses` — use `SegmentedComponent` instead.

### Reacting to and canceling tab selection

`tabSelect` emits before the newly clicked or keyboard-activated tab becomes active. Calling `preventDefault()` on the emitted `TabSelectEvent` keeps the current tab selected. Arrow keys still move focus to a tab you veto, so the keyboard can reach the tabs after it.

```html
<mona-tabs (tabSelect)="onTabSelect($event)">
    <mona-tab title="Free"><ng-template monaTabContentTemplate>Free content.</ng-template></mona-tab>
    <mona-tab title="Pro"><ng-template monaTabContentTemplate>Pro content.</ng-template></mona-tab>
</mona-tabs>
```

```typescript
protected onTabSelect(event: TabSelectEvent): void {
    if (event.index === 1 && !this.hasProAccess()) {
        event.preventDefault();
    }
}
```

## Technical & Behavior Notes

### Tabs are removed by the consumer

`TabsComponent` does not remove a `<mona-tab>` from the DOM when it is closed. `tabClose` only notifies the consumer that a close was requested (by clicking the close button or pressing Delete/Backspace on a tab); the consumer is responsible for removing the corresponding tab from whatever collection drives the projected `<mona-tab>` elements (typically an `@for` loop).

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

### Vertical layout constraints

A left or right tab strip needs a constrained available height. If the strip is as tall as its content, the tabs have no room to scroll and overflow tabs become unreachable. Give the `mona-tabs` host a bounded height (for example `class="h-96"`) when using `position="left"` or `position="right"`.

- `"top" | "bottom" | "left" | "right"`. The values of the `position` input.

## Accessibility & Forms Integration

### Keyboard

| Key                                            | Action                                                                                        |
|------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `ArrowLeft` / `ArrowRight` (top/bottom)        | Select the previous/next enabled tab, wrapping around at the ends. Disabled tabs are skipped. |
| `ArrowUp` / `ArrowDown` (left/right)           | Select the previous/next enabled tab, wrapping around at the ends. Disabled tabs are skipped. |
| `Home` / `End`                                 | Select the first/last enabled tab.                                                            |
| `Delete` / `Backspace`                         | Close the tab that has focus, if it is closable and not disabled.                             |
| `Tab`                                          | Moves focus from the tab strip into the selected tab's panel.                                 |
| `Shift+Tab` (while the panel itself has focus) | Moves focus back to the selected tab.                                                         |

In a right-to-left layout, `ArrowLeft` and `ArrowRight` swap, so they still follow the strip.

These keys are left to the browser when `Alt`, `Ctrl` or `Meta` is held, so `Alt+ArrowLeft` still goes back, and when `Shift` is held on the arrows.

The close button on each tab is not a Tab stop; keyboard users close a tab with `Delete`/`Backspace` instead of activating the close button directly.

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
| Tab      | `aria-selected`   | Always                                                         | Reflects whether the tab is the active tab                                               |
| Tab      | `aria-disabled`   | Always                                                         | Reflects the tab's effective disabled state (own `disabled`, or the parent's `disabled`) |
| Tab      | `aria-controls`   | Always                                                         | The corresponding panel's element id                                                     |
| Tab      | `aria-keyshortcuts` | The tab can close and isn't disabled                         | `"Delete Backspace"`                                                                     |
| Panel    | `role`            | Always                                                         | `"tabpanel"`                                                                             |
| Panel    | `aria-hidden`     | Always                                                         | `"true"` on a kept panel that isn't the active one, otherwise `"false"`                  |
| Panel    | `aria-labelledby` | Always                                                         | The corresponding tab's element id                                                       |

Give the tab list a name with `aria-label` or `aria-labelledby` on `mona-tabs` when the page has more than one set of tabs, or when nothing nearby says what they're for. The inputs go to the tab list, not the host.

A tab list may only contain tabs, and a tab's content is presentational, so a close button can't be exposed in either place. Axe rejects one anywhere inside the tab list, even beside the tab. That's why the visible close button, which is there for the pointer, is hidden from assistive technology with `aria-hidden` and `tabindex="-1"`. Each closable tab also gets a visually hidden button after the tab list, named "Close tab" plus the tab's title, which screen readers can reach and activate, including on touch devices. It's out of the Tab order too, since the keyboard's route is `Delete` or `Backspace`. Its text comes from `closeTab` in the `tabs` messages.

### Form Interaction

Not applicable. `TabsComponent` and `TabComponent` are not form controls and do not implement `ControlValueAccessor` or the signal forms control interfaces.

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
-->
