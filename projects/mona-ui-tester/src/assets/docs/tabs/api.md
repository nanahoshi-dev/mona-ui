## Overview & Component Selection

Tabs organizes related content into named panels and shows one panel at a time. Each panel is declared as a `<mona-tab>` projected inside `<mona-tabs>`; `TabsComponent` renders the clickable tab strip and swaps the visible panel when the consumer selects a different tab.

**Use Tabs when:**

- Content naturally divides into a small, fixed set of named sections that share the same context (for example, "Login" and "Register" panels in the same card).
- Only one section needs to be visible at a time, and switching between them should not navigate to a different route.

Tabs is not a routing mechanism. Switching tabs does not change the URL, and there is no built-in way to deep-link to a specific tab.

## Import & Quick Start

```typescript
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui";
```

```html
<mona-tabs>
    <mona-tab title="Profile" [selected]="true">
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
        <fa-icon [icon]="['fas', 'gear']"></fa-icon>
        <span>Settings</span>
    </ng-template>
    <ng-template monaTabContentTemplate>
        <p>Settings content.</p>
    </ng-template>
</mona-tab>
```

## Feature Examples

### Closable tabs

`closable` on `mona-tabs` shows a close button on every tab. A tab's own `closable` input, when `true`, shows a close button for that tab even if the parent's `closable` is `false` — see [`closable` precedence](#closable-precedence).

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

Closing a tab is entirely the consumer's responsibility — see [Tabs are removed by the consumer, not by `TabsComponent`](#tabs-are-removed-by-the-consumer-not-by-tabscomponent).

### Disabled tabs

`disabled` on `mona-tabs` disables every tab. `disabled` on an individual `mona-tab` disables only that tab, even if the parent's `disabled` is `false`. A disabled tab cannot be selected or closed by pointer or keyboard.

```html
<mona-tabs>
    <mona-tab title="Available" [selected]="true">
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

### Sizing and border radius

`size` controls the tab strip's height; `rounded` controls the border radius applied to both the tab strip and the content area.

```html
<mona-tabs size="small" rounded="full">
    <mona-tab title="A"><ng-template monaTabContentTemplate>A</ng-template></mona-tab>
    <mona-tab title="B"><ng-template monaTabContentTemplate>B</ng-template></mona-tab>
</mona-tabs>
```

### Reacting to and canceling tab selection

`tabSelect` emits before the newly clicked or keyboard-activated tab becomes active. Calling `preventDefault()` on the emitted `TabSelectEvent` keeps the current tab selected.

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

### Tabs are removed by the consumer, not by `TabsComponent`

`TabsComponent` does not remove a `<mona-tab>` from the DOM when it is closed. `tabClose` only notifies the consumer that a close was requested (by clicking the close button or pressing Delete/Backspace on the selected tab); the consumer is responsible for removing the corresponding tab from whatever collection drives the projected `<mona-tab>` elements (typically an `@for` loop).

### `tabClose` is not currently preventable

`TabCloseEvent` extends `PreventableEvent` and exposes `preventDefault()`/`isDefaultPrevented()`, but no code path in `TabsComponent` or the internal tab list reads `isDefaultPrevented()` for close events. Calling `preventDefault()` in a `tabClose` handler has no effect on the component's own behavior. `TODO(owner-review): confirm whether tabClose is intended to be preventable, and either wire it up or update TabCloseEvent's documented contract.`

### `selected` does not currently drive the active tab

Each `mona-tab` accepts a two-way `selected` model. `TabsComponent` selects the first tab by default and does not read `selected` when determining which tab starts active or when reacting to later changes. There is currently no public API to set the active tab programmatically from outside the component; the active tab changes only through the widget's own click and keyboard handling. `TODO(owner-review): confirm the intended purpose of selected, or expose a supported way to set the active tab programmatically.`

### `closable` precedence

A tab's own `closable` input always wins when it disagrees with the parent `mona-tabs`'s `closable`: setting a tab's `closable` to `true` shows its close button even if the parent's `closable` is `false`. There is no equivalent per-tab override to hide the close button on one tab when the parent's `closable` is `true`.

### Horizontal scrolling is automatic and pointer-only

When the tab strip is wider than its container, left/right scroll buttons appear automatically — this is not controlled by a public input. The scroll buttons are hidden from assistive technology and are not a Tab stop. Keyboard users can still reach tabs outside the visible area because moving focus with the arrow keys scrolls the newly focused tab into view.

## Accessibility & Forms Integration

### Keyboard

| Key                                            | Action                                                                                        |
|------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `ArrowLeft` / `ArrowRight`                     | Select the previous/next enabled tab, wrapping around at the ends. Disabled tabs are skipped. |
| `Home` / `End`                                 | Select the first/last enabled tab.                                                            |
| `Delete` / `Backspace`                         | Close the selected tab, if it is closable and not disabled.                                   |
| `Tab`                                          | Moves focus from the selected tab into its panel.                                             |
| `Shift+Tab` (while the panel itself has focus) | Moves focus back to the selected tab.                                                         |

The close button on each tab is not a Tab stop; keyboard users close the active tab with `Delete`/`Backspace` instead of activating the close button directly.

### Focus

The selected tab is the only tab in the Tab order (`tabindex="0"`); all other tabs have `tabindex="-1"` (roving tabindex). The active panel has `tabindex="0"` and becomes a Tab stop while visible.

### ARIA

| Element  | Attribute         | When present                                                   | Value                                                                                    |
|----------|-------------------|----------------------------------------------------------------|------------------------------------------------------------------------------------------|
| Tab list | `role`            | Always                                                         | `"tablist"`                                                                              |
| Tab      | `role`            | Always                                                         | `"tab"`                                                                                  |
| Tab      | `aria-selected`   | Always                                                         | Reflects whether the tab is the active tab                                               |
| Tab      | `aria-disabled`   | Always                                                         | Reflects the tab's effective disabled state (own `disabled`, or the parent's `disabled`) |
| Tab      | `aria-controls`   | Always                                                         | The corresponding panel's element id                                                     |
| Panel    | `role`            | Always                                                         | `"tabpanel"`                                                                             |
| Panel    | `aria-hidden`     | `keepTabContent` is `true` and the panel is not the active one | `"true"`                                                                                 |
| Panel    | `aria-labelledby` | Always                                                         | The corresponding tab's element id                                                       |

The close button on each tab is icon-only and does not currently expose an accessible name via `aria-label` or visually hidden text. `TabsComponent` does not expose an `aria-label`/`aria-labelledby` input for labeling the tab list itself. `TODO(owner-review): confirm whether the close button needs an accessible name, and whether the tab list should expose a label input.`

### Form Interaction

Not applicable. `TabsComponent` and `TabComponent` are not form controls and do not implement `ControlValueAccessor` or the signal forms control interfaces.

## API

### `TabsComponent`

**Selector:** `mona-tabs`

#### Inputs

| Name             | Type                                                 | Default    | Description                                                                                                                                                                     |
|------------------|------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `class`          | `string`                                             | `""`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                       |
| `closable`       | `boolean`                                            | `false`    | Displays a close button on each tab, unless overridden per tab — see [`closable` precedence](#closable-precedence).                                                             |
| `disabled`       | `boolean`                                            | `false`    | Renders every tab with reduced visual emphasis and removes pointer and keyboard interaction.                                                                                    |
| `keepTabContent` | `boolean`                                            | `true`     | Keeps a tab's content in the DOM after it is deselected instead of removing it — see [Preserving tab content when switching tabs](#preserving-tab-content-when-switching-tabs). |
| `rounded`        | `"none" \| "small" \| "medium" \| "large" \| "full"` | `"medium"` | Border-radius preset applied to the tabs and the tab content area.                                                                                                              |
| `size`           | `"small" \| "medium" \| "large"`                     | `"medium"` | Size preset controlling the tabs' dimensions.                                                                                                                                   |

#### Outputs

| Name        | Type             | Description                                                                                                                                                                                                                                           |
|-------------|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `tabClose`  | `TabCloseEvent`  | Emitted when a tab close is requested — see [Tabs are removed by the consumer, not by `TabsComponent`](#tabs-are-removed-by-the-consumer-not-by-tabscomponent) and [`tabClose` is not currently preventable](#tabclose-is-not-currently-preventable). |
| `tabSelect` | `TabSelectEvent` | Emitted before a tab becomes active. Cancelable — see [Reacting to and canceling tab selection](#reacting-to-and-canceling-tab-selection).                                                                                                            |

---

### `TabComponent`

**Selector:** `mona-tab`

#### Inputs

| Name       | Type      | Default | Description                                                                                                                                                  |
|------------|-----------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `closable` | `boolean` | `false` | Displays a close button on this tab. Overrides the parent `mona-tabs` component's `closable` input.                                                          |
| `disabled` | `boolean` | `false` | Renders this tab with reduced visual emphasis and removes pointer and keyboard interaction. Overrides the parent `mona-tabs` component's `disabled` input.   |
| `selected` | `boolean` | `false` | Two-way bindable. Whether the tab is selected — see [`selected` does not currently drive the active tab](#selected-does-not-currently-drive-the-active-tab). |
| `title`    | `string`  | `""`    | Title text displayed on the tab. Ignored when a `monaTabTitleTemplate` is provided.                                                                          |

No outputs.

---

### `TabContentTemplateDirective`

**Selector:** `ng-template[monaTabContentTemplate]`

No inputs. No outputs.

---

### `TabTitleTemplateDirective`

**Selector:** `ng-template[monaTabTitleTemplate]`

No inputs. No outputs.

---

### Exported Types

#### `TabCloseEvent`

Extends `PreventableEvent`.

| Field      | Type      | Description                                                     |
|------------|-----------|-----------------------------------------------------------------|
| `index`    | `number`  | Index of the tab a close was requested for.                     |
| `selected` | `boolean` | Whether the tab a close was requested for was the selected tab. |

#### `TabSelectEvent`

Extends `PreventableEvent`.

| Field   | Type     | Description                      |
|---------|----------|----------------------------------|
| `index` | `number` | Index of the tab being selected. |

`PreventableEvent` is also exported from `@nanahoshi/mona-ui` and is the base class for `TabCloseEvent` and `TabSelectEvent`, providing `preventDefault()`, `isDefaultPrevented()`, `originalEvent`, and `type`.

---

<!-- verification-checklist
- [x] TabsComponent inputs/outputs/defaults verified against tabs.component.ts source and cross-checked against component-metadata.json's TabsComponent entry (class, closable, disabled, keepTabContent, rounded, size, tabClose, tabSelect)
- [x] TabComponent inputs/defaults verified against tab.component.ts source and cross-checked against component-metadata.json's TabComponent entry (closable, disabled, selected, title); confirmed no outputs
- [x] Confirmed TabsComponent, TabComponent, TabCloseEvent, TabSelectEvent, TabContentTemplateDirective, TabTitleTemplateDirective are exported via lib/index.ts; confirmed TabListComponent, TabListItemDirective, TabItem, ScrollIntent are NOT exported and were excluded from public API docs
- [x] "A tab renders no content without monaTabContentTemplate" verified against tab.component.ts (template: "") and tabs.component.html ([ngTemplateOutlet]="tab.contentTemplate")
- [x] Template contexts for TabContentTemplateDirective/TabTitleTemplateDirective confirmed as none: [ngTemplateOutlet] bindings in tabs.component.html and tab-list.component.html pass no context object
- [x] Keyboard map verified against tab-list.component.ts's handleKeyboardEvents (ArrowLeft/ArrowRight/Home/End filtered to enabled tabs, Delete/Backspace guarded by disabled/closable) and tabs.component.ts's handlePanelKeyDown (Shift+Tab only when event.target === event.currentTarget)
- [x] Roving tabindex and panel tabindex verified against tab-list.component.html ([tabindex]="selected ? 0 : -1") and tabs.component.html (tabindex="0" on the panel)
- [x] ARIA table verified against tab-list.component.html (role="tablist" on the <ul>, role="tab", aria-selected, aria-disabled, aria-controls) and tabs.component.html (role="tabpanel", aria-hidden, aria-labelledby, id)
- [x] Close button icon-only/no accessible name verified: no aria-label or visually hidden text in the close <button> in tab-list.component.html; flagged as owner-review rather than asserted as intentional
- [x] "tabClose is not preventable" verified: emitTabClose's return value (tabCloseEvent.isDefaultPrevented()) is discarded by both call sites (onTabClose, and the Delete/Backspace branch of handleKeyboardEvents) in tab-list.component.ts
- [x] "selected does not drive the active tab" verified: grepped all reads of `.selected` in projects/mona-ui/src/lib/layout/tabs — the only read is inside tab.component.ts's own #tabItem computed; selectedTabId's linkedSignal computation in tabs.component.ts does not reference tab.selected
- [x] "closable precedence" verified against tab-list.component.html's close button *ngIf-equivalent condition (tab.closable || closable()) and the Delete/Backspace guard in tab-list.component.ts
- [x] Automatic horizontal scrolling and scroll button aria-hidden/tabindex=-1 verified against tab-list.component.ts's ResizeObserver-driven scrollsVisible signal and tab-list.component.html's scroll button markup
- [x] Form interaction "not applicable" verified: no ControlValueAccessor, NG_VALUE_ACCESSOR provider, formField input, or signal-forms control interface implemented by TabsComponent or TabComponent
- [x] No internal-only symbols (TabListComponent, TabListItemDirective, TabItem, ScrollIntent, Tailwind class names, data-tab-id/data-selected attributes) documented as public API
-->
