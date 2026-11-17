## Overview

Use `FileUploadComponent` wherever a form takes files: attachments, receipts, a profile photo, an import. It works two ways:

- **Picking only.** Without an `upload` function, the value holds the files that passed the checks, and the form sends them itself, for example in a `FormData` body.
- **Uploading.** With an `upload` function, each file is sent as it's added, or when the upload button is pressed. The list shows each file's progress, and the value holds the files that finished uploading.

The component doesn't talk to a server itself. The upload function does, with HttpClient, `fetch` or a storage SDK, so it works with any backend.

## Import & Quick Start

```typescript
import { FileUploadComponent } from "@nanahoshi/mona-ui/file-upload";
```

```html
<mona-form-field label="Attachments">
    <mona-file-upload [(value)]="attachments"></mona-file-upload>
</mona-form-field>
```

```typescript
protected readonly attachments = signal<File[]>([]);
```

To upload each file as it's added, pass an upload function. With HttpClient:

```typescript
import { HttpClient } from "@angular/common/http";
import type { FileUploadHandler } from "@nanahoshi/mona-ui/file-upload";

readonly #http = inject(HttpClient);

protected readonly upload: FileUploadHandler = file => {
    const body = new FormData();
    body.append("file", file);
    return this.#http.post<{ id: string }>("/api/files", body, { observe: "events", reportProgress: true });
};
```

```html
<mona-file-upload [upload]="upload" (uploadSuccess)="onUploaded($event)"></mona-file-upload>
```

## Anatomy

| Part | What it is |
|---|---|
| Drop zone | A box with a dashed border, its text, the checks in effect, and the browse button. Files can be dropped anywhere on it, and a click on it opens the file dialog. |
| Browse button | Opens the browser's file dialog. It's the way in for the keyboard. |
| File list | One row per file: an icon, the file's name, its size and status, a progress bar while it uploads, and its buttons. |
| Row buttons | Retry, on a failed upload. Remove, or cancel while the file uploads. |
| Upload and clear buttons | Below the list while files wait for the upload button, when `autoUpload` is off. |

The native `<input type="file">` is in the component, hidden. The browse button and the drop zone use it, so the dialog filters by `accept` and allows `multiple`, as the browser's own does.

## Examples

### Attachments that go with the form

Without an upload function, the value is the list of files, and the form sends them on submit.

```example
file-upload/basic
```

### Uploading with progress

The upload function here stands in for a server, and reports its progress as it goes. Check "Server offline" to see a failed upload, then uncheck it and retry. The `remove` event carries what the upload returned, to delete the file from the server.

```example
file-upload/upload
```

### Type, size and count

`accept` takes the same list as the native attribute. `maxFileSize` and `maxFiles` limit the size of each file and the number of files. Files that don't pass are listed with the reason, and stay out of the value.

```example
file-upload/restrictions
```

### Upload on request

With `autoUpload` off, files wait in the list until the upload button is pressed, so people can check what they picked first.

```example
file-upload/manual-upload
```

### Required in a signal form

The value holds the uploaded files, so the field stays invalid until one upload has finished. The `uploading()` signal keeps the submit button off while files are on their way.

```example
file-upload/signal-forms
```

## Appearance & Styling

The component fills its container's width. `class` adds classes to the host, which lays out the drop zone, the list and the buttons in a column.

| Part | How it looks |
|---|---|
| Drop zone | A dashed `input-border`, on the control background. Its border turns `focus-indicator` on hover. |
| Dragging over | The border turns solid in `focus-indicator`, and the zone takes the `selected` tint with `selected-foreground` text. In forced colors the border is drawn in `Highlight`, since the tint doesn't paint there. |
| Invalid | The drop zone's border turns `error`. |
| Disabled | The drop zone takes the disabled border, background and text. |
| A row | A `border` outline on the control background. A failed or rejected row has an `error` border, and its status is written in `error`. |

## Behavior

### Picking files

People pick files with the browse button, by dropping them on the drop zone, or by clicking the zone. With `multiple`, the default, each pick adds to the list. A file picked twice, with the same name, size, type and modification time, is skipped. With `multiple` off, a new file replaces the one in the list, and a running upload of the old one stops.

### Checks

Each file is checked as it's added:

| Check | Rejected when | Reason shown |
|---|---|---|
| `accept` | The file's extension or MIME type isn't in it | "This file type isn't accepted." |
| `maxFileSize` | The file is larger, in bytes | "The file is larger than 5 MB." |
| `minFileSize` | The file is smaller, in bytes | "The file is smaller than 1 byte." |
| `maxFiles` | The list already holds that many files, or one without `multiple` | "No more than 3 files can be added." |

`accept` matches extensions such as `.pdf` and MIME types such as `image/png` or `image/*`, like the dialog does. Dropped files are checked too, since the dialog's filter doesn't apply to them. Sizes are shown in multiples of 1024, so `5 * 1024 * 1024` reads as "5 MB".

A rejected file stays in the list with its reason until the next pick, or until it's removed. It isn't in the value, and isn't uploaded. The drop zone states the checks in effect, such as "File types: PDF or DOCX · Max. file size: 5 MB · Up to 3 files".

### Uploading

`upload` takes a function that uploads one file. It gets the file and a context, and returns a promise or an observable:

| It returns | Progress | The file's `response` | Failure |
|---|---|---|---|
| HttpClient's request with `observe: "events"` and `reportProgress: true` | Read from its upload progress events | The response's body | Its error |
| Any other observable | `context.progress(loaded, total)` | Its last value | Its error |
| A promise | `context.progress(loaded, total)` | What it resolves to | Its rejection, or an exception thrown by the function |

Until progress is reported, the progress bar runs without a value. `total` defaults to the file's size.

An upload stops when the file is removed, the list is cleared, the value is set from outside or the component is destroyed. An observable is unsubscribed, which cancels HttpClient's request, and `context.signal` is aborted. With `fetch`, pass the signal on:

```typescript
protected readonly upload: FileUploadHandler = async (file, { signal }) => {
    const response = await fetch(`/api/files?name=${encodeURIComponent(file.name)}`, {
        body: file,
        method: "PUT",
        signal
    });
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
};
```

`fetch` can't report upload progress, so the progress bar runs without a value until the file is uploaded.

Uploads run side by side, one per file. A failed file shows a retry button, and `uploadError` carries the error. `uploadSuccess` carries the item with its `response`.

`autoUpload` is on by default. When it's off, files wait in the list as "Ready to upload", below which an upload button and a clear button show. `uploadFiles()` starts the waiting uploads too.

### The value

| Mode | `value` holds |
|---|---|
| No `upload` function | The files that passed the checks |
| With an `upload` function | The files that finished uploading |

Rejected files are never in the value, and with an upload function, neither are files that are waiting, uploading or failed. Setting `value` from outside replaces the list: without an upload function the files are listed as picked, and with one as uploaded, which suits files that are already on the server. A form reset empties the list the same way.

`items()` lists every file with its status, progress, response and error, as `FileUploadItem`s. `uploading()` is `true` while any file uploads.

### Removing files

Each row's button removes its file, or cancels the upload while it runs. The `remove` event carries the item as it was, with its `response` if it was uploaded, so the server's copy can be deleted. `clearFiles()`, and the clear button, remove every file and emit `remove` for each but the rejected.

### Disabled and read-only

`disabled` turns off the drop zone, the browse button and the row buttons. Files dropped on a disabled zone are ignored, and the browser doesn't open them in the tab. `readonly` keeps the list as it is: the browse button is off, drops are ignored, and the rows have no buttons. A `mona-fieldset` with `disabled` disables the upload too.

## Forms Integration

`FileUploadComponent` implements `FormValueControl<File[]>` from `@angular/forms/signals`. The `FormField` directive writes `disabled`, `invalid`, `readonly`, `required` and `touched`.

Signal Forms' `required` doesn't count an empty list as missing. Pair it with a `validate` that reports `requiredError()`, so the form is invalid and the form field shows "This field is required.":

```typescript
import { form, required, requiredError, validate } from "@angular/forms/signals";

protected readonly claim = form(signal({ receipts: [] as File[] }), path => {
    required(path.receipts);
    validate(path.receipts, ({ value }) => (value().length === 0 ? requiredError() : undefined));
});
```

```html
<mona-form-field label="Receipts">
    <mona-file-upload [formField]="claim.receipts" [upload]="upload"></mona-file-upload>
</mona-form-field>
```

The `touch` output fires when focus leaves the component, and when files are dropped on it. Moving between its buttons doesn't fire it, and neither does the file dialog taking the window's focus.

## Accessibility

The component is a `role="group"`, named by its label. The browse button is a native `<button>`, described by the checks under the drop zone, and by a form field's hint and errors. The native file input is hidden from assistive technology and from `Tab`, since the browse button opens it.

The list is named by the `files` message ("Files"). Each row's buttons are named for their file, such as "Remove report.pdf", "Cancel the upload of report.pdf" and "Retry the upload of report.pdf". A file's progress bar is a `role="progressbar"` named by the file's name.

| Attribute | Where | Value |
|---|---|---|
| `role` | Host | `"group"` |
| `aria-label`, `aria-labelledby` | Host | The matching inputs, or the label of a `mona-label` or `mona-form-field` around it |
| `aria-describedby` | Browse button | The checks under the drop zone, the component's `aria-describedby`, and a form field's hint and errors |
| `aria-hidden`, `tabindex` | Native file input | `"true"` and `-1` |
| `aria-label` | List | The `files` message |
| `aria-label` | Row buttons | The `remove`, `cancel` or `retry` message, with the file's name |
| `aria-describedby` | Retry button | The row's status, "The upload failed." |
| `role`, `aria-label` | Progress bar | `"progressbar"`, the file's name |

What happens is announced through a polite live region: the files added and the ones rejected with their reasons ("2 files added. setup.exe wasn't added. This file type isn't accepted."), each upload that finishes or fails, and each file removed.

When a row goes, focus moves to the row now in its place, the one before it, or the browse button. After a retry, focus moves to the row's cancel button, which takes the retry button's place. After the upload or clear button, focus moves to the browse button.

Dropping files isn't possible from the keyboard, so the browse button does everything the drop zone does.

A click on the caption of a `mona-label` or `mona-form-field` around it, or of a `mona-label` pointing at it with `[for]`, moves focus to the browse button. It doesn't open the dialog.

**Consumer responsibilities**

- Label the component. Put it in a `mona-form-field` or a `<mona-label text="...">`, point a label at it with `[for]`, or set `aria-labelledby` or `aria-label`.
- State checks the component doesn't know, such as a server's own limits, in a hint.

### Keyboard Interaction

| Key | Where | Action |
|---|---|---|
| `Tab` | Anywhere | Moves between the browse button, the row buttons and the upload and clear buttons |
| `Enter` / `Space` | Browse button | Opens the file dialog |
| `Enter` / `Space` | A row button | Removes the file, cancels its upload, or retries it |
