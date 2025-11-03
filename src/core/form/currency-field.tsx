import { TextField, type TextFieldProps } from "@mui/material";
import { NumericFormat, type NumericFormatProps } from "react-number-format";

type Props = Omit<TextFieldProps, "onChange" | "value"> & {
  value: number | null | undefined;
  onChange: (value: number) => void;
  thousandSeparator?: boolean;
  allowNegative?: boolean;
  decimalScale?: number;
  prefix?: string;
};

export function CurrencyField({
  value,
  onChange,
  thousandSeparator = true,
  allowNegative = false,
  decimalScale = 0,
  prefix = "₫",
  ...rest
}: Props) {
  return (
    <NumericFormat
      value={value ?? 0}
      thousandSeparator={thousandSeparator}
      allowNegative={allowNegative}
      decimalScale={decimalScale}
      customInput={TextField as any}
      prefix={prefix ? `${prefix} ` : undefined}
      onValueChange={(v) => onChange(v.floatValue ?? 0)}
      {...(rest as NumericFormatProps)}
    />
  );
}
