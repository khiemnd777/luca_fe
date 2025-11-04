import * as React from "react";
import { Stack, Button, FormHelperText, IconButton, Tooltip, Box } from "@mui/material";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import AddPhotoAlternateRounded from "@mui/icons-material/AddPhotoAlternateRounded";

export type ImageUploadValue = string | File;
export type ImageUploadList = ImageUploadValue[]; // single → mảng 1 phần tử

export type ImageUploadFieldProps = {
  name: string;
  label?: string;
  size?: "small" | "medium";
  helperText?: string | null;
  error?: string | null;
  multiple?: boolean;            // default: true
  maxFiles?: number;
  accept?: string;               // default: "image/*"
  uploader?: (files: File[]) => Promise<string[]>;
  value: ImageUploadList | ImageUploadValue | null | undefined;
  onChange: (val: ImageUploadList | ImageUploadValue | null) => void;
};

export function ImageUploadField(props: ImageUploadFieldProps) {
  const {
    name,
    label = "Upload images",
    size = "small",
    helperText,
    error,
    multiple = true,
    maxFiles = Infinity,
    accept = "image/*",
    uploader,
    value,
    onChange,
  } = props;

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Chuẩn hoá value → mảng
  const list = React.useMemo<ImageUploadList>(() => {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const urls = React.useMemo(() => list.filter((x): x is string => typeof x === "string"), [list]);
  const files = React.useMemo(() => list.filter((x): x is File => x instanceof File), [list]);

  const openPicker = () => inputRef.current?.click();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    if (picked.length === 0) return;

    const merged = multiple ? [...files, ...picked] : [picked[0]];
    const limited = merged.slice(0, maxFiles);

    if (uploader) {
      const uploadedUrls = await uploader(limited);
      onChange(multiple ? uploadedUrls : uploadedUrls[0] ?? null);
    } else {
      // Giữ trộn URL cũ + File mới
      onChange(multiple ? [...urls, ...limited] : (urls[0] ?? limited[0] ?? null));
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx: number, isUrl: boolean) => {
    if (isUrl) {
      const newUrls = urls.filter((_, i) => i !== idx);
      onChange(multiple ? [...newUrls, ...files] : (newUrls[0] ?? files[0] ?? null));
    } else {
      const newFiles = files.filter((_, i) => i !== idx);
      onChange(multiple ? [...urls, ...newFiles] : (urls[0] ?? newFiles[0] ?? null));
    }
  };

  // ===== FIX: tạo previews bằng useMemo (không setState) + cleanup revoke =====
  const previews = React.useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  React.useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);
  // ==========================================================================

  return (
    <React.Fragment key={name}>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept={accept}
        onChange={handleFiles}
      />

      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          variant="outlined"
          size={size}
          startIcon={<AddPhotoAlternateRounded />}
          onClick={openPicker}
        >
          {label}
        </Button>
        {error ? (
          <FormHelperText error>{error}</FormHelperText>
        ) : helperText ? (
          <FormHelperText>{helperText}</FormHelperText>
        ) : null}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
          gap: 1,
          mt: 1,
        }}
      >
        {urls.map((u, i) => (
          <Thumb key={`url-${i}-${u}`} src={u} alt={`image-${i}`} onRemove={() => removeAt(i, true)} />
        ))}
        {previews.map((u, i) => (
          <Thumb
            key={`file-${i}-${(files[i] as File).name}`}
            src={u}
            alt={(files[i] as File).name}
            onRemove={() => removeAt(i, false)}
          />
        ))}
      </Box>
    </React.Fragment>
  );
}

function Thumb({ src, alt, onRemove }: { src: string; alt?: string; onRemove: () => void }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "background.default",
        border: "1px dashed",
        borderColor: "divider",
      }}
    >
      <img
        src={src}
        alt={alt ?? ""}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      <Tooltip title="Remove">
        <IconButton
          size="small"
          onClick={onRemove}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            bgcolor: "rgba(0,0,0,0.5)",
            color: "white",
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
          }}
        >
          <DeleteOutlineRounded fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
