## Overview

`CalendarComponent` renders a full calendar widget for selecting one date (`selection="single"`), a set of individual dates (`selection="multiple"`), or a date range (`selection="range"`). Navigation across months, years, and decades is available by pointer and keyboard.

Use the calendar as a standalone date selection control when a popup picker is not needed. For a compact text-input-based picker that embeds the calendar in a dropdown, use `DatePickerComponent` or `DateTimePickerComponent`.

## Import & Quick Start

```typescript
import { CalendarComponent } from "@nanahoshi/mona-ui";
```

Add `CalendarComponent` to your standalone component's `imports` array.

**Single-date binding:**

```html
<mona-calendar [(value)]="selectedDate"></mona-calendar>
```

```typescript
protected readonly selectedDate = signal<Date | null>(null);
```

## Anatomy & Public Structural Templates

Three template directives customize the rendered cell content in each calendar view.

### Month cell — `monaCalendarMonthCellTemplate`

Replaces the default day number in the month view:

```html
<mona-calendar [(value)]="date">
    <ng-template monaCalendarMonthCellTemplate let-day let-date="date">
        <span [class.font-bold]="isHoliday(date)">{{ day }}</span>
    </ng-template>
</mona-calendar>
```

**Template context:**

| Variable                   | Type     | Description                       |
|----------------------------|----------|-----------------------------------|
| `$implicit` (as `let-day`) | `number` | Day of the month (1–31).          |
| `date`                     | `Date`   | Full `Date` object for this cell. |

### Year cell — `monaCalendarYearCellTemplate`

Replaces the default month label in the year (month-selection) view:

```html
<mona-calendar [(value)]="date">
    <ng-template monaCalendarYearCellTemplate let-month let-text="text">
        <span class="italic">{{ text }}</span>
    </ng-template>
</mona-calendar>
```

**Template context:**

| Variable                     | Type     | Description                                      |
|------------------------------|----------|--------------------------------------------------|
| `$implicit` (as `let-month`) | `number` | Month number (1–12).                             |
| `text`                       | `string` | Abbreviated month name (e.g., `"Jan"`, `"Feb"`). |

### Decade cell — `monaCalendarDecadeCellTemplate`

Replaces the default year label in the decade view:

```html
<mona-calendar [(value)]="date">
    <ng-template monaCalendarDecadeCellTemplate let-year>
        <em>{{ year }}</em>
    </ng-template>
</mona-calendar>
```

**Template context:**

| Variable                    | Type     | Description                        |
|-----------------------------|----------|------------------------------------|
| `$implicit` (as `let-year`) | `number` | The year represented by this cell. |

## Feature Examples

### Multiple date selection

```html
<mona-calendar
    selection="multiple"
    [(value)]="selectedDates">
</mona-calendar>
```

```typescript
protected readonly selectedDates = signal<Date[]>([]);
```

Click to select the first date. Then:

- **Ctrl+click** (or **Cmd+click**) toggles an individual date in or out of the selection.
- **Shift+click** selects a contiguous block from the last selected date to the clicked date.

All selected dates are emitted as a flat `Date[]`.

### Range selection

```html
<mona-calendar
    selection="range"
    [(value)]="selectedRange">
</mona-calendar>
```

```typescript
protected readonly selectedRange = signal<Date[] | null>(null);
```

Click the start date, then click the end date. The emitted `value` is always `[startDate, endDate]` — a `Date[]` with exactly two elements. Clicking a new date while a range is pending resets the selection.

### Date constraints

```html
<mona-calendar
    [(value)]="date"
    [minDate]="minDate()"
    [maxDate]="maxDate()"
    [disabledDates]="disabledPredicate">
</mona-calendar>
```

```typescript
protected readonly minDate = signal(new Date(2025, 0, 1));
protected readonly maxDate = signal(new Date(2025, 11, 31));

// Predicate: disable Sundays
protected readonly disabledPredicate = (date: Date) => date.getDay() === 0;

// Or an array of specific dates:
// protected readonly disabledDates = [new Date(2025, 5, 15)];
```

### Week numbers

```html
<mona-calendar [(value)]="date" [weekNumber]="true"></mona-calendar>
```

Displays ISO week numbers in a left column of the month grid.

### Week starting day

```html
<mona-calendar [(value)]="date" firstDay="sunday"></mona-calendar>
```

`firstDay` defaults to `"monday"`. Set to `"sunday"` for locales where weeks start on Sunday.

### Signal forms integration

`CalendarComponent` implements `FormValueControl<Date | Date[] | null>` from `@angular/forms/signals`. Use the `[formField]` binding:

```typescript
import { form, FormField, disabled, readonly, required } from "@angular/forms/signals";

protected readonly form = form({ date: null as Date | null }, schema => {
    disabled(schema.date, { when: () => this.isDisabled() });
    readonly(schema.date, { when: () => this.isReadonly() });
    required(schema.date, { when: () => true });
});
```

```html
<mona-calendar [formField]="form.date"></mona-calendar>
```

> **Signal forms only.** `CalendarComponent` does **not** implement `ControlValueAccessor`. It cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`.

## Behavior Notes

**View navigation:** The calendar starts in the month view. Clicking the month/year header button cycles upward: month → year → decade. Clicking a cell in the year or decade view drills down.

**Range selection pending state:** After the first click in `selection="range"` mode, the calendar previews that date as the start. The range is committed only after the second click.

**Disabled dates and navigation:** When `minDate` or `maxDate` changes so that the currently focused date falls outside the allowed range, the calendar automatically moves focus to the nearest bound.

**Readonly state:** Navigation and view switching remain active while `readonly` is `true`. Date selection is prevented.

## Keyboard Interaction

All keyboard actions are active when the calendar host has focus.

### Month view

| Key                     | Action                               |
|-------------------------|--------------------------------------|
| `ArrowLeft`             | Move focus one day back              |
| `ArrowRight`            | Move focus one day forward           |
| `ArrowUp`               | Move focus one week back             |
| `ArrowDown`             | Move focus one week forward          |
| `Ctrl/Cmd + ArrowLeft`  | Navigate to previous month           |
| `Ctrl/Cmd + ArrowRight` | Navigate to next month               |
| `Ctrl/Cmd + ArrowUp`    | Switch to year view                  |
| `Home`                  | Move focus to first day of the month |
| `End`                   | Move focus to last day of the month  |
| `PageUp`                | Navigate to previous month           |
| `PageDown`              | Navigate to next month               |
| `Enter` / `Space`       | Select focused date                  |
| `T`                     | Navigate to today                    |

### Multiple selection additions (month view only)

| Key                       | Action                                                      |
|---------------------------|-------------------------------------------------------------|
| `Shift + ArrowLeft/Right` | Extend selection by one day                                 |
| `Shift + ArrowUp/Down`    | Extend selection by one week                                |
| `Ctrl/Cmd + Enter`        | Toggle focused date in the selection                        |
| `Shift + Enter`           | Select all dates from the last selected to the focused date |

### Year view (month selection)

| Key                        | Action                                |
|----------------------------|---------------------------------------|
| `ArrowLeft` / `ArrowRight` | Move focus one month                  |
| `ArrowUp` / `ArrowDown`    | Move focus three months (one row)     |
| `Ctrl/Cmd + ArrowLeft`     | Navigate to previous year             |
| `Ctrl/Cmd + ArrowRight`    | Navigate to next year                 |
| `Ctrl/Cmd + ArrowDown`     | Switch to month view                  |
| `Home`                     | Move focus to January                 |
| `End`                      | Move focus to December                |
| `PageUp`                   | Navigate to previous year             |
| `PageDown`                 | Navigate to next year                 |
| `Enter` / `Space`          | Select month and switch to month view |

### Decade view (year selection)

| Key                        | Action                              |
|----------------------------|-------------------------------------|
| `ArrowLeft` / `ArrowRight` | Move focus one year                 |
| `ArrowUp` / `ArrowDown`    | Move focus four years (one row)     |
| `Ctrl/Cmd + ArrowLeft`     | Navigate to previous decade         |
| `Ctrl/Cmd + ArrowRight`    | Navigate to next decade             |
| `Ctrl/Cmd + ArrowDown`     | Switch to year view                 |
| `Home`                     | Move focus to first year of decade  |
| `End`                      | Move focus to last year of decade   |
| `PageUp`                   | Navigate to previous decade         |
| `PageDown`                 | Navigate to next decade             |
| `Enter` / `Space`          | Select year and switch to year view |

## Accessibility Notes

The host element carries `role="application"` and a dynamic `aria-label` that describes the current view and position (e.g., `"Calendar, June 2025"`, `"Year view, 2025"`, `"Decade view, 2020–2029"`). An `aria-live="polite"` region announces view changes for screen readers.

| Attribute       | When present                                        | Value                                |
|-----------------|-----------------------------------------------------|--------------------------------------|
| `role`          | Always (host)                                       | `"application"`                      |
| `aria-label`    | Always (host)                                       | Current view description             |
| `aria-invalid`  | When `invalid` is `true`                            | `"true"`                             |
| `tabindex`      | Always (host)                                       | `0` when enabled, `-1` when disabled |
| `aria-selected` | On each day, month, and year cell when selected     | `"true"`                             |
| `aria-disabled` | On month-view day cells when the date is disabled   | `"true"`                             |
| `aria-current`  | On the current day (month view)                     | `"date"`                             |
| `aria-current`  | On the current month (year view)                    | `"date"`                             |
| `aria-label`    | On year cells, decade cells, and navigation buttons | Descriptive text                     |

**Known gaps — TODO(owner-review):**

- Month day cells (`[monaMonthDay]`) have no `role="gridcell"`.
- The month grid container has no `role="grid"` (year and decade grid containers also lack this).
- Weekday column headers render abbreviated names only (`Mon`, `Tue`, ...) with no `role="columnheader"` and no `aria-label` for the full day name.

**Consumer responsibilities:** No additional `aria-label` is required unless the calendar is embedded in a larger composite that must override the accessible name.

## Forms Integration

`CalendarComponent` implements `FormValueControl<Date | Date[] | null>` from `@angular/forms/signals`.

The `FormField` directive writes the following inputs automatically when a `[formField]` binding is active:

| Input      | Written by `FormField` |
|------------|------------------------|
| `disabled` | ✓                      |
| `invalid`  | ✓                      |
| `readonly` | ✓                      |
| `required` | ✓                      |
| `touched`  | ✓                      |

The `touch` output fires each time the user completes a date selection. `FormField` listens to this output to mark the field as touched.

> `CalendarComponent` does **not** implement `ControlValueAccessor`. Use `[formField]` for signal forms integration. For selection modes other than `"single"`, declare the form model field with the appropriate type (`Date[] | null`).

## API

### `CalendarComponent`

**Selector:** `mona-calendar`

Implements `FormValueControl<Date | Date[] | null>` from `@angular/forms/signals`.

#### Inputs

| Name            | Type                                                               | Default     | Description                                                                                                                                                                                                                                                                                |
|-----------------|--------------------------------------------------------------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `class`         | `string`                                                           | `''`        | Additional CSS classes merged onto the calendar host element.                                                                                                                                                                                                                              |
| `disabled`      | `boolean`                                                          | `false`     | Two-way bindable. Renders the calendar with reduced visual emphasis and prevents all date selection and navigation.                                                                                                                                                                        |
| `disabledDates` | `Iterable<Date> \| ((date: Date) => boolean) \| null \| undefined` | `undefined` | Dates to mark as non-selectable. Accepts an iterable of specific `Date` objects or a predicate called for each rendered date. Dates outside `minDate`–`maxDate` are also disabled regardless of this input.                                                                                |
| `firstDay`      | `'monday' \| 'sunday'`                                             | `'monday'`  | First day of the week in the month view column headers and grid layout.                                                                                                                                                                                                                    |
| `invalid`       | `boolean`                                                          | `false`     | Marks the calendar as invalid, activating an error-color border. Written automatically by the signal forms `FormField` directive.                                                                                                                                                          |
| `maxDate`       | `Date \| null`                                                     | `undefined` | Latest selectable date (inclusive). Dates after this value are disabled.                                                                                                                                                                                                                   |
| `minDate`       | `Date \| null`                                                     | `undefined` | Earliest selectable date (inclusive). Dates before this value are disabled.                                                                                                                                                                                                                |
| `readonly`      | `boolean`                                                          | `false`     | Prevents date selection while keeping navigation active. Written automatically by the signal forms `FormField` directive.                                                                                                                                                                  |
| `required`      | `boolean`                                                          | `false`     | Marks the field as required. When used with signal forms and `touched` is `true`, an empty selection is treated as invalid. Written automatically by the signal forms `FormField` directive.                                                                                               |
| `rounded`       | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`               | `'medium'`  | Border-radius preset applied to the calendar container.                                                                                                                                                                                                                                    |
| `selection`     | `'single' \| 'multiple' \| 'range'`                                | `'single'`  | Date selection mode. `'single'` emits a `Date \| null`. `'multiple'` emits a `Date[]`. `'range'` emits a two-element `Date[]` as `[startDate, endDate]`.                                                                                                                                   |
| `touched`       | `boolean`                                                          | `false`     | Marks the field as having been interacted with. Used together with `required` and `invalid` to determine validation display. Written automatically by the signal forms `FormField` directive.                                                                                              |
| `value`         | `Date \| Date[] \| null`                                           | `null`      | Two-way bindable current selection. The expected shape depends on `selection`: a `Date \| null` for `'single'`, a `Date[]` for `'multiple'`, and `[startDate, endDate]` for `'range'`. Implements `FormValueControl<Date \| Date[] \| null>`, enabling signal forms `[formField]` binding. |
| `weekNumber`    | `boolean`                                                          | `false`     | Shows ISO week numbers in a left column of the month grid.                                                                                                                                                                                                                                 |

#### Outputs

| Name    | Type   | Description                                                                                                                             |
|---------|--------|-----------------------------------------------------------------------------------------------------------------------------------------|
| `touch` | `void` | Emitted each time the user completes a date selection. Consumed by the signal forms `FormField` directive to mark the field as touched. |

---

### `CalendarMonthCellTemplateDirective`

**Selector:** `ng-template[monaCalendarMonthCellTemplate]`

Provides a custom template for each day cell in the month view.

**Template context:**

| Variable                   | Type     | Description                       |
|----------------------------|----------|-----------------------------------|
| `$implicit` (as `let-day`) | `number` | Day of the month (1–31).          |
| `date`                     | `Date`   | Full `Date` object for this cell. |

---

### `CalendarYearCellTemplateDirective`

**Selector:** `ng-template[monaCalendarYearCellTemplate]`

Provides a custom template for each month cell in the year (month-selection) view.

**Template context:**

| Variable                     | Type     | Description                                      |
|------------------------------|----------|--------------------------------------------------|
| `$implicit` (as `let-month`) | `number` | Month number (1–12).                             |
| `text`                       | `string` | Abbreviated month name (e.g., `"Jan"`, `"Feb"`). |

---

### `CalendarDecadeCellTemplateDirective`

**Selector:** `ng-template[monaCalendarDecadeCellTemplate]`

Provides a custom template for each year cell in the decade view.

**Template context:**

| Variable                    | Type     | Description                        |
|-----------------------------|----------|------------------------------------|
| `$implicit` (as `let-year`) | `number` | The year represented by this cell. |

---

TODO(owner-review): `CalendarSelection`, `FirstDayOfWeek`, `DateDisabledType`, and the three template context interfaces (`MonthCellTemplateContext`, `YearCellTemplateContext`, `DecadeCellTemplateContext`) are used in public input signatures but are not exported from `@nanahoshi/mona-ui`. Consumers cannot import them for type annotations without reaching into internal paths.

<!-- verification-checklist
- [x] API definitions and defaults verified against source
- [x] Template context variables verified against calendar.component.html ngTemplateOutletContext bindings
- [x] YearCellTemplateContext.$implicit: documented as month number (1–12) matching actual template binding, not the incorrect JSDoc "year of a decade"
- [x] Signal forms verified: implements FormValueControl, no ControlValueAccessor
- [x] Value shape per selection mode verified against #outputValue computed
- [x] Range selection two-click flow verified against #rangeChange$ pipe
- [x] Multiple selection keyboard verified against handleMultipleSelectionKeyboard
- [x] Full keyboard map verified against handleKeydown switch statement
- [x] ARIA attributes verified against host bindings and directive host bindings
- [x] Known ARIA gaps documented with TODO(owner-review)
- [x] Inputs table sorted A-Z
- [x] Outputs table present
- [x] No private members, internal signals, Tailwind class names, or implementation details exposed
- [x] Unexported public types marked with TODO(owner-review)
- [ ] Build not run (no build environment in this pass)
-->
