export type SelectableOptions =
    | {
          checkboxes?: boolean;
          enabled?: boolean;
          mode: "single";
          toggleable?: boolean;
      }
    | {
          checkboxes?: boolean;
          enabled?: boolean;
          mode: "multiple";
      };
