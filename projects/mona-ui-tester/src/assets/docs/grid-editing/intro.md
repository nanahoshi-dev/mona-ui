# Editing

**Selectors:** `mona-grid[monaGridEditable]`, `mona-grid-command-column`, `ng-template[monaGridEditTemplate]`, `button[monaGridAddCommand]`, `button[monaGridEditCommand]`, `button[monaGridRemoveCommand]`, `button[monaGridSaveCommand]`, `button[monaGridCancelCommand]`

`monaGridEditable` turns on inline editing, one cell or one row at a time, backed by Angular Signal Forms. A command column adds Edit and Remove buttons to each row, and an Add command opens a new row above the others. The grid never changes your data: you save, add and remove rows from its events.
