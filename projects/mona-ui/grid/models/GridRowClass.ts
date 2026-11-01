/** The classes a {@link GridRowClass} function adds to a data row. Nullish values add nothing. */
export type GridRowClassValue = string | readonly string[] | null | undefined;

/** Returns the classes to add to the data row that shows the given item. */
export type GridRowClass<TData> = (data: TData) => GridRowClassValue;
