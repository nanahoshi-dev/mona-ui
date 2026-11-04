# Mona UI Dates and Times

Five components pick dates and times. The pickers are text inputs with a popup; the calendar and the time selector are the popups' content, and can also be placed on the page.

| Component                 | Entry point                          | Value                          | Use it when                                                                 |
| ------------------------- | ------------------------------------ | ------------------------------ | --------------------------------------------------------------------------- |
| `<mona-date-picker>`      | `@nanahoshi/mona-ui/date-picker`     | `Date \| null`, at midnight    | a form field takes a day: a birth date, a due date                          |
| `<mona-time-picker>`      | `@nanahoshi/mona-ui/time-picker`     | `Date \| null`                 | a form field takes a time of day: opening hours, a reminder                 |
| `<mona-datetime-picker>`  | `@nanahoshi/mona-ui/datetime-picker` | `Date \| null`                 | a form field takes a moment: a meeting start, a deadline                    |
| `<mona-calendar>`         | `@nanahoshi/mona-ui/calendar`        | `Date \| Date[] \| null`       | the calendar is always shown, or several days or a range are picked         |
| `<mona-time-selector>`    | `@nanahoshi/mona-ui/time-selector`   | `Date \| null`                 | the hour and minute lists are always shown                                  |

Every value is a JavaScript `Date` in the user's time zone. A date-only value is midnight of that day; a time-only value keeps the day it was set on (today when it starts empty), so compare times with `getHours()` and `getMinutes()`, not the whole date.

---

## 1. Basic Usage

```typescript
import { Component, signal } from "@angular/core";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { LabelComponent } from "@nanahoshi/mona-ui/label";

@Component({
    selector: "app-booking",
    imports: [DatePickerComponent, LabelComponent],
    template: `
        <mona-label for="check-in" text="Check-in"></mona-label>
        <mona-date-picker
            inputId="check-in"
            showClearButton
            [min]="today"
            [(value)]="checkIn"></mona-date-picker>
    `
})
export class BookingComponent {
    protected readonly checkIn = signal<Date | null>(null);
    protected readonly today = new Date();
}
```

- The button at the end of the input opens the popup; <kbd>Alt</kbd>+<kbd>↓</kbd> does too, and <kbd>Esc</kbd> or <kbd>Alt</kbd>+<kbd>↑</kbd> closes it.
- `showClearButton` shows a button that empties the value at once.
- `readonlyInput` blocks typing but keeps the popup, for fields that must be picked from the calendar.
- `placeholder` shows while the field is empty. It isn't a label.

---

## 2. Typing a Date

The input format comes from the active locale (`MM/dd/yyyy` in en-US, `dd.MM.yyyy` in de-DE), unless `format` sets a [Luxon format](https://moment.github.io/luxon/#/parsing?id=table-of-tokens).

- The typed text is written to the value on <kbd>Enter</kbd> and when the input loses focus. <kbd>Enter</kbd> commits before a surrounding form submits. While an IME is composing, <kbd>Enter</kbd> is left to the IME.
- The format is also accepted with one-digit days, months, hours, minutes and seconds ("1/5/2025", "9:05"), and with a two-digit year ("1/5/25"). Two-digit years up to 60 read as 20xx, later ones as 19xx.
- After a commit, the text is shown again in the input format: "1/5/25" becomes "01/05/2025".
- Text that isn't a date, or a date the picker doesn't allow (section 3), **keeps the previous value and the text**, and marks the field invalid. The user can correct the text; nothing they typed is lost.
- Emptying the input, with the keyboard or the clear button, clears the value.

The errors reach the form field the picker is bound to, so they show in `field().errors()` and make the form invalid:

| Error kind      | When                                                   | Extra property   |
| --------------- | ------------------------------------------------------ | ---------------- |
| `"parse"`       | the text isn't a date (or a time) in any accepted form | –                |
| `"minDate"`     | the date is before `min`                               | `minDate: Date`  |
| `"maxDate"`     | the date is after `max`                                | `maxDate: Date`  |
| `"disabledDate"`| the date is one of `disabledDates`                     | `date: Date`     |

`minDate` and `maxDate` are Angular's own error classes, the ones the signal-forms `minDate()` and `maxDate()` validators report. The errors clear when the value changes, by typing a valid date or by picking one.

---

## 3. Limits

```html
<mona-date-picker [min]="opening" [max]="closing" [disabledDates]="isClosedDay"></mona-date-picker>
```

```typescript
protected readonly isClosedDay = (date: Date): boolean => date.getDay() === 0;
```

- `min` and `max` bound the date. The calendar won't move or select outside them, and typed dates outside them are reported (section 2).
- `disabledDates` is either a list of dates or a function. Disabled days stay reachable with the keyboard, so a screen reader can tell they are unavailable, but they can't be selected.
- The time picker compares only the **time of day** with `min` and `max`, whatever day those dates carry.
- The date-time picker compares the full date and time. In its time view, `min` and `max` limit the hours on their own day only.
- The calendar's **Today** button is disabled when today isn't allowed, and the <kbd>T</kbd> key then stays where it is.

---

## 4. Times

```html
<mona-time-picker inputId="reminder" [minuteStep]="15" showSeconds></mona-time-picker>
```

- `hourFormat` is `"12"` or `"24"`. When it isn't set, the locale's clock is used: 12-hour for en-US, ja-JP and ko-KR, 24-hour for de-DE, fr-FR and tr-TR. It also sets the input format.
- `hourStep`, `minuteStep` and `secondStep` set the options in the lists. The keyboard moves through those options only.
- `showSeconds` adds the seconds list and the seconds to the input format.
- In the time selector, **Set** writes the time and **Now** moves the lists to the current time. With `[footer]="false"`, each pick is written at once.

---

## 5. Keyboard

### Calendar

| Key                                          | Action                                                       |
| -------------------------------------------- | ------------------------------------------------------------ |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | previous / next day, or week; in the year and decade views, the next cell |
| <kbd>Page Up</kbd> / <kbd>Page Down</kbd>      | previous / next month (year, decade in the other views)      |
| <kbd>Shift</kbd>+<kbd>Page Up</kbd> / <kbd>Page Down</kbd> | previous / next year in the month view       |
| <kbd>Home</kbd> / <kbd>End</kbd>               | first / last day of the month                                |
| <kbd>Ctrl</kbd>+<kbd>↑</kbd> / <kbd>Ctrl</kbd>+<kbd>↓</kbd> | up to the year or decade view / back down        |
| <kbd>Enter</kbd> or <kbd>Space</kbd>          | select the focused day, or open the focused month or year    |
| <kbd>T</kbd>                                  | move to today, when it's allowed                             |

With `selection="multiple"`, <kbd>Ctrl</kbd>+<kbd>Enter</kbd> (or <kbd>Ctrl</kbd>+click) adds or removes a day, and <kbd>Shift</kbd> with the arrows extends the selection. With `selection="range"`, the first pick starts the range and the second ends it; the value is written only once the range is complete. In right-to-left locales, the left and right arrows swap.

### Time selector

| Key                                     | Action                                            |
| --------------------------------------- | ------------------------------------------------- |
| <kbd>↑</kbd> / <kbd>↓</kbd>               | previous / next option in the focused list        |
| <kbd>←</kbd> / <kbd>→</kbd>               | previous / next list (swapped right-to-left)      |
| <kbd>Home</kbd> / <kbd>End</kbd>          | first / last option within `min` and `max`        |
| <kbd>Enter</kbd> or <kbd>Space</kbd>      | write the time                                    |

### Date-time picker

The popup has **Date** and **Time** tabs. <kbd>←</kbd> and <kbd>→</kbd> (or <kbd>Home</kbd> and <kbd>End</kbd>) move between the tabs, and <kbd>Alt</kbd>+<kbd>←</kbd> / <kbd>Alt</kbd>+<kbd>→</kbd> switch them from inside the calendar or the time lists. Picking a day moves to the time view; **Set** writes the date and time, **Cancel** or <kbd>Esc</kbd> closes without changing the value.

---

## 6. Labelling and Forms

Set `inputId` and point `<label for>` or `<mona-label for>` at it. Without a visible label, use `aria-label`, or `aria-labelledby` with the id of the text that names the field. `aria-describedby` links hints and error messages to the input.

```typescript
import { form, FormField, required } from "@angular/forms/signals";

@Component({
    imports: [DateTimePickerComponent, FormField, LabelComponent],
    template: `
        <mona-label for="starts" text="Starts"></mona-label>
        <mona-datetime-picker inputId="starts" aria-describedby="starts-error" [formField]="meeting.starts">
        </mona-datetime-picker>
        @if (meeting.starts().touched() && meeting.starts().invalid()) {
            <span id="starts-error">Enter a date and time, such as 05/01/2026, 09:30 AM.</span>
        }
    `
})
export class MeetingComponent {
    readonly #model = signal<{ starts: Date | null }>({ starts: null });
    protected readonly meeting = form(this.#model, schema => required(schema.starts));
}
```

- The pickers, the calendar and the time selector implement Angular's `FormValueControl`, so `[formField]` works directly. `[(ngModel)]` and `[formControl]` work too, and receive the typed-text errors as well.
- `[formField]` writes `disabled`, `readonly`, `required`, `invalid` and `touched`, and it binds `min` and `max` from the field's rules. Don't bind those yourself on the same element.
- The field is marked **touched when focus leaves the component and its popup**, as with a native input. Opening the popup, picking a day or moving between the lists doesn't count.
- Boolean inputs accept the bare attribute form: `<mona-date-picker required readonlyInput>`.
- `focus(options?)` moves focus to the input, with the caret at the end, read-only pickers included. `options` go to the native call, for example `{ preventScroll: true }`.

The pickers' inputs are comboboxes with a dialog popup; the calendar is a grid whose day cells are named with the full date ("Tuesday, November 4, 2026") and report `aria-selected`. An inline calendar or time selector doesn't take focus when it appears; set `focusOnMount` when it should.
