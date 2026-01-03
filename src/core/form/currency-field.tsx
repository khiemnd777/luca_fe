import { TextField, type TextFieldProps } from "@mui/material";
import { useDebounce } from "@root/core/hooks/use-debounce";
import { prefixCurrency } from "@root/shared/utils/currency.utils";
import { NumericFormat, type NumericFormatProps, type NumberFormatValues } from "react-number-format";

type Props = Omit<TextFieldProps, "onChange" | "value"> & {
  value: number | null | undefined;
  onChange: (value: number | undefined) => void;
  thousandSeparator?: boolean;
  allowNegative?: boolean;
  decimalScale?: number;
  prefix?: string;
};

export function CurrencyField({
  value,
  onChange,
  thousandSeparator = true,
  allowNegative = true,
  decimalScale = 0,
  prefix = prefixCurrency,
  ...rest
}: Props) {
  const handleValueChange = useDebounce((values: NumberFormatValues) => {
    onChange(values.floatValue);
  }, 300);

  return (
    <NumericFormat
      value={value}
      thousandSeparator={thousandSeparator}
      allowNegative={allowNegative}
      decimalScale={decimalScale}
      customInput={TextField as any}
      prefix={prefix ? `${prefix} ` : undefined}
      onValueChange={handleValueChange}
      {...(rest as NumericFormatProps)}
    />
  );
}
