## Overview

Use an alert for a message that belongs to a place on the page and stays there until it's no longer true or someone dismisses it. It can be part of the page from the start, such as a notice, or appear because of something the user did, such as a save that failed.

**Use an alert when you need to:**

- Explain why a form didn't submit, with a way to try again
- Warn about something that affects the page, such as a plan running out of storage
- Confirm that a long task finished, where the result is shown

**Use something else when:**

- The message is brief and not tied to a place: use a [Notification](/components/notification), which comes and goes on its own
- The user has to decide before carrying on: use a [Dialog](/components/dialog)
- The message is about one field: use the [Form Field](/components/form-field)'s error, next to the field
- It's a short status beside something: use a [Badge](/components/badge)

## Import & Quick Start

```typescript
import { AlertComponent } from "@nanahoshi/mona-ui/alert";
// Only for a row of buttons below the text:
import { AlertActionsDirective } from "@nanahoshi/mona-ui/alert";
```

```html
<mona-alert look="warning" title="Storage almost full">
    You've used 92% of your plan.
</mona-alert>
```

## Anatomy

| Part | How to set it |
|------|---------------|
| Icon | Set by `look`. Replace it with `<ng-template monaAlertIconTemplate>`, or leave it out with `[showIcon]="false"`. |
| Title | `title`, in bold above the text. |
| Text | The alert's content. |
| Actions | An element marked `monaAlertActions`, such as a `div` of buttons. It's placed below the text, wherever it is in the content. |
| Dismiss button | `dismissible`, in the corner. It emits `dismiss`. |

## Examples

### Looks

```example
alert/looks
```

### A form that failed to save

The alert appears when saving fails, and `announce="assertive"` reads its title and text at once, so a screen reader user hears why nothing changed. Both its buttons go away with it, so each one moves focus to the Save button first: Try again before it hides the alert, and the dismiss handler after.

```example
alert/form-error
```

## Appearance & Styling

| `look`    | Means                                   | Icon           |
|-----------|-----------------------------------------|----------------|
| `info`    | Something to know (default)             | Info           |
| `success` | Something finished as hoped             | Circle check   |
| `warning` | Something may go wrong                  | Triangle alert |
| `error`   | Something went wrong                    | Circle X       |
| `neutral` | A note with no urgency                  | Info           |

Each look uses the theme's subtle tint, the text color paired with it at 4.5:1 or more, and a border at 3:1 or more against the tint. The alert fills its container's width; set a `max-w-*` class on it, or on its container, to keep lines short.

Classes passed via `class` are merged with the alert's own through `tailwind-merge`, so `class="p-3"` replaces its padding.

## Behavior

### Announcing

`announce` reads the title and text aloud once, after the alert first renders: `assertive` interrupts what's being read, and `polite` waits. The actions aren't read. Use it for an alert that appears because of something the user did. An alert that's part of the page when it loads shouldn't announce itself, and keeps the default, `off`. Changing the text later isn't announced; show a new alert, or announce the change yourself.

### Dismissing

`dismissible` adds a dismiss button that emits `dismiss`. The alert doesn't hide itself: remove it in your handler, for example with `@if`, and decide whether it stays dismissed.

## Accessibility

The alert adds no role. It reads in place, as part of the page, and `announce` is what makes a new one heard, through a live region the page already has, which screen readers announce more reliably than one that appears with its content.

- **Say what it means in words.** The tint and the icon back the text up; the icon is hidden from assistive technology. A title such as "Payment failed" does this well.
- **Move focus when it goes.** The dismiss button, and any action that hides the alert, are removed with it, and focus would fall back to the top of the page. Move it to where the user carries on, as the form example does.
- **Name the dismiss button.** It's named "Dismiss" followed by the title, such as "Dismiss, Payment failed", in the current locale. `dismissLabel` replaces "Dismiss".
- **Keep headings out.** The title isn't a heading, so it doesn't add to the page outline. Put a heading in the content if the alert starts a section.

| Key | Action |
|-----|--------|
| `Tab` | Reaches the actions and the dismiss button, in that order |
| `Enter`, `Space` | Activates the focused button |
