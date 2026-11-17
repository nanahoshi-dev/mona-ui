import { LiveAnnouncer } from "@angular/cdk/a11y";
import { _CdkPrivateStyleLoader, _VisuallyHiddenLoader } from "@angular/cdk/private";
import { inject } from "@angular/core";

/**
 * Injects CDK's `LiveAnnouncer`, and loads the style that hides its live region.
 *
 * The announcer adds a `cdk-visually-hidden` element to the end of `<body>`, but doesn't load that class's rule. CDK's
 * focus trap and `cdkAriaLive` load it, as a side effect. On a page with neither, everything announced shows as text
 * below the page. This loads the rule as they do: once per application, with no global stylesheet, so it works for
 * applications that don't import Mona UI's or CDK's CSS.
 *
 * Use it instead of `inject(LiveAnnouncer)`. Call it in an injection context.
 */
export function injectLiveAnnouncer(): LiveAnnouncer {
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
    return inject(LiveAnnouncer);
}
