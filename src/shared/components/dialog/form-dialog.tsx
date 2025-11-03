import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

type FormDialogProps = React.PropsWithChildren<{
  open: boolean;
  title: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  maxWidth?: "xs" | "sm" | "md" | "lg";
}>;

export function FormDialog({
  open,
  title,
  children,
  confirmText = "Save",
  cancelText = "Cancel",
  submitting = false,
  onClose,
  onSubmit,
  maxWidth = "sm",
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>{cancelText}</Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
}
