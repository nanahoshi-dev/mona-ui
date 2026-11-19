# Kanban

**Selector:** `mona-kanban`

`KanbanComponent` lays out cards in columns by their status, such as To do, In progress and Done, and lets users move a card within its column or to another by dragging it, or with Control+Shift and the arrow keys. Each move is announced, and a column can have a limit that keeps cards from other columns out once it's full.

The board takes one flat array of cards and emits a new one after each move, with the moved card's status changed. Cards can be plain text or your own template.
