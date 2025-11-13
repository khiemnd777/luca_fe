import { ApartmentRounded, ShoppingCartRounded, StoreRounded } from "@mui/icons-material";
import BadgeIcon from '@mui/icons-material/Badge';

export const ICONS: Record<string, React.ReactNode> = {
  staff: <BadgeIcon color="primary" />,
  department: <ApartmentRounded color="info" />,
  product: <StoreRounded color="success" />,
  order: <ShoppingCartRounded color="warning" />,
};

export const LABELS: Record<string, string> = {
  staff: "Nhân sự",
};
