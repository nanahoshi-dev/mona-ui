# Server Binding & Virtualization

**Selectors:** `mona-grid[monaGridServerBinding]`, `mona-grid[monaGridVirtualScroll]`

Two ways to show more rows than a browser should hold. `monaGridServerBinding` hands paging, sorting and filtering to your server and shows the page it returns. `monaGridVirtualScroll` keeps every row in memory but renders only the ones in view, and can ask for more as people scroll.
