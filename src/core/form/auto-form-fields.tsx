import * as React from "react";
import {
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Checkbox,
  Switch as MuiSwitch,
  Chip,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Autocomplete } from "@mui/material";
import dayjs from "dayjs";
import type { FieldDef, Option } from "@core/form/types";
import { CurrencyField } from "@core/form/currency-field";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ImageUploadField, type ImageUploadList, type ImageUploadValue } from "./image-upload-field";

type Props = {
  schema: FieldDef[];
  values: Record<string, any>;
  setValue: (name: string, v: any) => void;
  errors?: Record<string, string | null>;
  gap?: number; // Stack spacing
};

function toMap(options?: Option[]) {
  const map = new Map<any, Option>();
  (options ?? []).forEach((o) => map.set(o.value, o));
  return map;
}

export function AutoFormFields({ schema, values, setValue, errors, gap = 2 }: Props) {
  return (
    <Stack spacing={gap}>
      {schema.map((f) => {
        const common = {
          label: f.label,
          fullWidth: f.fullWidth ?? true,
          size: f.size ?? "small",
          error: !!errors?.[f.name],
          helperText: errors?.[f.name] ?? f.helperText,
          placeholder: f.placeholder,
          name: f.name,
        } as const;

        // PASSWORD
        if (f.kind === "password") {
          const [show, setShow] = React.useState(false);
          return (
            <TextField
              key={f.name}
              {...common}
              type={show ? "text" : "password"}
              value={values[f.name] ?? ""}
              onChange={(e) => setValue(f.name, e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="toggle password visibility"
                      onClick={() => setShow((s) => !s)}
                      edge="end"
                    >
                      {show ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          );
        }

        // EMAIL
        if (f.kind === "email") {
          return (
            <TextField
              key={f.name}
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
              key={f.name}
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
              key={f.name}
              label={f.label}
              value={val}
              onChange={(d) => setValue(f.name, d ? d.toISOString() : "")}
              slotProps={{
                textField: {
                  size: f.size ?? "small",
                  fullWidth: f.fullWidth ?? true,
                  error: !!errors?.[f.name],
                  helperText: errors?.[f.name] ?? f.helperText,
                },
              }}
            />
          );
        }

        // COLOR
        if (f.kind === "color") {
          return (
            <TextField
              key={f.name}
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
          return (
            <CurrencyField
              key={f.name}
              {...(common as any)}
              value={values[f.name] ?? 0}
              onChange={(n) => setValue(f.name, n)}
              prefix="₫"
              decimalScale={0}
              inputProps={{ inputMode: "decimal" }}
            />
          );
        }

        // NUMBER
        if (f.kind === "number") {
          const raw = values[f.name];
          return (
            <TextField
              key={f.name}
              {...common}
              type="number"
              value={raw ?? 0}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || v === null) {
                  setValue(f.name, 0);
                  return;
                }
                const n = Number(v);
                setValue(f.name, Number.isFinite(n) ? n : 0);
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

        // SELECT (single)
        if (f.kind === "select" && !f.multiple) {
          return (
            <TextField
              key={f.name}
              {...common}
              select
              value={values[f.name] ?? ""}
              onChange={(e) => setValue(f.name, e.target.value)}
            >
              {(f.options ?? []).map((opt) => (
                <MenuItem key={`${f.name}-${String(opt.value)}`} value={opt.value as any}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          );
        }

        // MULTISELECT (Autocomplete multiple)
        if (f.kind === "multiselect" || (f.kind === "select" && f.multiple)) {
          const optMap = toMap(f.options);
          const currentValues: any[] = Array.isArray(values[f.name]) ? values[f.name] : [];
          const currentOptions = currentValues.map((v) => optMap.get(v)).filter(Boolean) as Option[];

          return (
            <Autocomplete
              key={f.name}
              multiple
              options={f.options ?? []}
              value={currentOptions}
              onChange={(_, newOptions) => setValue(f.name, (newOptions as Option[]).map((o) => o.value))}
              getOptionLabel={(o) => (o as Option).label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={f.label}
                  size={f.size ?? "small"}
                  fullWidth={f.fullWidth ?? true}
                  error={!!errors?.[f.name]}
                  helperText={errors?.[f.name] ?? f.helperText}
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((opt, index) => <Chip {...getTagProps({ index })} key={(opt as Option).value as any} label={(opt as Option).label} />)
              }
            />
          );
        }

        // AUTOCOMPLETE (single, optional freeSolo, optional async)
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
              key={f.name}
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
                  // khi chọn một option từ danh sách
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
                  error={!!errors?.[f.name]}
                  helperText={errors?.[f.name] ?? f.helperText}
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

        // FILEUPLOAD (cơ bản) — lưu giá trị là array URLs (string[]) hoặc File[]
        if (f.kind === "fileupload") {
          const inputRef = React.useRef<HTMLInputElement | null>(null);
          const val = values[f.name] as any[]; // urls hoặc File[]
          const urls = Array.isArray(val) ? val.filter((x) => typeof x === "string") : [];
          const files = Array.isArray(val) ? val.filter((x) => typeof x !== "string") : [];

          const openPicker = () => inputRef.current?.click();

          const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const list = e.target.files ? Array.from(e.target.files) : [];
            if (list.length === 0) return;

            const max = f.maxFiles ?? Infinity;
            const merged = (files as File[]).concat(list).slice(0, max);

            if (f.uploader) {
              // Upload → set URLs
              const uploaded = await f.uploader(merged);
              setValue(f.name, uploaded);
            } else {
              // Nếu không có uploader → giữ thẳng File[]
              setValue(f.name, merged);
            }
            // reset input để chọn lại cùng tệp được
            if (inputRef.current) inputRef.current.value = "";
          };

          return (
            <React.Fragment key={f.name}>
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
                {errors?.[f.name] ? <FormHelperText error>{errors?.[f.name]}</FormHelperText> : f.helperText ? <FormHelperText>{f.helperText}</FormHelperText> : null}
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {urls.map((u) => (
                  <Chip key={u} label={u} size="small" />
                ))}
                {files.map((file: File, i: number) => (
                  <Chip key={`${file.name}-${i}`} label={`${file.name} (${Math.round(file.size / 1024)} KB)`} size="small" />
                ))}
              </Stack>
            </React.Fragment>
          );
        }

        // IMAGEUPLOAD — single/multiple
        if (f.kind === "imageupload") {
          // hỗ trợ cả 2 kiểu: single (string|File|null) hoặc multiple (Array)
          const val = values[f.name] as ImageUploadList | ImageUploadValue | null | undefined;
          const multiple = f.multipleFiles ?? true; // tái dùng field cũ nếu đã đang truyền

          return (
            <ImageUploadField
              key={f.name}
              name={f.name}
              label={f.label}
              size={f.size ?? "small"}
              helperText={f.helperText}
              error={errors?.[f.name] ?? null}
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
          const hasErr = !!errors?.[f.name];
          const helper = errors?.[f.name] ?? f.helperText;
          return (
            <FormControl key={f.name} error={hasErr} component="fieldset" variant="standard">
              <FormControlLabel
                control={
                  <Checkbox
                    size={f.size ?? "small"}
                    checked={checked}
                    onChange={(e) => setValue(f.name, e.target.checked)}
                  />
                }
                label={f.label}
              />
              {helper ? <FormHelperText>{helper}</FormHelperText> : null}
            </FormControl>
          );
        }

        // SWITCH
        if (f.kind === "switch") {
          const checked = !!values[f.name];
          const hasErr = !!errors?.[f.name];
          const helper = errors?.[f.name] ?? f.helperText;
          return (
            <FormControl key={f.name} error={hasErr} component="fieldset" variant="standard">
              <FormControlLabel
                control={
                  <MuiSwitch
                    size={f.size === "medium" ? "medium" : "small"}
                    checked={checked}
                    onChange={(e) => setValue(f.name, e.target.checked)}
                  />
                }
                label={f.label}
              />
              {helper ? <FormHelperText>{helper}</FormHelperText> : null}
            </FormControl>
          );
        }

        // CUSTOM — dev tự render
        if (f.kind === "custom" && f.render) {
          return f.render({
            value: values[f.name],
            setValue: (v) => setValue(f.name, v),
            error: errors?.[f.name],
            field: f,
          }) as any;
        }

        // DEFAULT: TEXT
        return (
          <TextField
            key={f.name}
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
      })}
    </Stack>
  );
}
