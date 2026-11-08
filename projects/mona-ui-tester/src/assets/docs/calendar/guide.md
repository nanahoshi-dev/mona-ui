## Overview

`CalendarComponent` renders a full calendar widget for selecting one date (`selection="single"`), a set of individual dates (`selection="multiple"`), or a date range (`selection="range"`). Navigation across months, years, and decades is available by pointer and keyboard.

Use the calendar as a standalone date selection control when a popup picker is not needed. For a compact text-input-based picker that embeds the calendar in a dropdown, use `DatePickerComponent` or `DateTimePickerComponent`.

## Import & Quick Start

```typescript
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";
```

Add `CalendarComponent` to your standalone component's `imports` array.

**Single-date binding:**

```html
<mona-calendar [(value)]="selectedDate"></mona-calendar>
```

```typescript
protected readonly selectedDate = signal<Date | null>(null);
```

## Anatomy

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

## Examples

### Multiple date selection

```example
calendar/multiple
```

Click to select the first date. Then:

- **Ctrl+click** (or **Cmd+click**) toggles an individual date in or out of the selection.
- **Shift+click** selects a contiguous block from the last selected date to the clicked date.

All selected dates are emitted as a flat `Date[]`.

### Range selection

Click the start date, then click the end date. The emitted `value` is always `[startDate, endDate]` — a `Date[]` with exactly two elements. Clicking a new date while a range is pending resets the selection.

```example
calendar/range
```

### Date constraints

`minDate` and `maxDate` bound the dates that can be chosen. `disabledDates` takes a predicate, as here to skip weekends, or an array of specific dates.

```example
calendar/constraints
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

Without `firstDay`, the week starts on the day the active locale uses, such as Sunday for `en-US` and Monday for `de-DE`. Set it to override the locale.

### Signal forms integration

`CalendarComponent` implements `FormValueControl<Date | Date[] | null>` from `@angular/forms/signals`. Use the `[formField]` binding:

```example
calendar/forms
```

It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor.

## Behavior

**View navigation:** The calendar starts in the month view. Clicking the month/year header button cycles upward: month → year → decade. Clicking a cell in the year or decade view drills down.

**Range selection pending state:** After the first click in `selection="range"` mode, the calendar previews that date as the start. The range is committed only after the second click.

**Disabled dates and navigation:** When `minDate` or `maxDate` changes so that the currently focused date falls outside the allowed range, the calendar automatically moves focus to the nearest bound.

**Readonly state:** Navigation and view switching remain active while `readonly` is `true`. Date selection is prevented.

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

> For selection modes other than `"single"`, declare the form model field with the matching type (`Date[] | null`).

## Accessibility

Each view renders a `role="grid"` with rows of `role="gridcell"` cells, labelled by the heading above it. Day cells are named by their full date, and the month grid's column headers carry the full weekday name for screen readers. A polite live region announces the current view and position when it changes, such as "Calendar, June 2025" or "Year view, 2025".

| Attribute       | Where                                          | Value                                    |
|-----------------|------------------------------------------------|------------------------------------------|
| `role`          | Each view's container                          | `"grid"`                                 |
| `role`          | Each day, month, and year cell                 | `"gridcell"`                             |
| `role`          | Each weekday header (month view)               | `"columnheader"`                         |
| `aria-label`    | Each cell, and the navigation buttons          | Descriptive text                         |
| `aria-selected` | A selected cell                                | `"true"`                                 |
| `aria-current`  | Today, or the current month or year            | `"date"`                                 |
| `aria-disabled` | A disabled day, or the grid when disabled      | `"true"`                                 |
| `aria-invalid`  | The month grid, when invalid                   | `"true"`                                 |
| `aria-readonly` | The month grid, when `readonly`                | `"true"`                                 |
| `tabindex`      | Each cell                                      | `0` on the focused cell, `-1` on the rest |

A grid may not carry `aria-required`, so `required` shows only as `data-required` on the host and through the invalid state.

**Consumer responsibilities:** None. The grids are named by the calendar's own heading.

### Keyboard Interaction

All keyboard actions apply to the focused cell of the grid. The grid is one Tab stop, and arrow keys move focus between its cells.

#### Month view

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

#### Multiple selection additions (month view only)

| Key                       | Action                                                      |
|---------------------------|-------------------------------------------------------------|
| `Shift + ArrowLeft/Right` | Extend selection by one day                                 |
| `Shift + ArrowUp/Down`    | Extend selection by one week                                |
| `Ctrl/Cmd + Enter`        | Toggle focused date in the selection                        |
| `Shift + Enter`           | Select all dates from the last selected to the focused date |

#### Year view (month selection)

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

#### Decade view (year selection)

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

<!-- verification-checklist
- [x] API definitions and defaults verified against source
- [x] Template context variables verified against calendar.component.html ngTemplateOutletContext bindings
- [x] YearCellTemplateContext.$implicit: documented as month number (1–12) matching actual template binding, not the incorrect JSDoc "year of a decade"
- [x] Forms verified: implements FormValueControl; ngModel and formControl work without an accessor (tests/forms-interop.spec.ts)
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
