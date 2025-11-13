import { ApartmentRounded, ShoppingCartRounded, StoreRounded } from "@mui/icons-material";
import { Avatar, Box, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import BadgeIcon from '@mui/icons-material/Badge';

export const ICONS: Record<string, React.ReactNode> = {
  staff: <BadgeIcon color="primary" />,
  department: <ApartmentRounded color="info" />,
  product: <StoreRounded color="success" />,
  order: <ShoppingCartRounded color="warning" />,
};

function SearchItem({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <ListItem dense disableGutters>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: "transparent", color: "text.secondary" }}>{icon}</Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={<Box sx={{ fontWeight: 600 }}>{title}</Box>}
        secondary={subtitle}
      />
      {right ? <Box sx={{ ml: 1 }}>{right}</Box> : null}
    </ListItem>
  );
}

export default SearchItem;
