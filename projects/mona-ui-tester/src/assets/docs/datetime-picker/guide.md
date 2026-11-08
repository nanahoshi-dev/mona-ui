## Overview

Use `DateTimePickerComponent` when one value holds both a date and a time of day, such as an appointment. Users may type both, or open a popup that shows a calendar on a Date tab and time lists on a Time tab.

Use `DatePickerComponent` instead when only the date matters, and `TimePickerComponent` when only the time does. Use `CalendarComponent` when the calendar should always be visible.

## Import & Quick Start

```typescript
import { DateTimePickerComponent } from "@nanahoshi/mona-ui/datetime-picker";
```

```html
<label for="appointment">Appointment</label>
<mona-datetime-picker inputId="appointment" [(value)]="appointment"></mona-datetime-picker>
```

```typescript
protected readonly appointment = signal<Date | null>(null);
```

## Anatomy

The picker is a text input with a button at its end. The button opens a popup with a Date tab and a Time tab, one panel showing either a `mona-calendar` or a `mona-time-selector`, and **Set** and **Cancel** buttons.

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
<mona-datetime-picker [(value)]="appointment" size="large" rounded="full"></mona-datetime-picker>
```

Supported `size` values are `small`, `medium` and `large`. Supported `rounded` values are `none`, `small`, `medium`, `large` and `full`. Both also apply to the popup and its contents.

`class` adds classes to the input's container, and `popupClass` to the popup. `popupWidth` and `popupHeight` size the popup; when they aren't set, it fits its content and is at least as wide as the input.

### Calendar and clock options

`firstDay` sets the first day of the week, and `weekNumber` shows week numbers in the calendar. `hourFormat` is `"12"`, with an AM/PM list, or `"24"`; when it is `null`, the active locale's clock is used. `hourStep`, `minuteStep` and `secondStep` set the distance between time list items, and `showSeconds` adds the seconds list.

## Behavior

### Typing a date and time

The input shows the value in `format`, or in a format built from the active locale, `hourFormat` and `showSeconds` when `format` is `null`. Typed text is also accepted with one-digit parts and a two-digit year.

Typed text is written to `value` on `Enter` and when the input loses focus. Text that isn't a date and time keeps the previous value and reports a `parse` error. A value before `min` or after `max` reports a `minDate` or `maxDate` error, and a date in `disabledDates` reports a `disabledDate` error, instead of setting the value. Clearing the text, or pressing the clear button shown by `showClearButton`, sets `value` to `null` at once.

### Picking from the popup

The popup opens on the Date tab. Choosing a day keeps the time already chosen and moves to the Time tab. Changes in the popup don't touch `value` until the user confirms them:

- **Set** writes the chosen date and time to `value` and closes the popup. `Enter` on the Time tab, outside a button, does the same.
- **Cancel** and `Escape` close the popup and drop the changes.

A chosen date and time before `min` or after `max` is moved to that limit. On the day of `min` or `max`, the time lists are limited too. Each time the popup closes, it goes back to the Date tab and to the current value.

### Disabled and read-only

`disabled` and `readonly` keep the popup from opening. `readonlyInput` blocks typing but keeps the popup button working, so the value can only be picked.

### Popup events

`open` and `close` fire before the popup opens or closes, and both can be prevented. `opened` and `closed` fire after.

## Forms Integration

`DateTimePickerComponent` implements `FormValueControl<Date | null>` from `@angular/forms/signals`.

```typescript
import { signal } from "@angular/core";
import { FormField, form, required } from "@angular/forms/signals";

protected readonly form = form(signal<{ appointment: Date | null }>({ appointment: null }), schema => {
    required(schema.appointment);
});
```

```html
<mona-datetime-picker [formField]="form.appointment"></mona-datetime-picker>
```

The `FormField` directive writes `disabled`, `invalid`, `readonly`, `required` and `touched`. The `touch` output fires when focus leaves both the picker and its popup, so moving into the popup doesn't mark the field touched.

Typing errors (`parse`, `minDate`, `maxDate`, `disabledDate`) are reported to the bound form field, whether it is a signal form, `ngModel` or a reactive form control.

## Accessibility

The input is a `role="combobox"` with `aria-haspopup="dialog"`, `aria-autocomplete="none"`, `aria-expanded` and `aria-controls` pointing at the popup. The popup is a `role="dialog"` with `aria-modal="true"`, named by the `dateTimePicker` message ("Date and time picker"). It traps focus, and the calendar takes focus when it opens.

The Date and Time buttons form a `role="tablist"` following the tabs pattern: each is a `role="tab"` with `aria-selected` and `aria-controls`, only the selected tab is in the Tab order, and the panel is a `role="tabpanel"` labelled by the selected tab. Choosing a tab keeps focus on it; picking a day moves focus into the time selector.

| Attribute | Where | Value |
|---|---|---|
| `role` | Input | `"combobox"` |
| `aria-haspopup` | Input | `"dialog"` |
| `aria-expanded` | Input | `"true"` while the popup is open, otherwise `"false"` |
| `aria-controls` | Input and popup button | The popup's `id` |
| `aria-label`, `aria-labelledby`, `aria-describedby` | Input | The matching inputs on the picker |
| `aria-invalid` | Input and host | `"true"` on a typing error, or once `touched` and either `invalid`, or `required` with no value |
| `aria-label` | Popup button | The `openDateTimePicker` message ("Open date and time picker") |
| `role` | Popup | `"dialog"`, with `aria-modal="true"` |
| `role` | Date and Time buttons | `"tab"`, inside a `"tablist"` |
| `aria-selected` | Date and Time buttons | `"true"` on the shown view |
| `role` | Panel | `"tabpanel"`, with `aria-labelledby` set to the selected tab |

The popup button has `tabindex="-1"`, so the picker is one Tab stop. Keyboard users open the popup with `Alt+ArrowDown`. The calendar's own roles are described on the [Calendar](../calendar) page.

**Consumer responsibilities**

- Label the picker. Point a `<label for>` or `<mona-label for>` at `inputId`, or set `aria-labelledby` or `aria-label`. The placeholder is not a label.
- Link hint or error text with `aria-describedby`.

### Keyboard Interaction

| Key | Where | Action |
|---|---|---|
| `Alt+ArrowDown` | Input | Opens the popup |
| `Alt+ArrowUp` | Input, calendar or time selector | Closes the popup |
| `Escape` | Input, calendar or time selector | Closes the popup and drops the changes |
| `Alt+ArrowRight` / `Alt+ArrowLeft` | Input, calendar or time selector | Shows the Time or Date view (swapped in right-to-left layouts) |
| `ArrowRight` / `ArrowLeft`, `Home` / `End` | Tabs | Selects and focuses the Date or Time tab (arrows swapped in right-to-left layouts) |
| `Enter` | Input | Writes the typed text to `value` |
| `Enter` | Time selector | Sets the chosen date and time and closes the popup |

Inside the panel, the calendar's and the time selector's own keyboard maps apply. Closing the popup returns focus to the input, unless the user moved focus elsewhere.
