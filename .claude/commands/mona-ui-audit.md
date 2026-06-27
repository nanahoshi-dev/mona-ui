---
description: Audit a Mona UI component for production readiness. Use when the user invokes /mona-ui-audit with a component name (e.g. /mona-ui-audit button, /mona-ui-audit checkbox, /mona-ui-audit date-picker). Also use when the user asks to audit, review, or assess production readiness of any component in the mona-ui library.
---

You are working in the `mona-ui` repository.

Your task is to perform a production-readiness audit of the requested Mona UI component or component family.

Target library:

* Package: `@mirei/mona-ui`
* Framework: Angular 22
* Component library source: `projects/mona-ui/src/lib`
* Demo/tester app: `projects/mona-ui-tester/src/app`
* Public package surface: `projects/mona-ui/src/lib/index.ts`, re-exported by `projects/mona-ui/src/public-api.ts`
* Generated component metadata: `projects/mona-ui-tester/src/assets/component-metadata.json`

Component to audit:
`$ARGUMENTS`

Examples:

* `button`
* `checkbox`
* `dropdown-list`
* `date-picker`
* `grid`

---

## Step 1: Load Audit Framework

Before doing anything else, read the audit framework:

```
.ai/component-audit.md
```

This file defines the audit role, severity rules, evaluation pillars, false-positive guardrails, and the required output format. You must follow it exactly.

---

## Step 2: Locate Component Files

Component source files live under:

```
projects/mona-ui/src/lib/<category>/<component-name>/
```

Common category directories include: `buttons`, `inputs`, `layout`, `navigation`, `overlays`, `data`, `feedback`, `indicators`.

For the requested component, locate and read all relevant files:

* Primary component or directive `.ts`
* Template `.html` (if external)
* Style or CVA variant file (e.g. `*.styles.ts`, `*.variants.ts`)
* Supporting directives (`.directive.ts`)
* Supporting services (`.service.ts`)
* Models and types (`.models.ts`, `*.types.ts`)
* Unit tests (`.spec.ts`)
* Public exports: check `projects/mona-ui/src/lib/index.ts` for what is exported

If the argument names multiple components (e.g. `date-picker`, `datetime-picker`, `time-picker`), locate files for each.

---

## Step 3: Gather Supporting Evidence

Also inspect:

* Tester app demo for the component: `projects/mona-ui-tester/src/app/demo/components/<component-name>/`
* Existing docs for the component: `projects/mona-ui-tester/src/assets/docs/<component-name>/`
* `projects/mona-ui-tester/src/assets/component-metadata.json` — for the component's metadata entry

Use these to understand claimed behavior, documented API, and example usage. Do not invent behavior that is not evidenced in the source or metadata.

---

## Step 4: Run the Audit

Apply the audit framework loaded in Step 1 to all files gathered in Steps 2–3.

Produce the full structured audit report in the exact Markdown format required by the framework:

```
# Production Readiness Audit: <ComponentName>

## Component Classification
## Verdict
## 🚨 Critical Issues
## ⚠️ Should Fix
## 🧹 Nice to Have
## ✅ Good Practices Found
## 🧪 Missing or Weak Test Coverage
## 📚 Documentation / Metadata Gaps
## 🚫 Not Applicable
## Final Recommendation
```

---

## Hard Rules

* Do not implement fixes. Report findings only.
* Do not invent evidence. If a file is not found, state what could not be verified.
* Do not require features that are out of scope for the component's classification.
* If the component is already good for its intended scope, say so clearly.
* Follow all severity rules and false-positive guardrails from the audit framework exactly.
