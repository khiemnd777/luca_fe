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
import type { AutoFormRef } from "@core/form/form.types";
import { AutoForm } from "@core/form/auto-form";
import { useAsyncDebounce } from "@core/hooks/use-async/use-async-debounce";
import { calculateTotalPrice } from "@features/order/api/order-item.api";
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

function normalizeItemFields(item: OrderItemProductModel) {
  const qty = Number(item.quantity);
  const price = item.retailPrice;

  return {
    productId: item.productId ?? null,
    productCode: item.productCode ?? "",
    quantity: Number.isFinite(qty) ? qty : 0,
    retailPrice:
      price === null || price === undefined ? null : Number.isFinite(Number(price)) ? Number(price) : null,
  };
}

function isSameItem(a: OrderItemProductModel, b: OrderItemProductModel) {
  const na = normalizeItemFields(a);
  const nb = normalizeItemFields(b);

  return (
    na.productId === nb.productId &&
    na.productCode === nb.productCode &&
    na.quantity === nb.quantity &&
    na.retailPrice === nb.retailPrice
  );
}

function buildCommitSignature(vals: Record<string, any>) {
  const parsedQty = Number(vals.quantity);
  const parsedPrice = Number(vals.retailPrice);

  const productId = vals.productId == null ? null : Number(vals.productId);
  const productCode = vals.productCode ?? "";
  const quantity = Number.isFinite(parsedQty) ? parsedQty : 0;
  const retailPrice =
    vals.retailPrice === null || vals.retailPrice === undefined || vals.retailPrice === ""
      ? null
      : Number.isFinite(parsedPrice)
        ? parsedPrice
        : null;

  // Stable string signature
  return `${productId ?? "null"}|${productCode}|${quantity}|${retailPrice ?? "null"}`;
}

function DefaultRender({ item, index, onChange, onRemove }: RenderOrderProductItemProps) {
  const formRef = React.useRef<AutoFormRef | null>(null);
  const latestItemRef = React.useRef(item);
  const onChangeRef = React.useRef(onChange);
  const pendingBlurCommitRef = React.useRef(false);
  const blurCooldownUntilRef = React.useRef(0);

  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const blurRafRef = React.useRef<number | null>(null);

  // NEW: suppress blur commit while syncing values from parent
  const syncingRef = React.useRef(false);

  // NEW: dedupe blur commits (idempotent)
  const lastCommitSigRef = React.useRef<string>("");

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const handleValuesChange = React.useCallback((vals: Record<string, any>) => {
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
    onChangeRef.current(next);
  }, []);

  React.useEffect(() => {
    if (isSameItem(latestItemRef.current, item)) return;

    syncingRef.current = true;
    latestItemRef.current = item;

    // Also refresh signature so next blur won't “re-commit” the same external sync
    lastCommitSigRef.current = buildCommitSignature(item as any);

    formRef.current?.setAllValues({ ...item });

    // Release syncing flag next microtask (safe against immediate blur cascades)
    queueMicrotask(() => {
      syncingRef.current = false;
    });
  }, [item]);

  const initialValues = React.useMemo(() => ({ ...latestItemRef.current }), []);

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      const container = cardRef.current;
      const nextTarget = e.relatedTarget as Node | null;

      // still inside card -> ignore
      if (container && nextTarget && container.contains(nextTarget)) return;

      // already scheduled a commit for this "leave" -> ignore
      if (pendingBlurCommitRef.current) return;

      // schedule exactly ONE commit at end of current focus churn
      pendingBlurCommitRef.current = true;

      queueMicrotask(() => {
        pendingBlurCommitRef.current = false;

        const now = performance.now();
        if (now < blurCooldownUntilRef.current) return;

        const root = cardRef.current;
        if (!root) return;

        const active = document.activeElement;
        if (active && root.contains(active)) return;

        const frm = formRef.current;
        if (!frm) return;

        // cooldown to suppress re-entrant blur caused by ctx.setValue rerender/focus churn
        blurCooldownUntilRef.current = performance.now() + 80;

        handleValuesChange(frm.values ?? {});
      });
    },
    [handleValuesChange]
  );


  React.useEffect(
    () => () => {
      if (blurRafRef.current !== null) {
        cancelAnimationFrame(blurRafRef.current);
      }
    },
    []
  );

  return (
    <Card variant="outlined" sx={{ mb: 1 }} ref={cardRef} onBlurCapture={handleBlur}>
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
        <AutoForm ref={formRef} name="order-product-item" initial={initialValues} />
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
  renderItem,
  createItem,
  addLabel = "Thêm sản phẩm",
}: OrderProductItemListProps) {
  const confirmResolverRef = React.useRef<((result: boolean) => void) | null>(null);
  const ctxRef = React.useRef<FormContext | null>(ctx ?? null);
  const lastTotalRef = React.useRef<number | null>(null);

  const resolvedValues = values ?? ctx?.values ?? {};

  React.useEffect(() => {
    ctxRef.current = ctx ?? null;
  }, [ctx]);

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

  const { prices, quantities, signature } = React.useMemo(() => {
    const normalizedQuantities: number[] = [];
    const normalizedPrices: number[] = [];

    for (const item of items) {
      const qty = Number(item.quantity);
      const price = item.retailPrice;

      normalizedQuantities.push(Number.isFinite(qty) ? qty : 0);
      normalizedPrices.push(
        price === null || price === undefined ? 0 : Number.isFinite(Number(price)) ? Number(price) : 0
      );
    }

    return {
      prices: normalizedPrices,
      quantities: normalizedQuantities,
      signature: `${normalizedQuantities.join(",")}|${normalizedPrices.join(",")}`,
    };
  }, [items]);

  const { data: calculatedTotalPrice } = useAsyncDebounce(
    () => {
      if (prices.length === 0) return Promise.resolve(0);

      return calculateTotalPrice({
        prices,
        quantities,
      });
    },
    250,
    [signature]
  );

  React.useEffect(() => {
    const targetCtx = ctxRef.current;
    if (calculatedTotalPrice == null || !targetCtx) return;
    if (lastTotalRef.current === calculatedTotalPrice) return;

    lastTotalRef.current = calculatedTotalPrice;
    targetCtx.setValue("latestOrderItem.totalPrice", calculatedTotalPrice);
  }, [calculatedTotalPrice]);

  React.useEffect(() => {
    if (!name || !ctxRef.current) return;

    ctxRef.current.setValue(name, items);
    onChange?.(items);

    // call onUpdate PER ITEM CHANGE if you must
  }, [items]);

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
      setItems((prev) => {
        const target = prev[idx];
        if (!target) return prev;

        const updated = { ...target, ...patch };
        return prev.map((it, i) => (i === idx ? updated : it));
      });
    },
    []
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
          <Button variant="outlined" size="small" startIcon={<AddCircleOutlineRounded />} onClick={handleAdd}>
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
