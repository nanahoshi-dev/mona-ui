## Overview

Use `DatePickerComponent` for a single date in a form field, where users may type the date or pick it from a calendar. The calendar stays hidden until the user opens it.

Use `CalendarComponent` instead when the calendar should always be visible, or when users select several dates or a range. Use `DateTimePickerComponent` when the value also needs a time of day, and `TimePickerComponent` when it is only a time.

## Import & Quick Start

```typescript
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
```

```html
<label for="start-date">Start date</label>
<mona-date-picker inputId="start-date" [(value)]="startDate"></mona-date-picker>
```

```typescript
protected readonly startDate = signal<Date | null>(null);
```

## Anatomy

The picker is a text input with a calendar button at its end. The button opens a popup that holds a `mona-calendar`.

| Template | Imported from | Fills |
|---|---|---|
| `ng-template[monaDateInputPrefixTemplate]` | `@nanahoshi/mona-ui/date-input` | Content before the input text, such as an icon |
| `ng-template[monaCalendarMonthCellTemplate]` | `@nanahoshi/mona-ui/calendar` | Each day cell of the popup calendar |
| `ng-template[monaCalendarYearCellTemplate]` | `@nanahoshi/mona-ui/calendar` | Each month cell of the year view |
| `ng-template[monaCalendarDecadeCellTemplate]` | `@nanahoshi/mona-ui/calendar` | Each year cell of the decade view |

The cell templates receive the same context as on the [Calendar](../calendar) page.

## Appearance & Styling

### Size and rounding

```html
<mona-date-picker [(value)]="date" size="large" rounded="full"></mona-date-picker>
```

Supported `size` values are `small`, `medium` and `large`. Supported `rounded` values are `none`, `small`, `medium`, `large` and `full`. Both also apply to the popup.

`class` adds classes to the input's container, and `popupClass` to the popup. `popupWidth` and `popupHeight` size the popup; when they are empty, it fits the calendar.

### Calendar options

`firstDay` sets the first day of the week, and `weekNumber` shows week numbers in the calendar. Without `firstDay`, the week starts on the day the active locale uses.

## Behavior

### Typing a date

The input shows the value in `format`, or in the active locale's date format when `format` is `null`. Typed text is also accepted with one-digit days and months and a two-digit year, which is read as a year in this century.

Typed text is written to `value` on `Enter` and when the input loses focus. Text that isn't a date keeps the previous value and reports a `parse` error. A date before `min` or after `max` reports a `minDate` or `maxDate` error, and a date in `disabledDates` reports a `disabledDate` error, instead of setting the value. Clearing the text, or pressing the clear button shown by `showClearButton`, sets `value` to `null` at once.

### Picking from the calendar

Choosing a day in the calendar sets `value` and closes the popup. Days before `min`, after `max`, or in `disabledDates` can't be chosen. `disabledDates` takes an iterable of dates or a predicate.

### Disabled and read-only

`disabled` and `readonly` keep the popup from opening. `readonlyInput` blocks typing but keeps the calendar button working, so the date can only be picked.

### Popup events

`open` and `close` fire before the popup opens or closes, and both can be prevented. `opened` and `closed` fire after.

## Forms Integration

`DatePickerComponent` implements `FormValueControl<Date | null>` from `@angular/forms/signals`.

```typescript
import { signal } from "@angular/core";
import { FormField, form, required } from "@angular/forms/signals";

protected readonly form = form(signal<{ start: Date | null }>({ start: null }), schema => {
    required(schema.start);
});
```

```html
<mona-date-picker [formField]="form.start"></mona-date-picker>
```

The `FormField` directive writes `disabled`, `invalid`, `readonly`, `required` and `touched`. The `touch` output fires when focus leaves both the picker and its popup, so moving into the calendar doesn't mark the field touched.

Typing errors (`parse`, `minDate`, `maxDate`, `disabledDate`) are reported to the bound form field, whether it is a signal form, `ngModel` or a reactive form control.

## Accessibility

The input is a `role="combobox"` with `aria-haspopup="dialog"`, `aria-autocomplete="none"`, `aria-expanded` and `aria-controls` pointing at the popup. The popup is a `role="dialog"` with `aria-modal="true"`, named by the `datePicker` message ("Date picker"). It traps focus, and the calendar inside takes focus when it opens.

| Attribute | Where | Value |
|---|---|---|
| `role` | Input | `"combobox"` |
| `aria-haspopup` | Input | `"dialog"` |
| `aria-expanded` | Input | `"true"` while the popup is open, otherwise `"false"` |
| `aria-controls` | Input and calendar button | The popup's `id` |
| `aria-label`, `aria-labelledby`, `aria-describedby` | Input | The matching inputs on the picker |
| `aria-invalid` | Input and host | `"true"` on a typing error, or once `touched` and either `invalid`, or `required` with no date |
| `aria-label` | Calendar button | The `openCalendar` message ("Open calendar") |
| `role` | Popup | `"dialog"`, with `aria-modal="true"` |

The calendar button has `tabindex="-1"`, so the picker is one Tab stop. Keyboard users open the popup with `Alt+ArrowDown`. The calendar's own roles are described on the [Calendar](../calendar) page.

**Consumer responsibilities**

- Label the picker. Point a `<label for>` or `<mona-label for>` at `inputId`, wrap it in `<mona-label text="...">`, or set `aria-labelledby` or `aria-label`. The placeholder is not a label. `[for]` bound to the picker's template reference only moves focus to the input on click, and doesn't name it.
- Link hint or error text with `aria-describedby`.

### Keyboard Interaction

| Key | Where | Action |
|---|---|---|
| `Alt+ArrowDown` | Input | Opens the popup |
| `Alt+ArrowUp` / `Escape` | Input or calendar | Closes the popup |
| `Enter` | Input | Writes the typed text to `value` |

Inside the popup, the calendar's keyboard map applies. Closing the popup returns focus to the input, unless the user moved focus elsewhere.
