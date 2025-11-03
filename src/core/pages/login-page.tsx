import * as React from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Paper,
  Alert,
} from "@mui/material";
import { useAuthStore } from "@store/auth-store";
import { Navigate, useSearchParams } from "react-router-dom";

export default function LoginPage() {
  const { isLoggedIn, login } = useAuthStore();
  const [search] = useSearchParams();
  const redirect = search.get("redirect") ?? "/";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  if (isLoggedIn) return <Navigate to={redirect} replace />;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // chặn reload trang
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login?.(email, password);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
    >
      <Paper elevation={3} sx={{ p: 4, width: 360 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography textTransform="uppercase" variant="h5" fontWeight={600} align="center">
              Đăng nhập
            </Typography>

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && (
              <Alert severity="error" variant="filled">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
