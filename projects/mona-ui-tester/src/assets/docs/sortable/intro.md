# Sortable

**Selectors:** `[monaSortable]`, `[monaSortableItem]`, `[monaSortableGroup]`, `[monaSortableHandle]`

`SortableDirective` lets users reorder the items of a list you render yourself, such as a list of priorities, a row of chips or a grid of dashboard tiles. They drag an item to its new place, or focus it and press Control+Shift with an arrow key, and each move is announced to screen readers. Lists inside a `monaSortableGroup` exchange items, as the columns of a board do.

The directive adds no markup or roles: your list keeps its own. To reorder tabs, use the `sortable` input of [Tabs](/components/tabs); for a board of columns, use [Kanban](/components/kanban), which is built on this directive.
