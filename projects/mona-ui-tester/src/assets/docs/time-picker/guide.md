## Overview

Use `TimePickerComponent` for a time of day in a form field, where users may type the time or pick it from lists of hours, minutes and seconds. The lists stay hidden until the user opens them.

Use `DateTimePickerComponent` instead when the value also needs a date, and `DatePickerComponent` when it is only a date.

## Import & Quick Start

```typescript
import { TimePickerComponent } from "@nanahoshi/mona-ui/time-picker";
```

```html
<label for="meeting-time">Meeting time</label>
<mona-time-picker inputId="meeting-time" [(value)]="meetingTime"></mona-time-picker>
```

```typescript
protected readonly meetingTime = signal<Date | null>(null);
```

The value is a `Date`. Only its time of day is chosen; a time typed into an empty picker is put on today's date.

## Appearance & Styling

### Size and rounding

```html
<mona-time-picker [(value)]="time" size="large" rounded="full"></mona-time-picker>
```

Supported `size` values are `small`, `medium` and `large`. Supported `rounded` values are `none`, `small`, `medium`, `large` and `full`. Both also apply to the popup and its time selector.

`class` adds classes to the input's container, and `popupClass` to the popup. `popupWidth` and `popupHeight` size the popup; when they aren't set, it fits the time selector.

### Clock and steps

```html
<mona-time-picker [(value)]="time" hourFormat="24" [minuteStep]="15" [showSeconds]="true"></mona-time-picker>
```

`hourFormat` is `"12"`, with an AM/PM list, or `"24"`. When it is `null`, the active locale's clock is used: 12-hour for `en-US`, 24-hour for `de-DE`. `hourStep`, `minuteStep` and `secondStep` set the distance between list items, and `showSeconds` adds the seconds list.

## Behavior

### Typing a time

The input shows the value in `format`, or in a format built from the active locale, `hourFormat` and `showSeconds` when `format` is `null`. Typed text is also accepted with one-digit hours, minutes and seconds.

Typed text is written to `value` on `Enter` and when the input loses focus, on the current value's day (today when empty). Text that isn't a time keeps the previous value and reports a `parse` error. A time before `min` or after `max` reports a `minDate` or `maxDate` error instead of setting the value. Only the time of day of `min` and `max` is compared. Clearing the text, or pressing the clear button shown by `showClearButton`, sets `value` to `null` at once.

### Picking from the popup

The popup holds a `mona-time-selector`. Choosing items in its lists moves the shown time; the **Set** button, `Enter` or `Space` writes it to `value` and closes the popup. The **Now** button moves the lists to the current time. A time outside `min` and `max` is moved inside them when it is set.

### Disabled and read-only

`disabled` and `readonly` keep the popup from opening. `readonlyInput` blocks typing but keeps the popup button working, so the time can only be picked.

### Popup events

`open` and `close` fire before the popup opens or closes, and both can be prevented. `opened` and `closed` fire after.

## Forms Integration

`TimePickerComponent` implements `FormValueControl<Date | null>` from `@angular/forms/signals`.

```typescript
import { signal } from "@angular/core";
import { FormField, form, required } from "@angular/forms/signals";

protected readonly form = form(signal<{ time: Date | null }>({ time: null }), schema => {
    required(schema.time);
});
```

```html
<mona-time-picker [formField]="form.time"></mona-time-picker>
```

The `FormField` directive writes `disabled`, `invalid`, `readonly`, `required` and `touched`. The `touch` output fires when focus leaves both the picker and its popup, so moving into the time selector doesn't mark the field touched.

Typing errors (`parse`, `minDate`, `maxDate`) are reported to the bound form field, whether it is a signal form, `ngModel` or a reactive form control.

## Accessibility

The input is a `role="combobox"` with `aria-haspopup="dialog"`, `aria-autocomplete="none"`, `aria-expanded` and `aria-controls` pointing at the popup. The popup is a `role="dialog"` with `aria-modal="true"`, named by the `timePicker` message ("Time picker"). It traps focus, and the time selector inside takes focus when it opens.

| Attribute | Where | Value |
|---|---|---|
| `role` | Input | `"combobox"` |
| `aria-haspopup` | Input | `"dialog"` |
| `aria-expanded` | Input | `"true"` while the popup is open, otherwise `"false"` |
| `aria-controls` | Input and popup button | The popup's `id` |
| `aria-label`, `aria-labelledby`, `aria-describedby` | Input | The matching inputs on the picker |
| `aria-invalid` | Input and host | `"true"` on a typing error, or once `touched` and either `invalid`, or `required` with no time |
| `aria-label` | Popup button | The `openTimePicker` message ("Open time picker") |
| `role` | Popup | `"dialog"`, with `aria-modal="true"` |
| `role` | Time selector | `"group"`, named by its `timeSelector` message |
| `aria-label` | Each list in the time selector | Its hours, minutes, seconds or AM/PM message |
| `aria-activedescendant` | Each list in the time selector | The item at the shown time |

The popup button has `tabindex="-1"`, so the picker is one Tab stop. Keyboard users open the popup with `Alt+ArrowDown`.

**Consumer responsibilities**

- Label the picker. Point a `<label for>` or `<mona-label for>` at `inputId`, or set `aria-labelledby` or `aria-label`. The placeholder is not a label.
- Link hint or error text with `aria-describedby`.

### Keyboard Interaction

| Key | Where | Action |
|---|---|---|
| `Alt+ArrowDown` | Input | Opens the popup |
| `Alt+ArrowUp` | Input | Closes the popup |
| `Escape` | Input or popup | Closes the popup |
| `Enter` | Input | Writes the typed text to `value` |
| `ArrowUp` / `ArrowDown` | Time selector list | Moves to the previous or next item |
| `ArrowLeft` / `ArrowRight` | Time selector list | Moves to the list on that side, also in right-to-left layouts, wrapping around at the ends |
| `Home` / `End` | Time selector list | Moves to the first or last item |
| `Enter` / `Space` | Time selector list | Sets the shown time and closes the popup |

Closing the popup returns focus to the input, unless the user moved focus elsewhere.
