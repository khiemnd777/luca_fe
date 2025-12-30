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
import type { FormContext } from "@root/core/form/types";

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
  labelName: string;
  listKey: string;
  ctx?: FormContext | null;
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
  labelName,
  listKey,
  ctx,
}: ListItemRenderProps<T>) {
  const formRef = React.useRef<AutoFormRef | null>(null);
  const lastItemIdRef = React.useRef<any>(null);
  const mountInitialRef = React.useRef<Record<string, any>>({});

  if (lastItemIdRef.current !== (item as any)?.id) {
    lastItemIdRef.current = (item as any)?.id;
    mountInitialRef.current = { ...(item as any) };
  }

  const latestItemRef = React.useRef(item);
  const lastCommitSigRef = React.useRef<string>("");

  React.useEffect(() => {
    const prev = normalize(latestItemRef.current);
    const next = normalize(item);

    if (JSON.stringify(prev) === JSON.stringify(next)) return;

    latestItemRef.current = item;
    lastCommitSigRef.current = buildSignature(item as any);

    const frm = formRef.current;
    if (!frm) return;

    const prevVals = frm.values ?? {};
    frm.setAllValues({
      ...prevVals,
      ...(item as any),
    });
  }, [item, normalize, buildSignature]);

  React.useEffect(() => {
    if (!ctx) return;

    const handler = (payload: any) => {
      const meta = payload?.__meta;
      const patch = payload?.patch;

      if (!meta || !patch) return;

      if (meta.listKey !== listKey) return;

      if (meta.itemId !== (item as any)?.id) return;

      onChange(patch);
    };

    ctx.on("item:patch", handler);

    return () => {
      ctx.off("item:patch", handler);
    };
  }, [ctx, listKey, item, onChange]);


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
            {labelName} #{index + 1}
          </Typography>
        }
        action={
          <IconButton color="error" size="small" onClick={onRemove}>
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <AutoForm
          ref={formRef}
          name={formName}
          initial={mountInitialRef.current}
        />
      </CardContent>
    </Card>
  );
}
