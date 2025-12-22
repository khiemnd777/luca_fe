
import { Box, Tooltip, Typography } from "@mui/material";
import QRCode from "react-qrcode-logo";

export type QRFieldProps = {
  value?: string | number | null;
  size?: number;
  tooltipSize?: number;
  level?: "L" | "M" | "Q" | "H";
  fgColor?: string;
  bgColor?: string;
  logoImage?: string;
  qrStyle?: 'squares' | 'dots' | 'fluid';
  emptyLabel?: string;
};

export function QRField({
  value,
  size = 64,
  tooltipSize = 200,
  level = "M",
  fgColor,
  bgColor,
  logoImage,
  qrStyle,
  emptyLabel = "—",
}: QRFieldProps) {
  if (value === null || value === undefined || value === "") {
    return <Typography>{emptyLabel}</Typography>;
  }

  const textValue = String(value);

  logoImage ?? (logoImage = "/luca.jpeg");
  qrStyle ?? (qrStyle = "fluid");

  const small = (
    <Box
      sx={{
        p: 0.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        display: "inline-flex",
        bgcolor: bgColor ?? "background.paper",
      }}
    >
      <QRCode
        value={textValue}
        size={size}
        ecLevel={level}
        fgColor={fgColor}
        bgColor={bgColor}
        logoImage={logoImage}
        qrStyle={qrStyle}
        eyeRadius={{ inner: 30, outer: 30 }}
      />
    </Box>
  );

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1, bgcolor: "background.paper", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
          <QRCode
            value={textValue}
            size={tooltipSize}
            ecLevel={level}
            fgColor={fgColor}
            bgColor={bgColor}
            logoImage={logoImage}
            qrStyle={qrStyle}
            eyeRadius={{ inner: 30, outer: 30 }}
          />
        </Box>
      }
      arrow
      placement="top"
    >
      {small}
    </Tooltip>
  );
}
