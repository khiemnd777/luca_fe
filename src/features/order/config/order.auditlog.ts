import { registerAuditRenderers } from "@root/core/auditlog/auditlog-registrar";
import type { AuditRenderer } from "@core/auditlog/types";

const orderAuditRenderers: AuditRenderer[] = [
  {
    match: { module: "order", action: "created" },
    moduleLabel: "Order",
    actionLabel: () => "Created",
    fields: [
      { key: "order_id", label: "Order ID" },
      { key: "order_code", label: "Order Code" },
      { key: "order_item_id", label: "Order Item ID" },
      { key: "order_item_code", label: "Order Item Code" },
    ],
  },
  {
    match: { module: "order", action: "updated" },
    moduleLabel: "Order",
    actionLabel: () => "Updated",
    fields: [
      { key: "order_id", label: "Order ID" },
      { key: "order_code", label: "Order Code" },
      { key: "order_item_id", label: "Order Item ID" },
      { key: "order_item_code", label: "Order Item Code" },
    ],
  },
  {
    match: { module: "order", action: "updated:status:change" },
    moduleLabel: "Order",
    actionLabel: () => "Status Changed",
    fields: [
      { key: "order_id", label: "Order ID" },
      { key: "order_code", label: "Order Code" },
      { key: "order_item_id", label: "Order Item ID" },
      { key: "order_item_code", label: "Order Item Code" },
      { key: "status", label: "Status" },
    ],
  },
  {
    match: { module: "order", action: "updated:delivery-status:change" },
    moduleLabel: "Order",
    actionLabel: () => "Delivery Status Changed",
    fields: [
      { key: "order_id", label: "Order ID" },
      { key: "order_code", label: "Order Code" },
      { key: "order_item_id", label: "Order Item ID" },
      { key: "order_item_code", label: "Order Item Code" },
      { key: "delivery_status", label: "Delivery Status" },
    ],
  },
  {
    match: { module: "order", action: "inprogress:checkout" },
    moduleLabel: "Order",
    actionLabel: () => "Checkout",
    fields: [
      { key: "order_id", label: "Order ID" },
      { key: "order_item_id", label: "Order Item ID" },
      { key: "order_item_code", label: "Order Item Code" },
      { key: "section_name", label: "Section" },
      { key: "process_name", label: "Process" },
    ],
  },
  {
    match: { module: "order", action: "inprogress:checkin" },
    moduleLabel: "Order",
    actionLabel: () => "Checkin",
    fields: [
      { key: "order_id", label: "Order ID" },
      { key: "order_item_id", label: "Order Item ID" },
      { key: "order_item_code", label: "Order Item Code" },
      { key: "section_name", label: "Section" },
      { key: "process_name", label: "Process" },
    ],
  },
  {
    match: { module: "order", action: "inprogress:checkin:assigned" },
    moduleLabel: "Order",
    actionLabel: () => "Checkin Assigned",
    fields: [
      { key: "order_id", label: "Order ID" },
      { key: "order_item_id", label: "Order Item ID" },
      { key: "order_item_code", label: "Order Item Code" },
      { key: "assigned_name", label: "Assigned User" },
    ],
  },
  {
    match: { module: "order", action: "inprogress:*" },
    moduleLabel: "Order",
    actionLabel: (action) => action.replace("inprogress:", ""),
    fields: [
      { key: "order_id", label: "Order ID" },
      { key: "order_item_id", label: "Order Item ID" },
      { key: "order_item_code", label: "Order Item Code" },
      { key: "section_name", label: "Section" },
      { key: "process_name", label: "Process" },
      { key: "assigned_name", label: "Assigned User" },
      { key: "next_section_name", label: "Next Section" },
      { key: "next_process_name", label: "Next Process" },
      { key: "status", label: "Status" },
    ],
  },
  {
    match: { module: "order", action: "*" },
    moduleLabel: "Order",
  },
];

registerAuditRenderers(orderAuditRenderers);

export {};
