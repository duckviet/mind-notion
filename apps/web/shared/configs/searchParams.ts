export enum SearchParamsKeys {
  SORT = "sort",
}

export type SearchParamsKeysType = Record<
  keyof typeof SearchParamsKeys,
  string
>;
