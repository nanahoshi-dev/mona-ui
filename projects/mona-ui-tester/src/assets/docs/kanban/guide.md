## Overview

Give the board its columns and its cards. Each column has a `status`, and each card goes in the column whose status its status field holds, in the order of the array. When the user moves a card, the board emits the array with the card in its new place; bind it two-way and the move renders.

**Use Kanban when:**

- Work moves through stages, and users move it themselves: tasks, issues, applicants, orders.
- A stage should hold only so many items at a time.

To let users reorder a single list, or a few lists of your own markup, use [Sortable](/components/sortable), which this board is built on.

## Import & Quick Start

```typescript
import { type KanbanColumn, KanbanComponent } from "@nanahoshi/mona-ui/kanban";
```

```html
<mona-kanban aria-label="Event planning" [columns]="columns" [(data)]="tasks" />
```

```typescript
protected readonly columns: readonly KanbanColumn[] = [
    { status: "todo", title: "To do" },
    { status: "doing", title: "In progress" },
    { status: "done", title: "Done" }
];
protected readonly tasks = signal<Task[]>([
    { id: 1, status: "todo", title: "Draft the newsletter" },
    { id: 2, status: "doing", title: "Design the poster" }
]);
```

`statusField` names the field that holds a card's status, `"status"` by default, and `textField` the field shown as its text, `"title"` by default. A card whose status matches no column isn't shown.

## Anatomy

| Directive | Selector | Template context | Replaces |
| --- | --- | --- | --- |
| `KanbanCardTemplateDirective` | `ng-template[monaKanbanCardTemplate]` | `$implicit`: the card; `column`; `index` in the column | The card's text |
| `KanbanColumnHeaderTemplateDirective` | `ng-template[monaKanbanColumnHeaderTemplate]` | `$implicit`: the column; `cards`; `count` | The column's title and count |
| `KanbanColumnFooterTemplateDirective` | `ng-template[monaKanbanColumnFooterTemplate]` | `$implicit`: the column; `cards`; `count` | Nothing: it adds a foot below the cards |

Bind the board's data to `monaKanbanCardTemplateOf` to type the card in the template; without it, the card is `any`. The header names the column, so a header template should keep its title.

## Examples

### A board

```example
kanban/board
```

### Card templates, limits and moves

The card template shows each issue's priority and assignee, and the footer adds an issue to its column. Building and Testing take two cards each: once one is full, its count is highlighted and cards from other columns can't move into it, by pointer or keyboard. `cardMove` reports each move.

```example
kanban/templates
```

## Behavior

### Moves and the data

A move first emits `cardMove`. It carries the card as it was, the card as it is now (`movedCard`), its previous and new status and index in its column, and the board's new array, `data`. Call `preventDefault()` to refuse the move, such as when the server turns it down. Otherwise the board emits the new array through `dataChange`, which `[(data)]` writes back.

A card that moves to another column is copied with its status field set to the column's status, `{ ...card, status }`, so the array you passed isn't changed. A card that stays in its column keeps its object. The new array keeps every other card where it was, and puts the moved card before the card it now sits above in its column.

### Limits

A column's `limit` is the most cards it takes. Once it holds that many, cards from other columns can't come in, and its count shows as "2 / 2" in the warning colors. Cards already in it can still be reordered. The board doesn't enforce the limit on the data you give it: a column can start over its limit, and stays highlighted until it's under.

### Disabling

`disabled` stops cards from moving. Focus still moves between them, and what their templates hold still works.

### Size and scrolling

The board lays its columns out in a row, 18rem wide each, and scrolls sideways when they don't fit. Give it a height, such as with a `class`, and each column scrolls its own cards. A card dragged near the board's edge, or a column's, scrolls it.

## Accessibility

The board is a `group`, which `aria-label` names. Each column is a `group` too, holding a list of its cards; both are named by the column's title and count, "In progress 2 of 3 cards". The visible count is hidden from screen readers, which read the count in words instead.

The board is one Tab stop: the card last focused, or the first card. After a move, the board announces the card's name, from its `textField`, and its new place: "Design the poster moved to Done, position 1 of 2".

### Keyboard

With focus on a card:

| Key | Action |
| --- | --- |
| `ArrowUp` / `ArrowDown` | Moves focus to the previous or next card in the column |
| `ArrowLeft` / `ArrowRight` | Moves focus to the next column with cards, to the card in the same row or the last one |
| `Home` / `End` | Moves focus to the first or last card in the column |
| `Control+Shift+ArrowUp` / `Control+Shift+ArrowDown` (`Command+Shift` on macOS) | Moves the card up or down its column |
| `Control+Shift+ArrowLeft` / `Control+Shift+ArrowRight` | Moves the card to the previous or next column that has room, in the same row |
| `Control+Shift+Home` / `Control+Shift+End` | Moves the card to the top or bottom of its column |

`ArrowLeft` and `ArrowRight` swap in right-to-left layouts. Focus stays on a moved card.

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `role` | On the board and on each column | `"group"` |
| `aria-labelledby` | On each column and its list | The column's title and count |
| `aria-keyshortcuts` | On each card, unless the board is disabled | The shortcuts that move it |
