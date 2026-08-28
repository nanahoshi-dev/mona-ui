# OTP Input

The Mona UI **OTP Input** (`mona-otp-input`) component provides a segmented, accessible interface for capturing one-time passwords, verification codes, PINs, and multi-factor authentication tokens.

Built on top of a single real native `<input>` element with styled visual presentation slots, the component delivers keyboard navigation, mobile keyboard optimization, one-time-code autofill, clipboard paste sanitization, and seamless integration with Angular Signal Forms.

### Key Features

- **Single Accessible Control**: Implements accessible verification input semantics without fragmenting focus across multiple DOM inputs.
- **Multiple Input Types**: Supports numeric (`number`), alphanumeric (`text`), and masked (`password`) inputs.
- **Custom Character Patterns**: Allows regex character filtering for specialized token formats (e.g. hex tokens).
- **Flexible Grouping & Separators**: Supports uniform group counts, unequal grouping arrays, string separators, and projected separator templates.
- **Visual Styles**: Offers spaced (`spacing="true"`) or joined (`spacing="false"`) slot appearances with customizable sizes and corner rounding.
- **Angular Signal Forms**: Implements `FormValueControl<string>` for binding to signal form fields with automatic validation, disabled, readonly, and touched propagation.
- **Autofill & Mobile Ready**: Defaults to `autocomplete="one-time-code"` with numeric keypad hints on mobile devices.
