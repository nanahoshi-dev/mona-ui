# Tile View

**Selector:** `mona-tile-view`

`TileViewComponent` shows a collection as tiles of one size, in rows that fill the width, like the icons of a file explorer. Only the rows in view are rendered, so it stays fast with tens of thousands of items. It is one Tab stop: the arrow keys move in two dimensions, and selection works as in a file explorer, with Ctrl and Shift.

Import it from `@nanahoshi/mona-ui/tile-view`, and name every tile view with `aria-label` or `aria-labelledby`.
