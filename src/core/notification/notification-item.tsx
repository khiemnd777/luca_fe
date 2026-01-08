import { Box, ListItemText, Stack, Typography } from "@mui/material";

function NotificationItem({
  title,
  body,
  unread,
  right,
}: {
  title: React.ReactNode;
  body?: React.ReactNode;
  unread?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <ListItemText
        primary={
          <Typography component="span" sx={{ fontWeight: unread ? 700 : 500 }}>
            {title}
          </Typography>
        }
        secondary={body}
      />
      {right ? <Box sx={{ ml: 1 }}>{right}</Box> : null}
    </Stack>
  );
}

export default NotificationItem;
