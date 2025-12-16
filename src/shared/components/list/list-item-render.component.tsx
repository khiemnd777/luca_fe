import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import type { AutoFormRef } from "@core/form/form.types";
import { AutoForm } from "@core/form/auto-form";

export type ListItemRenderProps<T> = {
  item: T;
  index: number;
  onChange: (patch: Partial<T>) => void;
  onRemove: () => void;

  normalize: (item: T) => Record<string, any>;
  extractPatch: (vals: Record<string, any>) => Partial<T>;
  buildSignature: (vals: Record<string, any>) => string;

  onBlurCommit?: () => void;
  formName: string;
};

export function ListItemRender<T>({
  item,
  index,
  onChange,
  onRemove,
  normalize,
  extractPatch,
  buildSignature,
  onBlurCommit,
  formName,
}: ListItemRenderProps<T>) {
  const formRef = React.useRef<AutoFormRef | null>(null);
  const latestItemRef = React.useRef(item);
  const lastCommitSigRef = React.useRef<string>("");

  React.useEffect(() => {
    const prev = normalize(latestItemRef.current);
    const next = normalize(item);
    if (JSON.stringify(prev) === JSON.stringify(next)) return;

    latestItemRef.current = item;
    lastCommitSigRef.current = buildSignature(item as any);
    formRef.current?.setAllValues({ ...(item as any) });
  }, [item, normalize, buildSignature]);

  const initialValues = React.useMemo(() => ({ ...(item as any) }), []);

  const handleBlur = React.useCallback(() => {
    const frm = formRef.current;
    if (!frm) return;

    const vals = frm.values ?? {};
    const sig = buildSignature(vals);
    if (sig === lastCommitSigRef.current) return;

    lastCommitSigRef.current = sig;
    onChange(extractPatch(vals));
    onBlurCommit?.();
  }, [extractPatch, buildSignature, onChange, onBlurCommit]);

  return (
    <Card variant="outlined" sx={{ mb: 1 }} onBlurCapture={handleBlur}>
      <CardHeader
        title={
          <Typography variant="subtitle2" fontWeight={600}>
            Sản phẩm {index + 1}
          </Typography>
        }
        action={
          <IconButton color="error" size="small" onClick={onRemove}>
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <AutoForm ref={formRef} name={formName} initial={initialValues} />
      </CardContent>
    </Card>
  );
}
