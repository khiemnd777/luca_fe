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
  // Field basics
  name: string;
  label?: string;
  placeholder?: string;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;

  /** Controlled mode */
  selectedId?: string | number | null;
  onChange?: (value: string | number | null, obj: T | null) => void;

  /** Events */
  onSelect?: (item: T | null) => void;
  onBlur?: (input: string, matched: T | null, ctx?: FormContext | null) => void;
  onInputChange?: (text: string) => void;

  /** Data fetchers */
  search: (keyword: string) => Promise<T[]>;
  searchPage?: (keyword: string, page: number, limit: number) => Promise<T[]>;
  fetchOne?: (values: Record<string, any>) => Promise<T | null>;
  hydrateById?: (id: string | number, values: Record<string, any>) => Promise<T | null>;

  /** Create */
  onOpenCreate?: () => Promise<void> | void;

  /** Rendering */
  getOptionLabel: (item: T, items?: T[]) => string;
  getOptionValue: (item: T) => string | number;
  getInputLabel?: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;

  /** Paging */
  autoLoadAllOnMount?: boolean;
  pageLimit?: number;

  values: Record<string, any>;
  refreshKey?: any;
  ctx?: FormContext | null;
};

/* ============================================================
   HELPERS
============================================================ */
const useDebounce = () => {
  const ref = React.useRef<any>(null);
  return (fn: () => void, ms = 300) => {
    clearTimeout(ref.current);
    ref.current = setTimeout(fn, ms);
  };
};

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function SearchSingleField<T>(props: SearchSingleFieldProps<T>) {
  const {
    label,
    placeholder,
    size = "small",
    fullWidth = true,
    disabled,
    error,
    helperText,

    selectedId,
    onChange,
    onSelect,
    onBlur,
    onInputChange,

    search,
    searchPage,
    fetchOne,
    hydrateById,

    onOpenCreate,

    getOptionLabel,
    getOptionValue,
    renderItem,

    values,
    refreshKey,

    autoLoadAllOnMount = false,
    pageLimit = 20,
    ctx,
  } = props;

  /* ======================================================
     INTERNAL STATE
  ====================================================== */
  const [value, setValue] = React.useState<T | null>(null);
  const [options, setOptions] = React.useState<T[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [keyword, setKeyword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [cachedOptions, setCachedOptions] = React.useState<T[]>([]);

  const debounce = useDebounce();

  /* ======================================================
     Controlled mode → hydrateById
  ====================================================== */
  const valuesRef = React.useRef(values);
  React.useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  React.useEffect(() => {
    if (selectedId == null) {
      setValue(null);
      setInputValue("");
      return;
    }

    if (!hydrateById) return;

    let cancelled = false;

    (async () => {
      const obj = await hydrateById(selectedId, valuesRef.current);
      if (cancelled) return;
      setValue(obj);
      setInputValue(obj ? getOptionLabel(obj) : "");
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId, hydrateById, getOptionLabel]);

  /* ======================================================
     FetchOne (initial)
  ====================================================== */
  React.useEffect(() => {
    if (!fetchOne) return;
    let cancelled = false;

    (async () => {
      const obj = await fetchOne(valuesRef.current);
      if (cancelled) return;
      if (obj) {
        setValue(obj);
        setInputValue(getOptionLabel(obj));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchOne, getOptionLabel]);

  /* ======================================================
     Cache options
  ====================================================== */
  React.useEffect(() => {
    if (options.length > 0) {
      setCachedOptions(options);
    }
  }, [options]);

  /* ======================================================
     Paging search
  ====================================================== */
  const loadFirstPage = React.useCallback(
    async (kw: string) => {
      setLoading(true);
      setPage(1);
      try {
        if (searchPage) {
          const data = await searchPage(kw, 1, pageLimit);
          setOptions(data ?? []);
          setHasMore((data?.length ?? 0) >= pageLimit);
        } else {
          const data = await search(kw);
          setOptions(data ?? []);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [search, searchPage, pageLimit]
  );

  const loadNextPage = React.useCallback(async () => {
    if (!searchPage || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await searchPage(keyword, next, pageLimit);
      setOptions((prev) => [...prev, ...(data ?? [])]);
      setPage(next);
      setHasMore((data?.length ?? 0) >= pageLimit);
    } finally {
      setLoadingMore(false);
    }
  }, [searchPage, keyword, page, pageLimit, loadingMore, hasMore]);

  /* ======================================================
     AutoLoad options on mount
  ====================================================== */
  React.useEffect(() => {
    if (autoLoadAllOnMount) loadFirstPage("");
  }, [autoLoadAllOnMount]);

  /* ======================================================
     refreshKey → fetchOne again
  ====================================================== */
  React.useEffect(() => {
    if (!refreshKey || !fetchOne) return;

    (async () => {
      const obj = await fetchOne(values);
      setValue(obj ?? null);
      setInputValue(obj ? getOptionLabel(obj, options) : "");
    })();
  }, [refreshKey]);

  /* ======================================================
     Input change
  ====================================================== */
  const handleInput = (_: any, text: string, reason: string) => {
    const v = text;
    setInputValue(v);
    setKeyword(v);

    onInputChange?.(v);

    if (v === "" || reason === "clear") {
      debounce(() => loadFirstPage(""), 0);
      return;
    }

    debounce(() => loadFirstPage(v), 300);
  };

  /* ======================================================
     Select option
  ====================================================== */
  const handleSelect = async (obj: T | null) => {
    setValue(obj);
    setInputValue(obj ? getOptionLabel(obj, options) : "");

    const val = obj ? getOptionValue(obj) : null;
    onChange?.(val, obj);
    onSelect?.(obj);
  };

  /* ======================================================
     Render
  ====================================================== */
  const listboxProps = {
    onScroll: (e: React.UIEvent<HTMLUListElement>) => {
      const el = e.currentTarget;
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 32;
      if (nearBottom) loadNextPage();
    },
  };

  const getRawLabel = React.useCallback(
    (o: T) => (props.getInputLabel ? props.getInputLabel(o) : getOptionLabel(o, options)),
    [props.getInputLabel, getOptionLabel]
  );

  return (
    <FormControl fullWidth={fullWidth} disabled={disabled} error={!!error}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Autocomplete
            sx={{ flex: 1 }}
            options={options}
            loading={loading || loadingMore}
            value={value}
            getOptionLabel={(o) => (o ? getOptionLabel(o as T, options) : "")}
            isOptionEqualToValue={(a, b) =>
              getOptionValue(a as T) === getOptionValue(b as T)
            }
            inputValue={inputValue}
            onInputChange={handleInput}
            ListboxProps={listboxProps}
            renderOption={(props, opt) => {
              return (
                <li {...props} key={getOptionValue(opt as T)}>
                  {renderItem ? renderItem(opt as T) : getOptionLabel(opt as T, options)}
                </li>
              );
            }}
            onChange={(_, newVal) => handleSelect(newVal as T)}
            onOpen={() => loadFirstPage("")}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                size={size}
                onBlur={() => {
                  const t = inputValue.trim();
                  const sourceOptions = (options.length > 0 ? options : cachedOptions).slice().reverse();

                  const matched =
                    sourceOptions.find((o) => {
                      const raw = getRawLabel(o)?.trim();
                      if (!raw) return false;
                      return t.includes(raw);
                    }) ?? null;

                  onBlur?.(t, matched, ctx);

                  if (!matched) {
                    return;
                  }

                  handleSelect(matched);
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
                <IconButton color="primary" onClick={onOpenCreate} size={size}>
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
