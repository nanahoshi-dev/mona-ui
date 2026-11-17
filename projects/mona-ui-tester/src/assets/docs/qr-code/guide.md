## Overview

A QR code lets someone carry a value from a screen or a printout to their phone by pointing the camera at it. Use it for what's tedious to type: a link, a Wi-Fi login, a ticket or a payment.

**Use `QrCodeComponent` when you need to:**

- Hand a link or a short text to a phone, on screen or on paper
- Print codes in labels, tickets or invoices, from an exported PNG, SVG or PDF
- Brand a code with a logo, or draw the Swiss cross of a Swiss QR-bill

**Show the value as text as well when:**

- Someone may not be able to scan, such as a screen reader user or someone on the device the code opens on. A link next to the code serves both.

## Import & Quick Start

```typescript
import { QrCodeComponent } from "@nanahoshi/mona-ui/qr-code";
```

Add `QrCodeComponent` to your standalone component's `imports` array, and give the code a `value` and a name that says what it's for:

```html
<mona-qr-code value="https://nanahoshi.dev/mona-ui" aria-label="QR code for the Mona UI docs" />
```

## Examples

### Logo overlay

`overlay` draws an image over the center, sized by `size` as a share of the code's width, 0.2 by default. The image keeps its aspect ratio. The modules beneath it are cleared rather than covered, so error correction has to make up for them: use `errorCorrection="H"`, which recovers the most. With an overlay, the code is at least version 2, since version 1 has no room for one.

```example
qr-code/logo
```

In development, the component warns when the overlay hides more of some error correction block than it can recover. The check counts every codeword under the cleared square as lost, so a code it warns about may still scan, but one it accepts has the correction to spare. Test the codes you print with the readers your users have.

### Swiss QR code

`{ type: "swiss" }` draws the Swiss cross of a Swiss QR-bill, at 7/46 of the code as the standard sets. The payment data is the `value`, one field a line, as the Swiss Implementation Guidelines lay it out. The component draws the code and the cross; it doesn't check the fields. The standard asks for error correction `"M"`, the default.

```example
qr-code/swiss
```

### Export

`exportQrCode()` resolves to a `Blob` of a PNG image, an SVG document or a PDF page, and `downloadQrCode()` saves one as a file. Get the component through a template reference with `#qrCode="monaQrCode"`, or with `viewChild(QrCodeComponent)`.

```example
qr-code/export
```

| Format | What it is | Notes |
|--------|------------|-------|
| `"svg"` | A standalone vector document | Sharp at any size, for print and design tools. The overlay image is embedded as a data URL, and the accessible name becomes its `<title>`. |
| `"png"` | A raster image `size` pixels wide | Every module is a whole number of pixels, and what's left over widens the quiet zone, so the edges stay sharp. It needs at least one pixel per module. |
| `"pdf"` | One page, `size` CSS pixels wide | Needs the `jspdf` package, which isn't installed with Mona UI. The modules are vector shapes; an overlay image is embedded as a PNG. |

`size` defaults to the code's rendered width. Colors are resolved to what they paint, so `var()` and `currentColor` export as the color you see. An overlay image from another origin has to allow reading with CORS, or the export rejects. Every failure is a `QrCodeExportError` whose `code` says why, such as `"not-ready"` when there's no code to export or `"invalid-size"` for a PNG too small for its modules.

## Appearance & Styling

```example
qr-code/appearance
```

### Size

`size` sets the width and height, quiet zone included. A number is pixels, and a string is any CSS length, such as `"100%"` to fill a container. The host stays square, and it never grows wider than its container, so a fixed size shrinks on a narrow screen instead of overflowing.

### Colors

`color` paints the dark modules and `background` the light ones and the quiet zone. Both take any CSS color, including theme tokens such as `var(--color-foreground)`.

The defaults are black on white in every theme, because readers need dark modules on a light background with strong contrast between them. A light-on-dark code only reads on some readers. `background="transparent"` lets the page show through, which suits a light card but not a dark one.

### Quiet zone

`quietZone` is the light border around the code, in modules. Readers look for 4, the default. Reduce it only where the surroundings are light anyway, such as on a white card with its own padding.

### Custom class

Merge Tailwind or custom classes onto the host with `class`, such as `class="rounded-md shadow-sm"`.

## Behavior

### Encoding and capacity

The component chooses the smallest of the 40 QR code versions that holds the value, from 21 modules a side to 177. It splits the value into numeric, alphanumeric and byte segments where switching modes saves space, so a long run of digits, like an order number, takes less room than the same count of letters.

| `encoding` | Stores | Notes |
|------------|--------|-------|
| `"utf-8"` | Any text | The default. Text with characters outside ASCII starts with an ECI header that tells readers it's UTF-8. ASCII needs no header. |
| `"iso-8859-1"` | Latin-1 only | What readers assume when there's no header. Some older readers don't support ECI; others read every value as UTF-8, so non-ASCII Latin-1 text can come out garbled there. |

A version 40 code holds up to 2,953 bytes, 4,296 alphanumeric characters or 7,089 digits at error correction `"L"`, and less at higher levels. A value it can't hold, or a character the encoding can't store, draws nothing. `error` then says why, and a warning is logged in development.

### Error correction

| `errorCorrection` | Recovers about | Use it for |
|-------------------|----------------|------------|
| `"L"` | 7% | The most data in the smallest code, shown clean on a screen |
| `"M"` | 15% | Most codes. The default. |
| `"Q"` | 25% | Codes that get worn or dirty, such as on packaging |
| `"H"` | 30% | Codes with a logo overlay |

A higher level holds less, so the same value needs a larger code.

### Rendering

The code is SVG: a rectangle for the background and one path for every dark module, drawn with `crispEdges` so modules meet without hairlines. It stays sharp at any zoom and in print, costs a handful of elements whatever the code's size, and scales with its box without being redrawn. There's no canvas mode; the PNG export draws to a canvas when you need a raster image.

### Forced colors

The component opts out of forced colors with `forced-color-adjust: none`, because a code the system recolors may not scan. It keeps the colors you set, which is why the default background is white rather than transparent.

## Forms Integration

The component displays a value rather than editing one, so it isn't a form control. To check a field before its value reaches the code, use `validateQrCodeValue()`, with the same `encoding` and `errorCorrection` as the component. It returns why the value can't be encoded, or `null`, without drawing anything, so it can run on every keystroke in a signal form's `validate()`.

```example
qr-code/validation
```

## Accessibility

The host has `role="img"` while there's a code to show, named by `aria-label`, or by the localized "QR code" when it's empty. The SVG inside is hidden from assistive technology. With nothing to show, the host has neither, so an empty box isn't announced as an image.

Consumer responsibilities:

- Set `aria-label` to say what scanning the code does, such as "QR code for the event page". "QR code" alone doesn't say where it leads.
- Show what the code holds as text or a link nearby, for those who can't scan it.
- Keep strong contrast between `color` and `background`; readers need it more than people do.

<!-- verification-checklist
- [x] Encoder round-trips through an independent decoder across versions 1-40, all levels and all masks
- [x] Codewords match the standard's annex I example and format and version bits match its tables
- [x] Inputs, defaults and the error signal verified against source
- [x] role="img" and aria-label are removed while nothing is drawn
- [x] The SVG is aria-hidden; the exported SVG carries the name as its title
- [x] forced-color-adjust: none keeps the configured colors
- [x] Exports resolve CSS colors and fail with QrCodeExportError codes
-->
