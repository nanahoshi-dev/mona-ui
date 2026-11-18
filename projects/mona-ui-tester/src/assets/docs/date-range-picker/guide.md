## Overview

Use `DateRangePickerComponent` for a span of days in a form, such as a stay, a leave request or a report's period. Users type the first and the last day, pick both from a calendar that shows two months side by side, or pick a quick range such as "Last 7 days".

Use `DatePickerComponent` for a single date. Use `CalendarComponent` with `selection="range"` when the calendar should stay visible on the page.

## Import & Quick Start

```typescript
import { type DateRange, DateRangePickerComponent } from "@nanahoshi/mona-ui/date-range-picker";
```

```html
<mona-form-field label="Stay">
    <mona-date-range-picker [(value)]="stay"></mona-date-range-picker>
</mona-form-field>
```

```typescript
protected readonly stay = signal<DateRange | null>(null);
```

The value is a `DateRange`, `{ start: Date | null; end: Date | null }`, or `null` when both ends are empty.

## Anatomy

The picker is one control with two inputs, a dash between them, and a calendar button at its end. The button opens a popup that holds a `mona-calendar` in range selection, and the quick ranges given to `presets` beside it.

| Template | Imported from | Fills |
|---|---|---|
| `ng-template[monaCalendarMonthCellTemplate]` | `@nanahoshi/mona-ui/calendar` | Each day cell of the popup calendar |
| `ng-template[monaCalendarYearCellTemplate]` | `@nanahoshi/mona-ui/calendar` | Each month cell of the year view |
| `ng-template[monaCalendarDecadeCellTemplate]` | `@nanahoshi/mona-ui/calendar` | Each year cell of the decade view |

The cell templates receive the same context as on the [Calendar](../calendar) page.

## Examples

### A range in a form field

The form field names the picker and describes both inputs with its hint. Pick the first day in the calendar, then the last: the range is written once both are picked, and the popup closes.

```example
date-range-picker/basic
```

### Validation from a signal form

`required` checks for an empty range. A range with only one end isn't empty, so check both ends with `validate` when the form needs them. The form field shows the messages.

```example
date-range-picker/signal-forms
```

### Quick ranges for a report

`presets` lists ranges to pick in one click, beside the calendar. Give the key of a built-in range, which the locale's messages name, or a `DateRangePreset` with a label and a function that works out its range from today. Here `maxDate` is today, so "This month" and "This year" end today.

```example
date-range-picker/presets
```

### Limits and closed days

`minDate` and `maxDate` limit both ends, and `disabledDates` takes days that can't be picked, as a predicate or a list. A range may still span a disabled day, as a stay spans a Monday the office is closed.

```example
date-range-picker/limits
```

## Appearance & Styling

### Size and rounding

```html
<mona-date-range-picker [(value)]="stay" size="large" rounded="full"></mona-date-range-picker>
```

Supported `size` values are `small`, `medium` and `large`. Supported `rounded` values are `none`, `small`, `medium`, `large` and `full`. Both also apply to the popup.

`class` adds classes to the control, and `popupClass` to the popup. `popupWidth` and `popupHeight` size the popup; when they are empty, it fits the calendar and the quick ranges.

The control is as wide as its contents. Each input fits the longest date in `format`, such as "September 28, 2026" for `MMMM d, yyyy`, or its placeholder when that is longer, and leaves room for the clear button when `showClearButton` is set. Digits are drawn at one width, so the text doesn't shift as it changes. To fill the container, add `class="w-full"`: the calendar button then moves to the end.

### Calendar options

`months` sets how many months the calendar shows side by side, 2 by default. They wrap onto new rows when the screen is too narrow for them. `firstDay` sets the first day of the week, and `weekNumber` shows week numbers.

In the calendar, the first and last days of the range are drawn in the primary color, and the days between them in the selected tint.

## Behavior

### Typing a range

Each input shows its end in `format`, or in the active locale's date format when `format` is `null`. Typed text is also accepted with one-digit days and months and a two-digit year.

The text of both inputs is written to `value` on `Enter` and when an input loses focus. Clearing an input, or pressing the clear button shown by `showClearButton`, empties that end at once. The value is `null` when both ends are empty. Either end can be empty while the other is set.

When the text can't be written, the range stays as it was, the input shows its error, and the bound form field gets the error:

| Error | When |
|---|---|
| `parse` | The text isn't a date in the format |
| `minDate`, `maxDate` | The date is before `minDate` or after `maxDate` |
| `disabledDate` | The date is in `disabledDates` |
| `minDate` on the end | The end is before the start |
| `maxDate` on the start | The start is after the end |

An end before the start is reported on the input entered last, with the other end as the limit, so the form field writes "The date must be on or after March 4, 2025."

### Picking from the calendar

The calendar opens on the months of the range. The first day picked starts a new range, and the calendar previews it as the pointer moves; the second day picked ends it, and the range is written and the popup closes. Picking the end before the start swaps them. When the range has only its start, the first day picked ends it.

### Quick ranges

Each built-in range is worked out from today when the popup opens. Weeks start on `firstDay`, or on the locale's first day of the week.

| Key | Range |
|---|---|
| `today`, `yesterday` | That day alone |
| `last7Days`, `last30Days` | The days up to and including today |
| `thisWeek`, `thisMonth`, `thisYear` | The whole week, month or year today is in |
| `lastWeek`, `lastMonth`, `lastYear` | The whole week, month or year before it |

A `DateRangePreset` is `{ label, range }`, where `range` takes today's date, at the start of the day, and returns `{ start, end }`. Its ends are put in order.

```typescript
const nextTwoWeeks: DateRangePreset = {
    label: "Next 2 weeks",
    range: today => ({ start: today, end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13) })
};
```

Picking a quick range writes it and closes the popup. A range is kept within `minDate` and `maxDate`. One with no day left in them, or whose first or last day is in `disabledDates`, is disabled. The quick range that is the value is shown selected.

On a phone the quick ranges sit above the calendar, in rows.

### On a phone

With `adaptiveMode="auto"`, on a screen narrower than 640 pixels, the popup opens as a sheet along the bottom of the screen, over a dimmed page, as described for the [dropdown list](/components/dropdown-list#the-bottom-sheet). The sheet has the field's name, or `adaptiveTitle`, and a close button. The quick ranges sit above the calendar and are 44 pixels tall, the months are below each other, and their days grow to as much as 44 pixels, to be easy to tap. The sheet scrolls when the months are taller than it. Focus moves into the calendar, as it does in the popup under the field.

### Disabled and read-only

`disabled` and `readonly` keep the popup from opening. `readonlyInput` blocks typing in both inputs but keeps the calendar button working, so the range can only be picked.

### Popup events

`open` and `close` fire before the popup opens or closes, and both can be prevented. `opened` and `closed` fire after.

## Forms Integration

`DateRangePickerComponent` implements `FormValueControl<DateRange | null>` from `@angular/forms/signals`.

```typescript
import { signal } from "@angular/core";
import { FormField, form, required } from "@angular/forms/signals";
import type { DateRange } from "@nanahoshi/mona-ui/date-range-picker";

protected readonly form = form(signal<{ stay: DateRange | null }>({ stay: null }), schema => {
    required(schema.stay);
});
```

```html
<mona-date-range-picker [formField]="form.stay"></mona-date-range-picker>
```

The `FormField` directive writes `disabled`, `invalid`, `readonly`, `required` and `touched`. The `touch` output fires when focus leaves the picker and its popup, so moving between the inputs or into the calendar doesn't mark the field touched.

The limits are inputs of the picker, `minDate` and `maxDate`, rather than the form's `minDate` and `maxDate` rules, which check a single date. Typing errors are reported to the bound form field, whether it is a signal form, `ngModel` or a reactive form control.

## Accessibility

The picker is a `role="group"`, named by its label. Each input is a `role="combobox"` named for its end by the `start` and `end` messages ("Start date" and "End date"), with `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls` pointing at the popup. The hint and the errors of a form field, or the picker's `aria-describedby`, describe both inputs.

The popup is a `role="dialog"` with `aria-modal="true"`, named by the `dateRangePicker` message ("Date range picker"). It traps focus, and the calendar takes focus when it opens. Each month in it is a grid named by its caption. The quick ranges are buttons in a `role="group"` named by the `presets` message ("Quick ranges"), and the one that is the value has `aria-pressed="true"`.

| Attribute | Where | Value |
|---|---|---|
| `role` | Host | `"group"` |
| `aria-label`, `aria-labelledby` | Host | The matching inputs on the picker, or the label of a `mona-label` or `mona-form-field` around it |
| `aria-disabled` | Host | `"true"` while disabled |
| `role` | Each input | `"combobox"` |
| `aria-label` | Each input | The `start` or `end` message |
| `aria-describedby` | Each input | The picker's `aria-describedby`, and a form field's hint and errors |
| `aria-invalid` | Each input | `"true"` on that input's typing error, or on both once `touched` and either `invalid`, or `required` with an empty range |
| `aria-haspopup` | Each input | `"dialog"` |
| `aria-expanded` | Each input and the calendar button | `"true"` while the popup is open, otherwise `"false"` |
| `aria-label` | Calendar button | The `openCalendar` message ("Open calendar") |
| `role` | Popup | `"dialog"`, with `aria-modal="true"` |
| `role`, `aria-label` | Quick ranges | `"group"`, named by the `presets` message |
| `aria-pressed` | Each quick range | `"true"` on the one that is the value, otherwise `"false"` |

The calendar button has `tabindex="-1"`, so the picker is two Tab stops, one for each input. Keyboard users open the popup with `Alt+ArrowDown`.

**Consumer responsibilities**

- Label the picker. Put it in a `mona-form-field` or a `<mona-label text="...">`, or set `aria-labelledby` or `aria-label`. The placeholders are not labels.

### Keyboard Interaction

| Key | Where | Action |
|---|---|---|
| `Alt+ArrowDown` | Either input | Opens the popup |
| `Alt+ArrowUp` / `Escape` | Either input, the calendar or a quick range | Closes the popup |
| `Enter` | Either input | Writes the typed text to `value` |

Inside the popup, the calendar's keyboard map applies, and the arrow keys move between its months. `Tab` moves between the quick ranges and the calendar. Closing the popup returns focus to the input that had it, or to the end input once a range is picked, unless the user moved focus elsewhere.
