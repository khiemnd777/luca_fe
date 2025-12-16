import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddCircleOutlineRounded from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { ConfirmDialog } from "@shared/components/dialog/confirm-dialog";

import type { FormContext } from "@core/form/types";
import { AutoForm } from "@core/form/auto-form";
import type { OrderItemProductModel } from "@features/order/model/order-item-product.model";

export type RenderOrderProductItemProps = {
  item: OrderItemProductModel;
  index: number;
  onChange: (patch: Partial<OrderItemProductModel>) => void;
  onRemove: () => void;
  ctx?: FormContext | null;
  values: Record<string, any>;
};

export type OrderProductItemListProps = {
  /** Controlled value from AutoForm (or any parent). */
  value?: OrderItemProductModel[] | null;
  /** Name inside FormContext to auto-sync when onChange is not provided. */
  name?: string;
  /** Access to AutoForm context so this component can push values back. */
  ctx?: FormContext | null;
  /** Optional external values for renderItem factory; defaults to ctx?.values. */
  values?: Record<string, any>;
  /** Fired before an item is added. Return false to cancel. */
  onBeforeAdding?: (
    nextItem: OrderItemProductModel,
    items: OrderItemProductModel[],
    ctx?: FormContext | null
  ) => boolean | Promise<boolean>;
  /** Fired whenever the list changes. */
  onChange?: (items: OrderItemProductModel[]) => void;
  /** Fired after an item is added. */
  onAdd?: (item: OrderItemProductModel, items: OrderItemProductModel[], ctx?: FormContext | null) => void;
  /** Ask confirmation before removing item */
  confirmRemove?: (
    item: OrderItemProductModel,
    index: number,
    items: OrderItemProductModel[],
    ctx?: FormContext | null
  ) => boolean | Promise<boolean>;
  /** Fired after an item is removed. */
  onRemove?: (item: OrderItemProductModel, items: OrderItemProductModel[], ctx?: FormContext | null) => void;
  /** Fired after an item is updated. */
  onUpdate?: (item: OrderItemProductModel, index: number, items: OrderItemProductModel[], ctx?: FormContext | null) => void;
  /** Custom renderer for each item. */
  renderItem?: (props: RenderOrderProductItemProps) => React.ReactNode;
  /** Factory to create a new item. */
  createItem?: (values: Record<string, any>) => OrderItemProductModel;
  addLabel?: string;
};

function defaultFactory(values: Record<string, any>): OrderItemProductModel {
  return {
    id: Date.now(),
    productCode: "",
    productId: null,
    orderItemId: values.orderItemId ?? values.id ?? null,
    orderId: values.orderId ?? null,
    quantity: 1,
    retailPrice: 0,
  };
}

function DefaultRender({ item, index, onChange, onRemove }: RenderOrderProductItemProps) {
  const latestItemRef = React.useRef(item);

  React.useEffect(() => {
    latestItemRef.current = item;
  }, [item]);

  const handleValuesChange = React.useCallback(
    (vals: Record<string, any>) => {
      const parsedQty = Number(vals.quantity);
      const parsedPrice = Number(vals.retailPrice);

      const next: Partial<OrderItemProductModel> = {
        productId: vals.productId == null ? null : Number(vals.productId),
        productCode: vals.productCode ?? "",
        quantity: Number.isFinite(parsedQty) ? parsedQty : 0,
        retailPrice:
          vals.retailPrice === null || vals.retailPrice === undefined || vals.retailPrice === ""
            ? null
            : Number.isFinite(parsedPrice) ? parsedPrice : null,
      };

      const prev = latestItemRef.current;
      const changed =
        (prev.productId ?? null) !== (next.productId ?? null) ||
        (prev.productCode ?? "") !== (next.productCode ?? "") ||
        prev.quantity !== next.quantity ||
        (prev.retailPrice ?? null) !== (next.retailPrice ?? null);

      if (!changed) return;

      latestItemRef.current = { ...prev, ...next };
      onChange(next);
    },
    [onChange]
  );

  const initialValues = React.useMemo(
    () => ({ ...item, __onChange: handleValuesChange }),
    [item, handleValuesChange]
  );

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardHeader
        title={
          <Typography variant="subtitle2" fontWeight={600}>
            Sản phẩm {index + 1}
          </Typography>
        }
        action={
          <IconButton aria-label="remove" color="error" onClick={onRemove} size="small">
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <AutoForm name="order-product-item" initial={initialValues} />
      </CardContent>
    </Card>
  );
}

export default function OrderProductItemList({
  value,
  name,
  ctx,
  values,
  onChange,
  onBeforeAdding,
  onAdd,
  confirmRemove,
  onRemove,
  onUpdate,
  renderItem,
  createItem,
  addLabel = "Thêm sản phẩm",
}: OrderProductItemListProps) {
  const confirmResolverRef = React.useRef<((result: boolean) => void) | null>(null);
  const resolvedValues = values ?? ctx?.values ?? {};
  const [items, setItems] = React.useState<OrderItemProductModel[]>(() => {
    if (Array.isArray(value)) return value;
    if (name && ctx && Array.isArray((ctx.values as any)?.[name])) {
      return (ctx.values as any)[name] as OrderItemProductModel[];
    }
    return [];
  });
  const [confirmItem, setConfirmItem] = React.useState<OrderItemProductModel | null>(null);

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setItems(value);
      return;
    }
    if (name && ctx && Array.isArray((ctx.values as any)?.[name])) {
      setItems((ctx.values as any)[name] as OrderItemProductModel[]);
      return;
    }
    setItems([]);
  }, [value, name, ctx, ctx?.values]);

  const propagate = React.useCallback(
    (next: OrderItemProductModel[]) => {
      setItems(next);
      if (onChange) onChange(next);
      if (name && ctx) ctx.setValue(name, next);
    },
    [name, ctx, onChange]
  );

  const defaultConfirmRemove = React.useCallback(
    (item: OrderItemProductModel) =>
      new Promise<boolean>((resolve) => {
        confirmResolverRef.current = resolve;
        setConfirmItem(item);
      }),
    []
  );

  const handleCancelConfirm = React.useCallback(() => {
    confirmResolverRef.current?.(false);
    confirmResolverRef.current = null;
    setConfirmItem(null);
  }, []);

  const handleConfirmDialog = React.useCallback(() => {
    confirmResolverRef.current?.(true);
    confirmResolverRef.current = null;
    setConfirmItem(null);
  }, []);

  const handleAdd = React.useCallback(async () => {
    const newItem = (createItem ?? defaultFactory)(resolvedValues);
    if (onBeforeAdding) {
      const ok = await onBeforeAdding(newItem, items, ctx);
      if (ok === false) return;
    }
    const next = [...items, newItem];
    propagate(next);
    onAdd?.(newItem, next, ctx);
  }, [items, propagate, createItem, resolvedValues, onBeforeAdding, onAdd, ctx]);

  const handleRemove = React.useCallback(
    (idx: number) => async () => {
      const target = items[idx];
      if (!target) return;

      const confirmer = confirmRemove ?? defaultConfirmRemove;
      const ok = await confirmer(target, idx, items, ctx);
      if (ok === false) return;
      const next = items.filter((_, i) => i !== idx);
      propagate(next);
      onRemove?.(target, next, ctx);
    },
    [items, propagate, onRemove, ctx, confirmRemove, defaultConfirmRemove]
  );

  const handleUpdate = React.useCallback(
    (idx: number, patch: Partial<OrderItemProductModel>) => {
      const target = items[idx];
      if (!target) return;
      const updated = { ...target, ...patch };
      const next = items.map((it, i) => (i === idx ? updated : it));
      propagate(next);
      onUpdate?.(updated, idx, next, ctx);
    },
    [items, propagate, onUpdate, ctx]
  );

  const RenderItem = (renderItem ?? DefaultRender) as React.ComponentType<RenderOrderProductItemProps>;

  return (
    <>
      <Stack spacing={1.5}>
        {items.length === 0 ? (
          <Box
            sx={(theme) => ({
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              p: 2,
            })}
          >
            <Typography variant="body2" color="text.secondary">
              Chưa có sản phẩm nào. Nhấn "{addLabel}" để thêm.
            </Typography>
          </Box>
        ) : (
          items.map((item, idx) => (
            <React.Fragment key={item.id ?? idx}>
              <RenderItem
                item={item}
                index={idx}
                onChange={(patch) => handleUpdate(idx, patch)}
                onRemove={handleRemove(idx)}
                ctx={ctx}
                values={resolvedValues}
              />
            </React.Fragment>
          ))
        )}

        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddCircleOutlineRounded />}
            onClick={handleAdd}
          >
            {addLabel}
          </Button>
        </Box>
      </Stack>

      <ConfirmDialog
        open={Boolean(confirmItem)}
        title="Xóa sản phẩm?"
        content={
          confirmItem?.productCode
            ? `Bạn có chắc muốn xoá ${confirmItem.productCode} này?`
            : "Bạn có chắc muốn xoá sản phẩm này?"
        }
        confirmText="Xóa"
        cancelText="Hủy"
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmDialog}
      />
    </>
  );
}
