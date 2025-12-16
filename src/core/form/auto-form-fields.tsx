import * as React from "react";
import {
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Checkbox,
  Switch as MuiSwitch,
  Chip,
  Button,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Autocomplete } from "@mui/material";
import dayjs from "dayjs";

import type { FieldDef, FormContext, Option } from "@core/form/types";
import { CurrencyField } from "@core/form/currency-field";
import { ImageUploadField, type ImageUploadList, type ImageUploadValue } from "./image-upload-field";
import PasswordField from "@core/form/password-field";
import SearchListField from "@core/form/search-list-field";
import type { GroupConfig } from "./form.types";
import { humanize } from "@root/shared/utils/string.utils";
import { mapIdFieldToNameField } from "@root/shared/utils/relation.utils";
import SearchSingleField from "./search-single-field";


// -----------------------------------------------------------
// Helper: map options → Map
// -----------------------------------------------------------
function toMap(options?: Option[]) {
  const map = new Map<any, Option>();
  (options ?? []).forEach((o) => map.set(o.value, o));
  return map;
}

function renderAsText(f: FieldDef, values: Record<string, any>) {
  const v = values[f.name];

  // null / empty
  if (v === null || v === undefined || v === "") return <Typography>—</Typography>;

  // SELECT
  if (f.kind === "select" && !f.multiple) {
    const opt = (f.options ?? []).find(o => o.value === v);
    return <Typography>{opt?.label ?? String(v)}</Typography>;
  }

  // MULTISELECT
  if (f.kind === "multiselect" || (f.kind === "select" && f.multiple)) {
    const arr: any[] = Array.isArray(v) ? v : [];
    if (arr.length === 0) return <Typography>—</Typography>;

    const labels = arr.map(x => {
      const opt = (f.options ?? []).find(o => o.value === x);
      return opt?.label ?? String(x);
    });

    return <Typography>{labels.join(", ")}</Typography>;
  }

  // SEARCHSINGLE
  if (f.kind === "searchsingle") {
    const nameValue = f.altName ? values[f.altName] : null;
    return <Typography>{nameValue ?? String(v)}</Typography>;
  }

  // SEARCHLIST
  if (f.kind === "searchlist") {
    const arr: any[] = Array.isArray(v) ? v : [];
    if (arr.length === 0) return <Typography>—</Typography>;
    return <Typography>{arr.join(", ")}</Typography>;
  }

  // DATE / DATETIME
  if (f.kind === "date" || f.kind === "datetime") {
    return <Typography>{String(v)}</Typography>;
  }

  // CURRENCY
  if (f.kind === "currency" || f.kind === "currency-equation") {
    return <Typography>{Number(v).toLocaleString()}</Typography>;
  }

  // SWITCH / CHECKBOX
  if (f.kind === "checkbox" || f.kind === "switch") {
    return <Typography>{v ? "Có" : "Không"}</Typography>;
  }

  // IMAGEUPLOAD / FILEUPLOAD
  if (f.kind === "imageupload") {
    return <Typography>{Array.isArray(v) ? `${v.length} hình` : "—"}</Typography>;
  }
  if (f.kind === "fileupload") {
    return <Typography>{Array.isArray(v) ? `${v.length} file` : "—"}</Typography>;
  }

  // DEFAULT
  return <Typography>{String(v)}</Typography>;
}

function resolveRelationMirrors(fieldName: string) {
  // fieldName:
  // - "relationFields.supplier"
  // - "product.relationFields.supplier"
  const parts = fieldName.split(".");
  const idx = parts.indexOf("relationFields");
  if (idx === -1 || idx === parts.length - 1) {
    return null;
  }

  const prefix = parts.slice(0, idx);      // [] hoặc ["product"]
  const relField = parts[idx + 1];         // "supplier"

  const root = [...prefix, relField].join(".");               // "supplier" hoặc "product.supplier"
  const cf = [...prefix, "customFields", relField].join("."); // "customFields.supplier" hoặc "product.customFields.supplier"

  return { root, cf };
}



// -----------------------------------------------------------
// Render SINGLE FIELD — nguyên gốc logic cũ của bạn
// -----------------------------------------------------------
export function AutoFormFieldSingle({
  field: f,
  values,
  setValue,
  error,
  ctx,
}: {
  field: FieldDef;
  values: Record<string, any>;
  setValue: (name: string, v: any) => void;
  error?: string | null;
  ctx?: FormContext,
}) {

  // AS TEXT MODE
  if (f.asText) {
    return (
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          {f.label}
        </Typography>
        {renderAsText(f, values)}
      </Stack>
    );
  }

  // AS EDIT MODE
  const isDisabled =
    typeof f.disableIf === "function" ? f.disableIf(values) : false;

  const common = {
    label: f.label,
    fullWidth: f.fullWidth ?? true,
    size: f.size ?? "small",
    error: !!error,
    helperText: error ?? f.helperText,
    placeholder: f.placeholder,
    name: f.name,
    disabled: isDisabled,
  } as const;

  // PASSWORD
  if (f.kind === "password") {
    return (
      <PasswordField
        label={f.label}
        value={values[f.name] ?? ""}
        onChange={(v) => setValue(f.name, v)}
        size={f.size ?? "small"}
        fullWidth={f.fullWidth ?? true}
        error={!!error}
        helperText={error ?? f.helperText}
      />
    );
  }

  // NEW-PASSWORD
  if (f.kind === "new-password") {
    const val = values[f.name] ?? { password: "", confirm: "" };
    const newLabel = f.newLabel ?? "Mật khẩu";
    const confirmLabel = f.confirmLabel ?? "Xác nhận mật khẩu";

    return (
      <Stack spacing={1}>
        <PasswordField
          label={newLabel}
          value={val.password}
          onChange={(v) => setValue(f.name, { ...val, password: v })}
          size={f.size ?? "small"}
          fullWidth={f.fullWidth ?? true}
        />
        <PasswordField
          label={confirmLabel}
          value={val.confirm}
          onChange={(v) => setValue(f.name, { ...val, confirm: v })}
          size={f.size ?? "small"}
          fullWidth={f.fullWidth ?? true}
          error={!!error}
          helperText={error ?? f.helperText}
        />
      </Stack>
    );
  }

  // CHANGE-PASSWORD
  if (f.kind === "change-password") {
    const val = values[f.name] ?? { current: "", password: "", confirm: "" };
    const currentLabel = f.currentLabel ?? "Mật khẩu hiện tại";
    const newLabel = f.newLabel ?? "Mật khẩu mới";
    const confirmLabel = f.confirmLabel ?? "Xác nhận mật khẩu mới";

    return (
      <Stack spacing={1}>
        <PasswordField
          label={currentLabel}
          value={val.current}
          onChange={(v) => setValue(f.name, { ...val, current: v })}
          size={f.size ?? "small"}
          fullWidth={f.fullWidth ?? true}
        />
        <PasswordField
          label={newLabel}
          value={val.password}
          onChange={(v) => setValue(f.name, { ...val, password: v })}
          size={f.size ?? "small"}
          fullWidth={f.fullWidth ?? true}
        />
        <PasswordField
          label={confirmLabel}
          value={val.confirm}
          onChange={(v) => setValue(f.name, { ...val, confirm: v })}
          size={f.size ?? "small"}
          fullWidth={f.fullWidth ?? true}
          error={!!error}
          helperText={error ?? f.helperText}
        />
      </Stack>
    );
  }

  // EMAIL
  if (f.kind === "email") {
    return (
      <TextField
        {...common}
        type="email"
        value={values[f.name] ?? ""}
        onChange={(e) => setValue(f.name, e.target.value)}
        InputProps={{
          endAdornment:
            f.rules?.maxLength != null ? (
              <InputAdornment position="end">
                {(values[f.name]?.length ?? 0)}/{f.rules?.maxLength}
              </InputAdornment>
            ) : undefined,
        }}
      />
    );
  }

  // TEXTAREA
  if (f.kind === "textarea") {
    return (
      <TextField
        {...common}
        value={values[f.name] ?? ""}
        onChange={(e) => setValue(f.name, e.target.value)}
        multiline
        rows={f.rows ?? 3}
      />
    );
  }

  // DATETIME
  if (f.kind === "datetime") {
    const iso: string | "" = values[f.name] ?? "";
    const val = iso ? dayjs(iso) : null;

    return (
      <DateTimePicker
        label={f.label}
        value={val}
        onChange={(d) => setValue(f.name, d ? d.toISOString() : "")}
        slotProps={{
          textField: {
            size: f.size ?? "small",
            fullWidth: f.fullWidth ?? true,
            error: !!error,
            helperText: error ?? f.helperText,
          },
        }}
      />
    );
  }

  // DATE
  if (f.kind === "date") {
    const iso: string | "" = values[f.name] ?? "";
    const val = iso ? dayjs(iso) : null;

    return (
      <DatePicker
        label={f.label}
        value={val}
        onChange={(d) => {
          const out = d ? d.format("YYYY-MM-DD") : "";
          setValue(f.name, out);
        }}
        slotProps={{
          textField: {
            size: f.size ?? "small",
            fullWidth: f.fullWidth ?? true,
            error: !!error,
            helperText: error ?? f.helperText,
          },
        }}
      />
    );
  }

  // COLOR
  if (f.kind === "color") {
    return (
      <TextField
        {...common}
        type="color"
        value={values[f.name] ?? "#000000"}
        onChange={(e) => setValue(f.name, e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
    );
  }

  // CURRENCY
  if (f.kind === "currency") {
    const raw = values[f.name] ?? "";
    const hasValue =
      raw !== undefined &&
      raw !== null &&
      raw !== "" &&
      !(Number.isNaN(raw));
    return (
      <CurrencyField
        {...(common as any)}
        value={raw}
        onChange={(n) => setValue(f.name, n)}
        prefix="₫"
        decimalScale={0}
        InputLabelProps={{
          shrink: hasValue,
        }}
        inputProps={{ inputMode: "decimal" }}
      />
    );
  }

  // CURRENCY EQUATION
  if (f.kind === "currency-equation") {
    const raw = values[f.name] ?? "";
    const hasValue =
      raw !== undefined &&
      raw !== null &&
      raw !== "" &&
      !(Number.isNaN(raw));

    return (
      <CurrencyField
        {...(common as any)}
        value={raw}
        onChange={(n) => setValue(f.name, n)}
        prefix="₫"
        decimalScale={0}
        InputLabelProps={{
          shrink: hasValue,
        }}
        inputProps={{ inputMode: "decimal" }}
      />
    );
  }

  // NUMBER
  if (f.kind === "number") {
    const raw = values[f.name] ?? "";

    const hasValue =
      raw !== undefined &&
      raw !== null &&
      raw !== "" &&
      !(Number.isNaN(raw));

    return (
      <TextField
        {...common}
        type="number"
        value={raw}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || v === null) {
            setValue(f.name, null);
            return;
          }
          const n = Number(v);
          setValue(f.name, Number.isFinite(n) ? n : null);
        }}
        InputLabelProps={{
          shrink: hasValue,
        }}
        inputProps={{
          inputMode: "decimal",
          step: f.step ?? 1,
          ...(f.rules?.min != null ? { min: f.rules.min } : {}),
          ...(f.rules?.max != null ? { max: f.rules.max } : {}),
        }}
      />
    );
  }

  // SELECT
  if (f.kind === "select" && !f.multiple) {
    const raw = values[f.name];
    const schemaOpts: Option[] = (f.options ?? []).map((o) => {
      if (typeof o === "string" || typeof o === "number") {
        return { label: humanize(o), value: o };
      }
      return {
        label: o.label ?? humanize(o.value),
        value: o.value,
      };
    });

    let selected: Option | null = null;

    if (raw != null && raw !== "") {
      const found = schemaOpts.find((opt) => opt.value === raw);
      if (found) {
        selected = found;
      } else {
        selected = {
          label: humanize(raw),
          value: raw,
        };
      }
    }

    const mergedOpts = [...schemaOpts];
    if (selected && !mergedOpts.some((o) => o.value === selected!.value)) {
      mergedOpts.push(selected);
    }

    return (
      <Autocomplete
        options={mergedOpts}
        value={selected}
        getOptionLabel={(opt) => opt.label}
        isOptionEqualToValue={(a, b) => a.value === b.value}
        onChange={(_, newVal) => {
          setValue(f.name, newVal ? newVal.value : null);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={f.label}
            size={f.size ?? "small"}
            fullWidth={f.fullWidth ?? true}
            error={!!error}
            helperText={error ?? f.helperText}
          />
        )}
      />
    );
  }


  // MULTISELECT
  if (f.kind === "multiselect" || (f.kind === "select" && f.multiple)) {
    const rawValues: any[] = Array.isArray(values[f.name]) ? values[f.name] : [];
    const normalizedOptions: Option[] = rawValues.map((v) => {
      if (typeof v === "object" && v !== null && "value" in v) return v as Option;
      return {
        label: humanize(v),
        value: v,
      };
    });

    const schemaOpts: Option[] = (f.options ?? []).map((o) =>
      typeof o === "string" || typeof o === "number"
        ? { label: humanize(o), value: o }
        : o
    );

    const mergedOpts = [...schemaOpts];
    normalizedOptions.forEach((o) => {
      if (!mergedOpts.some((x) => x.value === o.value)) {
        mergedOpts.push(o);
      }
    });

    return (
      <Autocomplete
        multiple
        options={mergedOpts}
        value={normalizedOptions}
        onChange={(_, newOptions) =>
          setValue(
            f.name,
            (newOptions as Option[]).map((o) => o.value)
          )
        }
        getOptionLabel={(o) => (o as Option).label}
        isOptionEqualToValue={(a, b) => a.value === b.value}
        renderInput={(params) => (
          <TextField
            {...params}
            label={f.label}
            size={f.size ?? "small"}
            fullWidth={f.fullWidth ?? true}
            error={!!error}
            helperText={error ?? f.helperText}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((opt, index) => (
            <Chip
              {...getTagProps({ index })}
              key={(opt as Option).value as any}
              label={(opt as Option).label}
            />
          ))
        }
      />
    );
  }

  // AUTOCOMPLETE
  if (f.kind === "autocomplete") {
    const [loading, setLoading] = React.useState(false);
    const [opts, setOpts] = React.useState<Option[]>(f.options ?? []);
    const optMap = toMap(opts);

    const value = values[f.name];
    const selectedOption = optMap.get(value) ?? null;

    const handleInputChange = async (_: any, keyword: string) => {
      if (!f.loadOptions) return;
      setLoading(true);
      try {
        const data = await f.loadOptions(keyword);
        setOpts(data || []);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Autocomplete
        disabled={isDisabled}
        options={opts}
        value={f.freeSolo ? value ?? null : selectedOption}
        freeSolo={!!f.freeSolo}
        onInputChange={(_e, v, reason) => {
          if (f.freeSolo && (reason === "input" || reason === "clear")) {
            setValue(f.name, v);
          }
          if (f.loadOptions) handleInputChange(_e, v);
        }}
        onChange={(_e, newVal) => {
          if (f.freeSolo) {
            if (newVal && typeof newVal === "object") {
              setValue(f.name, (newVal as Option).value);
            }
          } else {
            setValue(f.name, (newVal as Option | null)?.value ?? "");
          }
        }}
        getOptionLabel={(o) => (typeof o === "string" ? o : (o as Option).label)}
        isOptionEqualToValue={(a, b) => {
          const va = (a as Option).value ?? a;
          const vb = (b as Option).value ?? b;
          return va === vb;
        }}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={f.label}
            size={f.size ?? "small"}
            fullWidth={f.fullWidth ?? true}
            error={!!error}
            helperText={error ?? f.helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    );
  }

  // SEARCHLIST
  if (f.kind === "searchlist") {
    let raw = values[f.name];

    const selectedIds = Array.isArray(raw)
      ? raw
      : [];

    return (
      <SearchListField
        disabled={isDisabled}
        label={f.label}
        values={values}
        placeholder={f.placeholder}
        size={f.size ?? "small"}
        fullWidth={f.fullWidth ?? true}
        helperText={f.helperText}
        error={error}
        selectedIds={selectedIds}
        onChange={(nextIds) => {
          setValue(f.name, nextIds);
        }}
        search={f.search!}
        searchPage={f.searchPage}
        getOptionLabel={f.getOptionLabel!}
        getOptionValue={f.getOptionValue!}
        fetchList={f.fetchList}
        onAdd={f.onAdd}
        onDelete={f.onDelete}
        onDragEnd={f.onDragEnd}
        renderItem={f.renderItem}
        allowDuplicate={f.allowDuplicate}
        dedupeFn={f.dedupeFn as any}
        maxItems={f.maxItems}
        disableDelete={f.disableDelete}
        onOpenCreate={f.onOpenCreate}
        refreshKey={f.refreshKey}
        pageLimit={f.pageLimit}
      />
    );
  }

  // SEARCHSINGLE
  if (f.kind === "searchsingle") {
    const rawId = values[f.name] ?? (f.altName ? values[f.altName] : null);
    // const isFreeSolo = !f.onOpenCreate;

    return (
      <SearchSingleField
        name={f.name}
        label={f.label}
        values={values}
        placeholder={f.placeholder}
        size={f.size ?? "small"}
        fullWidth={f.fullWidth ?? true}
        helperText={f.helperText}
        error={error}
        selectedId={rawId ?? null}
        // onInputChange={(text) => {
        //   if (isFreeSolo) {
        //     setValue(f.name, text);
        //     const mapped = mapIdFieldToNameField(f.name);
        //     setValue(mapped, text);
        //   }
        // }}
        onChange={(val, obj) => {
          setValue(f.name, val);
          const mirrors = resolveRelationMirrors(f.name);
          if (mirrors) {
            setValue(mirrors.root, val); // values.xxx
            setValue(mirrors.cf, val);   // values.customFields.xxx
          }
          const mapped = mapIdFieldToNameField(f.name);
          if (obj && f.getOptionLabel) {
            const label = f.getOptionLabel(obj)?.trim();
            if (label) setValue(mapped, label);
          }
          if (f.onSelect) {
            f.onSelect(obj);
          }
        }}
        search={f.search!}
        searchPage={f.searchPage}
        onSelect={f.onSelect}
        onBlur={f.onBlur}
        getOptionLabel={f.getOptionLabel!}
        getOptionValue={f.getOptionValue ?? ((d: any) => d?.id)}
        getInputLabel={f.getInputLabel!}
        fetchOne={f.fetchOne}
        hydrateById={f.hydrateById}
        renderItem={f.renderItem}
        onOpenCreate={f.onOpenCreate}
        refreshKey={f.refreshKey}
        pageLimit={f.pageLimit}
        ctx={ctx}
      />
    );
  }

  // FILEUPLOAD
  if (f.kind === "fileupload") {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const val = values[f.name] as any[];
    const urls = Array.isArray(val) ? val.filter((x) => typeof x === "string") : [];
    const files = Array.isArray(val) ? val.filter((x) => typeof x !== "string") : [];

    const openPicker = () => inputRef.current?.click();

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files ? Array.from(e.target.files) : [];
      if (list.length === 0) return;

      const max = f.maxFiles ?? Infinity;
      const merged = (files as File[]).concat(list).slice(0, max);

      if (f.uploader) {
        const uploaded = await f.uploader(merged);
        setValue(f.name, uploaded);
      } else {
        setValue(f.name, merged);
      }

      if (inputRef.current) inputRef.current.value = "";
    };

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={f.multipleFiles ?? true}
          accept={f.accept}
          onChange={handleFiles}
        />

        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="outlined" size={f.size ?? "small"} onClick={openPicker}>
            {f.label}
          </Button>
          {error ? (
            <FormHelperText error>{error}</FormHelperText>
          ) : f.helperText ? (
            <FormHelperText>{f.helperText}</FormHelperText>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {urls.map((u) => (
            <Chip key={u} label={u} size="small" />
          ))}
          {files.map((file: File, i: number) => (
            <Chip
              key={`${file.name}-${i}`}
              label={`${file.name} (${Math.round(file.size / 1024)} KB)`}
              size="small"
            />
          ))}
        </Stack>
      </>
    );
  }

  // IMAGEUPLOAD
  if (f.kind === "imageupload") {
    const val = values[f.name] as ImageUploadList | ImageUploadValue | null | undefined;
    const multiple = f.multipleFiles ?? true;

    return (
      <ImageUploadField
        name={f.name}
        label={f.label}
        size={f.size ?? "small"}
        helperText={f.helperText}
        error={error}
        multiple={multiple}
        maxFiles={f.maxFiles}
        accept={f.accept ?? "image/*"}
        uploader={f.uploader}
        value={val}
        onChange={(newVal) => setValue(f.name, newVal)}
      />
    );
  }

  // CHECKBOX
  if (f.kind === "checkbox") {
    const checked = !!values[f.name];

    return (
      <FormControl error={!!error} component="fieldset" variant="standard">
        <FormControlLabel
          control={
            <Checkbox
              disabled={isDisabled}
              size={f.size ?? "small"}
              checked={checked}
              onChange={(e) => setValue(f.name, e.target.checked)}
            />
          }
          label={f.label}
        />
        {error ? <FormHelperText>{error}</FormHelperText> : null}
      </FormControl>
    );
  }

  // SWITCH
  if (f.kind === "switch") {
    const checked = !!values[f.name];

    return (
      <FormControl error={!!error} component="fieldset" variant="standard">
        <FormControlLabel
          control={
            <MuiSwitch
              disabled={isDisabled}
              size={f.size === "medium" ? "medium" : "small"}
              checked={checked}
              onChange={(e) => setValue(f.name, e.target.checked)}
            />
          }
          label={f.label}
        />
        {error ? <FormHelperText>{error}</FormHelperText> : null}
      </FormControl>
    );
  }

  // CUSTOM
  if (f.kind === "custom" && f.render) {
    return (
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        {f.render({
          value: values[f.name],
          setValue: (v) => setValue(f.name, v),
          error,
          field: f,
          values,
          ctx,
        }) as any}
      </Box>
    );
  }

  // DEFAULT TEXT
  return (
    <TextField
      {...common}
      value={values[f.name] ?? ""}
      onChange={(e) => setValue(f.name, e.target.value)}
      InputProps={{
        endAdornment:
          f.rules?.maxLength != null ? (
            <InputAdornment position="end">
              {(values[f.name]?.length ?? 0)}/{f.rules?.maxLength}
            </InputAdornment>
          ) : undefined,
      }}
    />
  );
}


// -----------------------------------------------------------
// GROUPED LAYOUT
// -----------------------------------------------------------
export function AutoFormFieldsGrouped({
  groupsConfig,
  groupMap,
  values,
  setValue,
  errors,
  gap = 2,
  ctx,
}: {
  groupsConfig: GroupConfig[];
  groupMap: Map<string, FieldDef[]>;
  values: Record<string, any>;
  setValue: (name: string, v: any) => void;
  errors?: Record<string, string | null>;
  gap?: number;
  ctx?: FormContext;
}) {
  return (
    <Stack spacing={gap}>
      {groupsConfig.map((g) => {
        const fields = groupMap.get(g.name) ?? [];
        if (fields.length === 0) return null;

        const col = g.col ?? 1;
        const label = g.label ?? "";

        return (
          <Stack key={g.name} spacing={gap}>
            {/* Group Title */}
            <Typography variant="subtitle1" fontWeight={600}>
              {label}
            </Typography>

            {/* Grid Layout using Box SX */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${col}, 1fr)`,
                gap: (theme) => theme.spacing(gap),
              }}
            >
              {fields.map((f) => {
                if (typeof f.showIf === "function") {
                  const visible = f.showIf(values, ctx);
                  if (!visible) return null;
                }
                return (
                  <Box key={f.name}>
                    <AutoFormFieldSingle
                      field={f}
                      values={values}
                      setValue={setValue}
                      error={errors?.[f.name] ?? null}
                      ctx={ctx}
                    />
                  </Box>
                );
              })}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
