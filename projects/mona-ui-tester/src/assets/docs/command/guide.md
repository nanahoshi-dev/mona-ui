## Overview

Use the command menu when people should reach something by typing its name: an application's actions, a search across pages, or a picker with many options. It runs nothing by itself. Choosing an item emits an event, and your code decides what happens and whether the menu closes.

**Use a closely related Mona UI component instead when:**

- The choice is a form value: use `ComboBoxComponent` or `AutoCompleteComponent`, which work with forms.
- There are only a few actions, and no need to search: use `PopupMenuComponent`.

## Import & Quick Start

```typescript
import {
    CommandComponent,
    CommandEmptyComponent,
    CommandInputComponent,
    CommandItemComponent,
    CommandListComponent
} from "@nanahoshi/mona-ui/command";
```

```html
<mona-command (itemSelect)="run($event.value)">
    <mona-command-input />
    <mona-command-list>
        <mona-command-empty />
        <mona-command-item value="New file">New file</mona-command-item>
        <mona-command-item value="Open file" [keywords]="['load']">Open file</mona-command-item>
    </mona-command-list>
</mona-command>
```

## Anatomy

```html
<mona-command>
    <mona-command-header>A strip for filters or a title</mona-command-header>
    <mona-command-input />
    <mona-command-list>
        <mona-command-empty />
        <mona-command-loading />
        <mona-command-group heading="Files">
            <mona-command-item value="New file">
                <mona-command-highlight text="New file" />
                <mona-command-shortcut keys="mod+n" />
            </mona-command-item>
        </mona-command-group>
        <mona-command-separator />
    </mona-command-list>
    <mona-command-footer>A strip for key hints</mona-command-footer>
</mona-command>
```

Place `mona-command-empty` and `mona-command-loading` directly inside `mona-command-list`, which keeps them out of the listbox. Items can come from any depth, including your own components, as long as they're inside the `mona-command`.

## Examples

### An action palette in a dialog

`mona-command-dialog` renders its template while it's open. Set `shortcut` to open and close it from anywhere on the page. No key is bound unless you set one. `mod` is Command on Apple devices and Ctrl elsewhere.

```html
<mona-command-dialog shortcut="mod+k" [(open)]="open">
    <ng-template monaCommandDialogContent>
        <mona-command (itemSelect)="open.set(false)">
            <mona-command-input />
            <mona-command-list>
                <mona-command-empty />
                <mona-command-item value="New file" (itemSelect)="newFile()">
                    New file
                    <mona-command-shortcut keys="mod+n" />
                </mona-command-item>
            </mona-command-list>
        </mona-command>
    </ng-template>
</mona-command-dialog>
```

`mona-command-shortcut` only shows the keys. Binding them to the action is up to you.

### A picker in a popover

```html
<button #assign monaButton type="button">Assign to…</button>
<mona-popover #popover="monaPopover" position="bottom" [target]="assign">
    <mona-command class="w-64 border-0" (itemSelect)="assignTo($event.value); popover.close()">
        <mona-command-input placeholder="Find a person…" ariaLabel="Find a person" />
        <mona-command-list>
            <mona-command-empty />
            @for (person of people; track person) {
                <mona-command-item [value]="person">
                    <mona-command-highlight [text]="person" />
                </mona-command-item>
            }
        </mona-command-list>
    </mona-command>
</mona-popover>
```

### Results from a server

With `filterMode="manual"` every item you render shows, because your results are already narrowed down. Angular's `resource` keeps only the answer to the latest query, so a slow, older response never replaces a newer one. Set `loading` from it to show `mona-command-loading` and hold back the empty state.

```html
<mona-command filterMode="manual" [loading]="results.isLoading()" [(query)]="query">
    <mona-command-input />
    <mona-command-list>
        <mona-command-loading />
        <mona-command-empty />
        @for (result of results.value(); track result.id) {
            <mona-command-item [value]="result.title">{{ result.title }}</mona-command-item>
        }
    </mona-command-list>
</mona-command>
```

```typescript
protected readonly query = signal("");
protected readonly results = resource({
    defaultValue: [],
    params: () => this.query(),
    loader: ({ params, abortSignal }) => search(params, abortSignal)
});
```

### Telling a modified choice apart

The select event carries the original click or key press, so Ctrl+Enter can do something different from Enter.

```typescript
protected open(event: CommandSelectEvent): void {
    const newTab = event.originalEvent.ctrlKey || event.originalEvent.metaKey;
    this.navigate(event.value, newTab);
}
```

### A custom filter

By default an item stays when every word of the query appears in its `value` or `keywords`, ignoring case and accents. The list keeps your order. Pass `filter` to change what counts as a match.

```typescript
protected readonly startsWith: CommandFilter = (query, item) =>
    item.value.toLowerCase().startsWith(query.toLowerCase());
```

## Appearance & Styling

Classes on `mona-command` and its parts add to their own, so `class="border-0"` removes the outer border inside a popover. The root takes a `rounded` input.

## Theming

| Variable | What it sets | Default |
|---|---|---|
| `--mona-command-background` | The background of the menu | `--color-surface` |
| `--mona-command-item-active-background` | The background of the active item | `--color-hover` |
| `--mona-command-list-max-height` | How tall the list gets before it scrolls | `20rem` |

## Behavior

- Focus stays in the input. The arrow keys move the active item, and Enter chooses it.
- The first result is active, so Enter always has something to choose while there are results. A new query goes back to the first result. New results for the same query keep the active item if it's still among them.
- Disabled items show, but the arrow keys skip them.
- Home and End stay with the input, where they move the caret.
- While an input method composes text, Enter and the arrow keys belong to it.
- A group hides when none of its items show. A separator hides while the component filters.
- `mona-command-dialog` closes on Escape and on a click outside. It creates its content each time it opens, so the query starts empty, unless you keep it in your own signal with `[(query)]`.

## Accessibility

- The input is a `combobox` that controls a `listbox`, and it points at the active item with `aria-activedescendant`.
- The number of results is announced through a polite live region after each search. The announcement waits while `loading` is on.
- The default labels come from the `command` messages, and `ariaLabel` on `mona-command-input`, `mona-command-list` and `mona-command-dialog` replaces them. Name an input for what it searches.
- `mona-command-dialog` is modal: the rest of the page is inert, focus moves to the input, and focus returns to where it was when the dialog closes.
- The active item uses the system highlight color in forced colors.
- The spoken key names in `mona-command-shortcut` are in English. Give the item an `aria-label` where that matters.
