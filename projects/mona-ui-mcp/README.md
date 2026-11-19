# @nanahoshi/mona-ui-mcp

An [MCP](https://modelcontextprotocol.io) server that lets coding agents work with
[Mona UI](https://github.com/nanahoshi-dev/mona-ui) from its docs instead of from memory. It answers for the version
of `@nanahoshi/mona-ui` your project has installed.

## Tools

| Tool              | What it does                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `list_components` | Lists every docs page by category, with the entry point each imports from, after the setup essentials.                                                 |
| `search_docs`     | Finds the page sections and API symbols for a task, such as "editable grid rows".                                                                      |
| `get_docs_page`   | Reads a page as markdown, with each example's code. A long page comes back as an outline, then one section at a time.                                  |
| `get_api`         | The import path, selector, inputs with types and defaults, outputs and methods of a component, directive, pipe or type.                               |
| `check_template`  | Checks a template's use of Mona UI: unknown elements, made-up inputs and outputs, missing required inputs. Lists the imports the template needs, too. |

All of them only read. The server makes no network requests.

## Setup

It needs Node.js 20 or later. Start it from your project's folder, so it finds the installed `@nanahoshi/mona-ui`.

Claude Code:

```sh
claude mcp add mona-ui -- npx -y @nanahoshi/mona-ui-mcp
```

Cursor, in `.cursor/mcp.json`, and other clients that read the same format:

```json
{
    "mcpServers": {
        "mona-ui": {
            "command": "npx",
            "args": ["-y", "@nanahoshi/mona-ui-mcp"]
        }
    }
}
```

VS Code, in `.vscode/mcp.json`:

```json
{
    "servers": {
        "mona-ui": {
            "type": "stdio",
            "command": "npx",
            "args": ["-y", "@nanahoshi/mona-ui-mcp"]
        }
    }
}
```

## Which docs it reads

Each version of `@nanahoshi/mona-ui` ships its docs as data. The server reads them from the nearest
`node_modules/@nanahoshi/mona-ui`, looking from each `--project` folder, then the folders the client shares as roots,
then the folder it was started in.

When it finds none, or an older version that ships no docs data, it answers from the docs bundled with it, which are
those of the Mona UI release it came with. Its first answer then says so.

| Option               | What it does                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `--project <folder>` | Where the Angular project is, when the client starts the server somewhere else. Repeat for several. |
| `--docs <folder>`    | Reads the docs from a folder laid out like the package: `docs/manifest.json` and `docs/api`.        |
