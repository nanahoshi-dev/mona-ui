## Overview

Use Editor when people write formatted text: headings, lists, links, images and tables. For plain text, use `mona-text-area`.

`@nanahoshi/mona-ui/editor` exports `EditorComponent`, the `EDITOR_DEFAULT_MESSAGES` catalog, the `countEditorText` function, and the `ContentChangeEvent`, `EditorMention`, `EditorMentionSearch`, `EditorSettings` and `EditorTextUnit` types.

## Import & Quick Start

```typescript
import { countEditorText, EditorComponent } from "@nanahoshi/mona-ui/editor";
import type { ContentChangeEvent, EditorMention, EditorMentionSearch, EditorSettings } from "@nanahoshi/mona-ui/editor";
```

```html
<label id="notes-label">Notes</label>
<mona-editor aria-labelledby="notes-label" placeholder="Write a note" [(value)]="notes" />
```

## Examples

### Two-way value

`[(value)]` holds the content as HTML. An empty editor has the value `""`.

```example
editor/basic
```

### A smaller toolbar

Every tool is on by default. Pass only what you want to change in `settings`.

```example
editor/toolbar
```

### Forms

Bound with `[formField]`, the editor gets `disabled`, `invalid`, `readonly`, `required` and `touched` from the form. Link the error message with `aria-describedby`.

```example
editor/forms
```

### Image upload

`imageUpload` uploads an image file and returns its address, as a promise or an observable. It takes the same function as the file upload's `upload`. With it, images pasted or dropped into the content upload where they land, and the image tool's form takes a file as well as an address. `imageAccept` and `imageMaxFileSize` limit the files it takes.

```example
editor/image-upload
```

### Counts and a character limit

`showWordCount` and `showCharacterCount` show counts under the content. `characterLimit` shows how many characters are left, then how many are too many. It doesn't stop typing or cut what's pasted, so in a form, check the limit with `countEditorText`, which counts the value as the editor does.

```example
editor/character-limit
```

### Mentions

`mentionSearch` finds what to mention as `@` and a query are typed, such as people. It returns a list, a promise or an observable. A mention is kept in the HTML as `<span data-type="mention" data-id="…" data-label="…">@label</span>`, so your server can find who was mentioned by `data-id`.

```example
editor/mentions
```

## Behavior

- The form inputs (`disabled`, `invalid`, `readonly`, `required`, `touched`) are set by the form when the editor is bound with `[formField]`.
- The editor is created in the browser after the first render, so `html` and `json` have no content on the server. Wait for `create` before reading them at startup.

### Toolbar Settings

Every tool is on by default. Pass only what you want to change, as in the toolbar example.

`alignment`, `blockquote`, `bold`, `code`, `fontColor`, `fontFamily`, `fontHighlight`, `fontSize`, `headings`, `history`, `horizontalRule`, `image`, `indent`, `italic`, `link`, `list`, `mention`, `strikethrough`, `subscript`, `superscript`, `table`, `taskList` and `underline` are booleans. `code: false` also turns off the code block, and `image: false` image upload. `mention` has no tool: it keeps the mentions of the content, and offers them as `@` is typed when `mentionSearch` is set. Without it, mentions stay as text.

| Setting        | Type               | Default | Description                                                                                                            |
| :------------- | :----------------- | :------ | :--------------------------------------------------------------------------------------------------------------------- |
| `fontList`     | `Iterable<string>` | `[]`    | The fonts the font family dropdown offers.                                                                             |
| `fontSizeList` | `Iterable<string>` | `[]`    | The sizes the font size dropdown offers, as CSS lengths such as `"14px"` or `"1.25rem"`. Empty keeps the default list. |

If you remove a tool, content that used it stays as text.

The text color and highlight pickers show the color of the selection. They show none when the selected text has no color or several, so any color you pick applies to all of it.

### Image Upload

- While an image uploads, a placeholder shows where it goes, with a preview and the progress. The placeholder isn't content: the value changes once the image is in.
- The image goes where it was pasted or dropped, even as text is typed or deleted next to it. If a deletion takes the placeholder with it, the image isn't added. The images of one paste or drop go in their order, whichever finishes first.
- The upload returns the image's address as a string. If it fails, or returns anything else, the placeholder goes and the editor says the image couldn't be uploaded.
- A paste that carries HTML too, such as an image copied from a web page, is pasted as it is, with the image's own address.
- A file larger than `imageMaxFileSize` isn't uploaded, and the editor says so.
- When the editor is destroyed, its uploads stop: the upload's `signal` is aborted.
- With an image selected, the image tool edits it: its address, alt text and size.

### Counts

- Characters are counted as people see them: an emoji or a letter with an accent counts once. Markup, images and line breaks don't count, and a mention counts as its `@label`.
- Words are found by the rules of the library locale, so text without spaces, such as Japanese, counts its words.
- Over the limit, the editor shows as invalid, as it does with `invalid`.

### Mentions

- The suggestions open for an `@` at the start of a line or after a space, so an email address doesn't open them, and not in code.
- Each change to the query searches again. A late result for an earlier query is dropped, and a failed search shows no matches.
- Escape closes the suggestions until a new `@` is typed. They close when the content loses focus too.
- A mention is one piece: Backspace removes it at once.

### Content and Safety

The editor reads HTML through its schema, so tags and attributes it doesn't know are dropped. Links typed in the link dialog keep `http:`, `https:`, `mailto:`, `tel:` and relative URLs, get `https://` when they are a bare host, and are refused with any other scheme, such as `javascript:`.

An uploaded image's address goes in as the upload returns it.

These checks protect the editor, not your application. The value is user-written HTML: sanitize it on the server before you store it, and again before you render it anywhere else.

### Localization and Direction

Toolbar labels, the default content name, the counts and what the editor announces come from the `editor` messages (`EDITOR_DEFAULT_MESSAGES`), and follow the library locale. In right-to-left, the toolbar order mirrors and start and end alignment follow the direction.

## Accessibility

The content has `role="textbox"` with `aria-multiline`, its name, and `aria-disabled`, `aria-readonly`, `aria-required` and `aria-invalid` when they apply. Link an error message or hint with `aria-describedby`. The toolbar is named and its toggle buttons report `aria-pressed`.

- While an image uploads, its placeholder is an image named for it, such as "Uploading chart.png". The editor announces when an upload starts and when the image is in, fails or is too large.
- With `characterLimit`, the content is described by the limit too, after your own `aria-describedby`. Once typing stops for a second, the editor announces how many characters are left or too many, while the content has focus. The counts under the content aren't announced as they change.
- Focus stays in the content while mention suggestions show. The content has `aria-autocomplete="list"`, `aria-controls` for the list and `aria-activedescendant` for the highlighted suggestion, and how many suggestions there are is announced.

### Keyboard Navigation

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
| `ArrowDown` / `ArrowUp`     | Mention suggestions      | Moves the highlight, wrapping at the ends.                       |
| `Enter` / `Tab`             | Mention suggestions      | Puts the highlighted suggestion in, with a space after it.       |
| `Escape`                    | Mention suggestions      | Closes them until a new `@` is typed.                            |
