import { useMemo, useState, useEffect, useRef } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
} from "@mui/material";
import type { SearchModel } from "@core/search/search.model";
import { getSearchRenderer } from "@core/search/search-renderer";
import { search } from "@core/search/search.api";
import { LABELS } from "./search-utils";

type SearchBoxProps = {
  placeholder?: string;
  autoFocus?: boolean;
  minChars?: number;
  debounceMs?: number;
  onSelect?: (item: SearchModel) => void;
  fullWidth?: boolean;
};

export default function SearchBox({
  placeholder = "Tìm kiếm…",
  autoFocus,
  minChars = 2,
  debounceMs = 300,
  onSelect,
  fullWidth = true,
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const reqCounter = useRef(0);
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < minChars) {
      setOptions([]);
      setLoading(false);
      return;
    }
    let isActive = true;
    const cur = ++reqCounter.current;

    setLoading(true);
    search(debouncedQuery.trim())
      .then((rs) => {
        if (!isActive || cur !== reqCounter.current) return;
        setOptions(rs.items ?? []);
      })
      .catch(() => {
        if (!isActive) return;
        setOptions([]);
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [debouncedQuery, minChars]);

  const highlight = useMemo(() => makeHighlighter(debouncedQuery), [debouncedQuery]);

  return (
    <Autocomplete<SearchModel, false, false, false>
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      filterOptions={(x) => x}
      getOptionLabel={(o) => o?.title ?? ""}
      isOptionEqualToValue={(a, b) => a.entityType === b.entityType && a.entityId === b.entityId}
      groupBy={(o) => LABELS[o.entityType]}
      onChange={(_e, val) => val && onSelect?.(val)}
      renderOption={(props, option) => {
        const renderer =
          getSearchRenderer(option.entityType) || getSearchRenderer("__default__")!;
        return (
          <li {...props} key={`${option.entityType}:${option.entityId}`}>
            {renderer(option, { q: debouncedQuery, highlight })}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          autoFocus={autoFocus}
          fullWidth={fullWidth}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={
        query.trim().length < minChars
          ? `Nhập ít nhất ${minChars} ký tự`
          : "Không có kết quả"
      }
    />
  );
}

function useDebounce<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function removeAccents(str: string) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function makeHighlighter(q: string) {
  if (!q) return (text: string) => text ?? "";

  const qNorm = removeAccents(q.toLowerCase());

  return (text: string) => {
    if (!text) return "";

    const raw = text;
    const norm = removeAccents(text).toLowerCase();

    const idx = norm.indexOf(qNorm);
    if (idx < 0) return raw;

    const before = raw.slice(0, idx);
    const match = raw.slice(idx, idx + qNorm.length);
    const after = raw.slice(idx + qNorm.length);

    return (
      <>
        {before}
        <mark>{match}</mark>
        {after}
      </>
    );
  };
}