# Mona UI Patch Stores & Merge Utilities

`@nanahoshi/mona-ui/common` exports two signal-based stores for editing data without touching the source: `ObjectPatchStore` for one object (a form) and `IterablePatchStore` for a list of items (rows of a grid). Both keep your edits as a minimal *draft* on top of a read-only *base* signal, and expose the merged result as a signal.

---

## 1. Core Model

- **Base:** the authoritative value, read from the `source` signal you pass in. The store never writes to it.
- **Draft:** only the fields that differ from the base. A field patched back to its base value drops out of the draft.
- **View:** the base with the draft applied. This is what your template renders.
- **Committed snapshot:** the draft as of the last `commit()`. `pristine` is `true` while the draft matches it.

Drafts hold final values:

- A field patched to `undefined` is cleared. Pass `{ undefinedValues: "skip" }` as the patch options to ignore `undefined` instead.
- Arrays in a draft replace the base array. An array strategy (`concat`, `unionBy`) is applied once, when the patch is made, against the current view.
- Only plain objects (object literals, `JSON.parse` output) are merged key by key. A class instance, `Date`, `Map` or `Set` in a patch replaces the value as a whole.

---

## 2. `ObjectPatchStore`

```typescript
import { signal } from '@angular/core';
import { createObjectPatchStore } from '@nanahoshi/mona-ui/common';

interface Customer {
    address: { city: string; zip: string };
    name: string;
    note?: string;
    tags: string[];
}

const customer = signal<Customer>({ address: { city: 'Paris', zip: '75001' }, name: 'Ada', tags: ['vip'] });
const store = createObjectPatchStore({ source: () => customer });

store.patch({ address: { city: 'Lyon' } });
store.changes(); // { address: { city: 'Lyon' } }
store.view();    // { address: { city: 'Lyon', zip: '75001' }, name: 'Ada', tags: ['vip'] }

store.patchPath(['tags', 0], 'gold'); // sets one array element
store.commit();                        // pristine() === true
store.clear();                         // drop the draft, back to the base
```

| Member | Description |
|---|---|
| `view` | Signal of the base with the draft applied. |
| `changes` | Signal of the draft, or `undefined` when there is none. |
| `pristine` | Signal: `true` when the draft equals the committed snapshot. |
| `patch(patch, options?)` | Merges a partial value into the draft and prunes fields that equal the base. |
| `patchPath(path, value, options?)` / `setPath` | Sets one typed path, such as `['address', 'city']` or `['tags', 0]`. |
| `select(projector, equal?)` | A signal of one slice of `view` that only emits when the slice changes (by `deepEquals`). |
| `commit()` / `getCommitted()` | Saves or reads the committed snapshot. |
| `clear()` / `reset()` | Drops the draft, or the draft and the committed snapshot. |
| `setDraft(patch)` / `hasDraft()` | Replaces the draft without pruning, or tells whether a draft exists. |

---

## 3. `IterablePatchStore`

Items are matched by the stable id that `idOf` returns, so under the `preserve` and `rebase` strategies a draft follows its item when the base is reloaded, reordered or filtered.

```typescript
import { createIterablePatchStore } from '@nanahoshi/mona-ui/common';

const rows = signal<Order[]>(loadOrders());
const store = createIterablePatchStore<Order, number>({ idOf: order => order.id, source: () => rows });

store.patch(42, { status: 'shipped' });
store.patchMany([[7, { qty: 3 }], [8, { qty: 1 }]]);
store.changes();     // the edited orders, merged
store.dirtyCount();  // 3
```

It has the same members as `ObjectPatchStore`, taking the item id first, plus `patchMany`, `clearAll` and `dirtyCount`. `view` returns base items without a draft as they are, and reuses each merged item until its base item or draft changes, so `track` by identity stays stable.

---

## 4. Options

| Option | Store | Description |
|---|---|---|
| `source` | both | Factory returning the base signal. |
| `idOf` | iterable | Returns an item's stable id. |
| `initial` | both | Factory for an initial draft (a partial object, or a `Map`/`ImmutableDictionary` of id → partial item), such as restored form state. It is called once, and the store starts pristine with it. |
| `mergeOptions` | both | Default `DeepMergeOptions` for every patch; a call's own `options` replace them. |
| `baseChangeStrategy` | both | What happens to the draft when the base signal emits (below). Defaults to `"wipe"`. |

### Base Change Strategies

| Strategy | Draft after the base changes | Use when |
|---|---|---|
| `wipe` | Discarded. | The base only changes after you commit and save (the default). |
| `preserve` | Kept as it is and applied over the new base. | Base updates are unrelated to the edits, such as a live price column. |
| `rebase` | Pruned against the new base: fields the new base already has drop out, and drafts for items that left the base are discarded. | Polling, where the server may have accepted some of the changes. |

---

## 5. Merge Utilities

The stores are built on helpers that are exported too.

| Function | Description |
|---|---|
| `deepMerge(base, patch, options?)` | Returns a merged copy of `base`. Plain objects merge key by key; anything else in the patch replaces. `undefined` values are skipped unless `undefinedValues: "assign"`. `__proto__` keys are ignored. |
| `prunePatch(base, patch)` | Returns the part of `patch` that differs from `base`, or `undefined`. |
| `deepEquals(a, b)` | Structural equality for plain objects, arrays, `Date`, `RegExp`, `Map` and `Set`. `NaN` equals `NaN`, dates compare by time, map keys and set members compare by `SameValueZero`, and cyclic values are supported. |
| `setAt(obj, path, value)` / `patchAt(path, value, current?)` / `buildNested(keys, leaf, current?)` | Set a value at a typed path. When the current value is given, arrays along the path are copied with the one element replaced. |

### Array Strategies

`DeepMergeOptions.arrayStrategy` is a strategy, or a function `(key, path) => strategy` that picks one per array:

- `{ kind: "replace" }` (the default): the patch array replaces the base array.
- `{ kind: "concat" }`: the patch array is appended.
- `{ kind: "unionBy", key }`: a patch item is merged into the base item with the same key (a field name, or several for a composite key). Key values keep their type, so `1` and `"1"` are different keys. Items without a key are kept as they are, and new items are appended.
