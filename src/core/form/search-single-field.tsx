import * as React from "react";
import {
  Autocomplete,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import AddCircleOutlineRounded from "@mui/icons-material/AddCircleOutlineRounded";
import type { FormContext } from "./types";

type Size = "small" | "medium";

export type SearchSingleFieldProps<T> = {
  name: string;
  label?: string;
  placeholder?: string;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;

  selectedIds?: Array<string | number>;
  onIdsChange?: (nextIds: Array<string | number>) => void;

  value?: any;
  onChange?: (next: any, nextObj: any) => void;
  onSelect?: (item: any) => void;
  onBlur?: (text: string, matched: T | null, ctx?: FormContext | null) => void;
  onInputChange?: (text: string) => void;

  search: (keyword: string) => Promise<T[]>;
  searchPage?: (keyword: string, page: number, limit: number) => Promise<T[]>;

  fetchList?: (values: Record<string, any>) => Promise<T[]>;
  hydrateByIds?: (ids: Array<string | number>, values: Record<string, any>) => Promise<T[]>;

  onAdd?: (item: T) => Promise<void> | void;
  onDelete?: (item: T) => Promise<void> | void;

  getOptionLabel: (item: T) => string;
  getOptionValue: (item: T) => string | number;

  renderItem?: (item: T, index: number) => React.ReactNode;

  allowDuplicate?: boolean;
  dedupeFn?: (a: T, b: T) => boolean;
  maxItems?: number;
  disableDelete?: (item: T) => boolean;

  onOpenCreate?: () => Promise<unknown> | void;
  values: Record<string, any>;
  refreshKey?: any;
  autoLoadAllOnMount?: boolean;

  fetchDeps?: any[];
  pageLimit?: number;
  ctx?: FormContext | null;
};

function makeEquality<T>(
  getOptionValue: (t: T) => string | number,
  dedupeFn?: (a: T, b: T) => boolean
) {
  if (dedupeFn) return dedupeFn;
  return (a: T, b: T) => getOptionValue(a) === getOptionValue(b);
}

const sameIds = (a: Array<string | number>, b: Array<string | number>) =>
  a.length === b.length && a.every((x, i) => String(x) === String(b[i]));

export default function SearchSingleField<T>(props: SearchSingleFieldProps<T>) {
  const {
    name,
    label,
    placeholder,
    size = "small",
    fullWidth = true,
    disabled,
    error,
    helperText,

    selectedIds,
    onIdsChange,
    onChange,
    onSelect,
    onBlur,
    onInputChange,

    search,
    searchPage,
    fetchList,
    hydrateByIds,

    onAdd,

    getOptionLabel,
    getOptionValue,
    allowDuplicate = false,
    dedupeFn,
    maxItems,
    onOpenCreate,
    values,
    refreshKey,
    autoLoadAllOnMount = false,
    fetchDeps,
    pageLimit = 20,
    ctx,
  } = props;

  const isControlledByIds = Array.isArray(selectedIds) && typeof onIdsChange === "function";

  const [items, setItems] = React.useState<T[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [keyword, setKeyword] = React.useState("");

  const [options, setOptions] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);

  const deriveIds = React.useCallback(
    (arr: T[]) => arr.map((x) => getOptionValue(x)),
    [getOptionValue]
  );

  const internalUpdateRef = React.useRef(false);
  const isTypingRef = React.useRef(false);

  const lastEmittedIdsRef = React.useRef<Array<string | number>>([]);
  const emitIdsIfChanged = React.useCallback(
    (arr: T[]) => {
      const ids = deriveIds(arr);
      if (!sameIds(ids, lastEmittedIdsRef.current)) {
        lastEmittedIdsRef.current = ids;
        if (onIdsChange) onIdsChange(ids);
        else if (onChange) onChange(ids as any, arr);
      }
    },
    [deriveIds, onIdsChange, onChange]
  );

  // -----------------------------
  // Controlled by IDs
  // -----------------------------
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isControlledByIds || !selectedIds || !hydrateByIds) return;

      const hydrated = await hydrateByIds(selectedIds, values);
      if (cancelled) return;

      const order = new Map(selectedIds.map((id, i) => [String(id), i]));
      const sorted = [...hydrated].sort((a, b) => {
        const ia = order.get(String(getOptionValue(a))) ?? 0;
        const ib = order.get(String(getOptionValue(b))) ?? 0;
        return ia - ib;
      });
      setItems(sorted);
      lastEmittedIdsRef.current = selectedIds.map(String);
      if (sorted[0]) {
        setInputValue(getOptionLabel(sorted[0]!));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isControlledByIds, selectedIds, hydrateByIds, values, getOptionLabel, getOptionValue]);

  // -----------------------------
  // Uncontrolled fetchList
  // -----------------------------
  const defaultFetchKey = values && "id" in values ? (values as any).id : "__NO_ID__";
  const depsForFetch = fetchDeps ?? [defaultFetchKey, isControlledByIds, fetchList, values[name]];

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isControlledByIds || !fetchList) return;

      if (internalUpdateRef.current) {
        internalUpdateRef.current = false;
        return;
      }

      const data = await fetchList(values);
      if (!cancelled) {
        setItems(data ?? []);
        emitIdsIfChanged(data ?? []);

        if (data?.[0]) {
          if (!isTypingRef.current) {
            setInputValue(getOptionLabel(data[0]));
          }
        }
        isTypingRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, depsForFetch);

  // -----------------------------
  // refreshKey → refetch
  // -----------------------------
  const doFetchList = React.useCallback(async () => {
    if (!fetchList) return;

    const data = await fetchList(values);
    setItems(data ?? []);
    emitIdsIfChanged(data ?? []);

    if (data?.[0]) setInputValue(getOptionLabel(data[0]));
    else setInputValue("");
  }, [fetchList, values, emitIdsIfChanged, getOptionLabel]);

  React.useEffect(() => {
    if (refreshKey === undefined) return;
    doFetchList().catch(() => void 0);
  }, [refreshKey, doFetchList]);

  // -----------------------------
  // search paging
  // -----------------------------
  const eq = React.useMemo(() => makeEquality(getOptionValue, dedupeFn), [getOptionValue, dedupeFn]);

  const filterOutSelected = React.useCallback(
    (arr: T[]) => {
      return arr;
    },
    [allowDuplicate, items, eq]
  );

  const dedupById = React.useCallback(
    (arr: T[]) => {
      const seen = new Set<string>();
      const out: T[] = [];
      for (const it of arr) {
        const key = String(getOptionValue(it));
        if (!seen.has(key)) {
          seen.add(key);
          out.push(it);
        }
      }
      return out;
    },
    [getOptionValue]
  );

  const loadFirstPage = React.useCallback(
    async (kw: string) => {
      setLoading(true);
      setPage(1);
      try {
        if (searchPage) {
          const data = await searchPage(kw, 1, pageLimit);
          const filtered = filterOutSelected(data ?? []);
          setOptions(filtered);
          setHasMore((data?.length ?? 0) >= pageLimit);
        } else {
          const data = await search(kw);
          const filtered = filterOutSelected(data ?? []);
          setOptions(filtered);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [searchPage, pageLimit, filterOutSelected, search]
  );

  const loadNextPage = React.useCallback(async () => {
    if (!searchPage || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await searchPage(keyword, nextPage, pageLimit);
      const filtered = filterOutSelected(data ?? []);
      setOptions((prev) => dedupById([...prev, ...filtered]));
      setPage(nextPage);
      setHasMore((data?.length ?? 0) >= pageLimit);
    } finally {
      setLoadingMore(false);
    }
  }, [searchPage, loadingMore, hasMore, page, keyword, pageLimit, filterOutSelected, dedupById]);

  React.useEffect(() => {
    if (autoLoadAllOnMount) {
      loadFirstPage("").catch(() => void 0);
    }
  }, [autoLoadAllOnMount, loadFirstPage]);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const setItemsAndEmit = React.useCallback(
    (next: T[]) => {
      setItems(next);
      emitIdsIfChanged(next);
    },
    [emitIdsIfChanged]
  );

  // -----------------------------
  // SingleChoice logic — sync temp item
  // -----------------------------
  const ensureTempItem = React.useCallback(
    (_: string) => {
      const temp: any = { __temp: true }; // minimal temp item
      setItemsAndEmit([temp as T]);
    },
    [setItemsAndEmit]
  );

  const showLabel = React.useCallback(
    (item: T | null) => {
      if (!item) return "";
      if ((item as any).__temp) return inputValue;
      return getOptionLabel(item);
    },
    [getOptionLabel, inputValue]
  );

  const showValue = React.useCallback(
    (item: T | null) => {
      if (!item) return "";
      if ((item as any).__temp) return inputValue;
      return getOptionValue(item);
    },
    [getOptionValue, inputValue]
  );

  const handleInputChange = React.useCallback(
    (_: any, v: string, reason: string) => {
      isTypingRef.current = true;
      internalUpdateRef.current = true;

      setInputValue(v);
      setKeyword(v);

      if (onInputChange) {
        onInputChange(v);
      }

      if (v === "") {
        setItemsAndEmit([]);
      } else {
        ensureTempItem(v);
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (v === "" || reason === "clear") {
        loadFirstPage("").catch(() => void 0);
        return;
      }

      debounceRef.current = setTimeout(() => {
        loadFirstPage(v).catch(() => void 0);
      }, 300);
    },
    [loadFirstPage, ensureTempItem, setItemsAndEmit, onInputChange]
  );

  // -----------------------------
  // Add/remove logic
  // -----------------------------
  const reloadAfterSelect = React.useCallback(() => {
    loadFirstPage("").catch(() => void 0);
  }, [loadFirstPage]);

  const addItem = React.useCallback(
    async (item: T) => {
      if (onAdd) await onAdd(item);
      setItemsAndEmit([item]);
      setInputValue(getOptionLabel(item));
      reloadAfterSelect();
      return;
    },
    [
      items,
      eq,
      onAdd,
      allowDuplicate,
      maxItems,
      setItemsAndEmit,
      reloadAfterSelect,
      getOptionLabel,
    ]
  );

  const handleOpenCreate = React.useCallback(async () => {
    if (!onOpenCreate) return;
    await onOpenCreate();
    await doFetchList();
    loadFirstPage(keyword).catch(() => void 0);
  }, [onOpenCreate, doFetchList, loadFirstPage, keyword]);

  const listboxProps = React.useMemo(
    () => ({
      onScroll: (e: React.UIEvent<HTMLUListElement>) => {
        const el = e.currentTarget;
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 32;
        if (nearBottom) loadNextPage();
      },
    }),
    [loadNextPage]
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <FormControl error={!!error} fullWidth={fullWidth} disabled={disabled}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Autocomplete
            sx={{ flex: 1 }}
            options={options}
            loading={loading || loadingMore}
            value={(items[0] ?? null)}
            getOptionLabel={(o) => showLabel(o as T)}
            isOptionEqualToValue={(a, b) => showValue(a as T) === showValue(b as T)}
            onOpen={() => {
              loadFirstPage("").catch(() => void 0);
            }}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            filterOptions={(opts) => filterOutSelected(opts as T[])}
            ListboxProps={listboxProps}
            onChange={async (_e, newVal) => {
              if (newVal) {
                internalUpdateRef.current = true;

                const label = getOptionLabel(newVal);
                await addItem(newVal as T);
                setInputValue(label);
                onSelect?.(newVal as T);
                return;
              }

              const input = inputValue.trim();
              if (onOpenCreate) {
                const matched = options.some((o) => getOptionLabel(o) === input);
                if (!matched) {
                  setInputValue("");
                  onSelect?.(null);
                }
              }
            }}

            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                size={size}
                onBlur={() => {
                  const text = inputValue.trim();
                  const matched =
                    options.find((o) => getOptionLabel(o) === text) ?? null;

                  onBlur?.(text, matched, ctx);

                  if (onOpenCreate && !matched) {
                    setInputValue("");
                    onSelect?.(null);
                  }
                }}


                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading || loadingMore ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {onOpenCreate && (
            <Tooltip title="Tạo mới">
              <span>
                <IconButton
                  color="primary"
                  onClick={handleOpenCreate}
                  size={size === "medium" ? "medium" : "small"}
                >
                  <AddCircleOutlineRounded />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>

        {error ? (
          <FormHelperText>{error}</FormHelperText>
        ) : helperText ? (
          <FormHelperText>{helperText}</FormHelperText>
        ) : null}
      </Stack>
    </FormControl>
  );
}
