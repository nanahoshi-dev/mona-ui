## Overview & Component Selection

Use Editor when people write formatted text: headings, lists, links, images and tables. For plain text, use `mona-text-area`.

`@nanahoshi/mona-ui/editor` exports `EditorComponent`, the `EDITOR_DEFAULT_MESSAGES` catalog, and the `ContentChangeEvent` and `EditorSettings` types.

## Import & Quick Start

```typescript
import { EditorComponent } from "@nanahoshi/mona-ui/editor";
import type { ContentChangeEvent, EditorSettings } from "@nanahoshi/mona-ui/editor";
```

```html
<label id="notes-label">Notes</label>
<mona-editor aria-labelledby="notes-label" placeholder="Write a note" [(value)]="notes" />
```

## Components Reference

### `<mona-editor>`

| Input / Output     | Type                         | Default     | Description                                                                                                                |
| :----------------- | :--------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------- |
| `aria-describedby` | `string`                     | `""`        | The id of an element that describes the content, such as a hint or an error message.                                       |
| `aria-label`       | `string`                     | `""`        | The accessible name of the content. Without it or `aria-labelledby`, the content is named "Rich text editor" (translated). |
| `aria-labelledby`  | `string`                     | `""`        | The id of a visible label for the content.                                                                                 |
| `class`            | `string`                     | `""`        | CSS classes applied to the host element.                                                                                   |
| `content`          | `string \| JSONContent`      | `undefined` | **Deprecated.** Use `value`, or `[formField]` with a signal form.                                                          |
| `disabled`         | `boolean`                    | `false`     | Disables the editor: the content can't be edited and the toolbar is inert.                                                 |
| `invalid`          | `boolean`                    | `false`     | Marks the editor as invalid once it has been touched.                                                                      |
| `placeholder`      | `string`                     | `""`        | Text shown in the empty editor. It is not a name.                                                                          |
| `readonly`         | `boolean`                    | `false`     | Makes the content read-only and hides the toolbar.                                                                         |
| `required`         | `boolean`                    | `false`     | Marks the editor as required: once touched, an empty editor is invalid.                                                    |
| `settings`         | `Partial<EditorSettings>`    | `{}`        | Which tools the toolbar offers. Changing them rebuilds the editor and keeps its document.                                  |
| `touched`          | `boolean`                    | `false`     | Sets the touched state.                                                                                                    |
| `value`            | `model(string)`              | `""`        | The content as HTML. An empty editor has the value `""`. Bindable with `[(value)]`.                                        |
| `blur`             | `output<void>`               | -           | **Deprecated.** Use `editorBlur`.                                                                                          |
| `create`           | `output<void>`               | -           | Emits when the editor is ready, and again when it is rebuilt for new `settings`.                                           |
| `editorBlur`       | `output<void>`               | -           | Emits when the editor loses focus.                                                                                         |
| `editorFocus`      | `output<void>`               | -           | Emits when the editor gains focus.                                                                                         |
| `selectionUpdate`  | `output<void>`               | -           | Emits when the selection changes.                                                                                          |
| `touch`            | `output<void>`               | -           | Emits when the editor loses focus, for form directives.                                                                    |
| `update`           | `output<ContentChangeEvent>` | -           | Emits `{ html, json }` when the user changes the content. It isn't emitted when `value` is set from outside.               |

The form inputs (`disabled`, `invalid`, `readonly`, `required`, `touched`) are set by the form when the editor is bound with `[formField]`.

### Properties and Methods

| Member            | Description                                                                                        |
| :---------------- | :------------------------------------------------------------------------------------------------- |
| `html`            | The content as HTML, or `""` before the editor is created.                                         |
| `json`            | The content as a Tiptap `JSONContent` document, or an empty document before the editor is created. |
| `focus(options?)` | Moves focus into the content, keeping the selection it had.                                        |

The editor is created in the browser after the first render, so `html` and `json` have no content on the server. Wait for `create` before reading them at startup.

## Toolbar Settings

Every tool is on by default. Pass only what you want to change:

```html
<mona-editor aria-label="Comment" [settings]="{ image: false, table: false, fontFamily: false }" />
```

`alignment`, `blockquote`, `bold`, `code`, `fontColor`, `fontFamily`, `fontHighlight`, `fontSize`, `headings`, `history`, `horizontalRule`, `image`, `indent`, `italic`, `link`, `list`, `strikethrough`, `subscript`, `superscript`, `table`, `taskList` and `underline` are booleans. `code: false` also turns off the code block.

| Setting        | Type               | Default | Description                                                                                                            |
| :------------- | :----------------- | :------ | :--------------------------------------------------------------------------------------------------------------------- |
| `fontList`     | `Iterable<string>` | `[]`    | The fonts the font family dropdown offers.                                                                             |
| `fontSizeList` | `Iterable<string>` | `[]`    | The sizes the font size dropdown offers, as CSS lengths such as `"14px"` or `"1.25rem"`. Empty keeps the default list. |

If you remove a tool, content that used it stays as text.

The text color and highlight pickers show the color of the selection. They show none when the selected text has no color or several, so any color you pick applies to all of it.

## Content and Safety

The editor reads HTML through its schema, so tags and attributes it doesn't know are dropped. Links typed in the link dialog keep `http:`, `https:`, `mailto:`, `tel:` and relative URLs, get `https://` when they are a bare host, and are refused with any other scheme, such as `javascript:`.

These checks protect the editor, not your application. The value is user-written HTML: sanitize it on the server before you store it, and again before you render it anywhere else.

## Keyboard Navigation

The toolbar is one Tab stop.

| Key                         | Where                    | Action                                                           |
| :-------------------------- | :----------------------- | :--------------------------------------------------------------- |
| `Tab`                       | Toolbar                  | Moves into the content.                                          |
| `ArrowRight` / `ArrowLeft`  | Toolbar                  | Moves between tools. They follow the direction in right-to-left. |
| `Home` / `End`              | Toolbar                  | Moves to the first or last tool.                                 |
| `Tab` / `Shift` + `Tab`     | List in the content      | Nests or lifts the list item.                                    |
| `Tab`                       | Elsewhere in the content | Leaves the editor.                                               |
| `Ctrl` + `]` / `Ctrl` + `[` | Content                  | Indents or outdents. Use `Cmd` on macOS.                         |
| `Escape`, then `Tab`        | List in the content      | Leaves the editor, so the keyboard isn't stuck in a long list.   |

## Accessibility

The content has `role="textbox"` with `aria-multiline`, its name, and `aria-disabled`, `aria-readonly`, `aria-required` and `aria-invalid` when they apply. Link an error message or hint with `aria-describedby`. The toolbar is named and its toggle buttons report `aria-pressed`.

## Localization and Direction

Toolbar labels and the default content name come from the `editor` messages (`EDITOR_DEFAULT_MESSAGES`), and follow the library locale. In right-to-left, the toolbar order mirrors and start and end alignment follow the direction.
