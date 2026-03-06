import * as React from "react";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import {
  confirmDeliveredByQRSession,
  startDeliveryQRSession,
} from "@features/order/api/order_delivery_qr.api";
import type {
  DeliveryQRConfirmResponse,
  DeliveryQRFlowError,
  DeliveryQRSessionStartResponse,
} from "@features/order/model/order-delivery-qr.model";

const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PROOF_SIZE = 5 * 1024 * 1024;

type DeliveryViewState =
  | {
    status: "loading";
  }
  | {
    status: "active";
    session: DeliveryQRSessionStartResponse;
  }
  | {
    status: "success";
    session: DeliveryQRSessionStartResponse;
    message: string;
    proofImageUrl?: string;
  }
  | {
    status: "expired";
    message: string;
    session?: DeliveryQRSessionStartResponse;
  }
  | {
    status: "invalid";
    message: string;
  }
  | {
    status: "alreadyDelivered";
    message: string;
    proofImageUrl?: string;
  }
  | {
    status: "error";
    message: string;
  };

function resolveDeadline(session: DeliveryQRSessionStartResponse): number {
  if (session.expires_at) {
    const parsed = new Date(session.expires_at).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  return Date.now() + Math.max(session.expires_in_seconds, 0) * 1000;
}

function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function mapViewStateFromError(error: DeliveryQRFlowError): DeliveryViewState {
  switch (error.kind) {
    case "invalid":
      return { status: "invalid", message: error.message };
    case "expired":
      return { status: "expired", message: error.message };
    case "alreadyDelivered":
      return {
        status: "alreadyDelivered",
        message: error.message,
        proofImageUrl: error.proofImageUrl,
      };
    default:
      return { status: "error", message: error.message };
  }
}

function validateProofFile(file: File): string | null {
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
    return "Ảnh xác nhận không hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP.";
  }

  if (file.size > MAX_PROOF_SIZE) {
    return "Ảnh xác nhận vượt quá dung lượng cho phép. Vui lòng chọn ảnh nhỏ hơn 5MB.";
  }

  return null;
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(size / 1024, 0.1).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export default function OrderDeliveryQRPage() {
  const { token } = useParams<{ token: string }>();
  const [viewState, setViewState] = React.useState<DeliveryViewState>({ status: "loading" });
  const [remainingSeconds, setRemainingSeconds] = React.useState(0);
  const [confirming, setConfirming] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = React.useState<File | null>(null);
  const [selectedPhotoPreviewUrl, setSelectedPhotoPreviewUrl] = React.useState<string | null>(null);
  const deadlineRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!selectedPhoto) {
      setSelectedPhotoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedPhoto);
    setSelectedPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedPhoto]);

  const moveToExpired = React.useEffectEvent((message: string) => {
    setViewState((current) => {
      if (current.status !== "active") return current;
      return { status: "expired", message, session: current.session };
    });
    setConfirming(false);
  });

  const syncCountdown = React.useEffectEvent(() => {
    const deadline = deadlineRef.current;
    if (!deadline) return;

    const secondsLeft = Math.max(Math.ceil((deadline - Date.now()) / 1000), 0);
    setRemainingSeconds(secondsLeft);

    if (secondsLeft === 0) {
      deadlineRef.current = null;
      moveToExpired("Phiên xác nhận đã hết hạn. Vui lòng quét lại QR.");
    }
  });

  const bootSession = React.useEffectEvent(async (qrToken: string) => {
    setViewState({ status: "loading" });
    setRemainingSeconds(0);
    setActionError(null);
    setSelectedPhoto(null);
    deadlineRef.current = null;

    try {
      const session = await startDeliveryQRSession(qrToken);
      const deadline = resolveDeadline(session);
      deadlineRef.current = deadline;
      setViewState({ status: "active", session });
      setRemainingSeconds(Math.max(Math.ceil((deadline - Date.now()) / 1000), 0));
    } catch (error) {
      deadlineRef.current = null;
      setViewState(mapViewStateFromError(error as DeliveryQRFlowError));
    }
  });

  React.useEffect(() => {
    if (!token) {
      setViewState({
        status: "invalid",
        message: "QR không hợp lệ. Vui lòng quét lại mã QR trên phiếu giao hàng.",
      });
      return;
    }

    void bootSession(token);
  }, [bootSession, token]);

  React.useEffect(() => {
    if (viewState.status !== "active") return;

    syncCountdown();
    const intervalId = window.setInterval(() => {
      syncCountdown();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [syncCountdown, viewState.status]);

  const canConfirm = viewState.status === "active" && remainingSeconds > 0 && !confirming;
  const canUpload = viewState.status === "active" && remainingSeconds > 0 && !confirming;
  const canConfirmWithPhoto = canConfirm && !!selectedPhoto;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!nextFile) return;

    const validationMessage = validateProofFile(nextFile);
    if (validationMessage) {
      setSelectedPhoto(null);
      setActionError(validationMessage);
      return;
    }

    setActionError(null);
    setSelectedPhoto(nextFile);
  };

  const handleConfirm = async () => {
    if (!canConfirmWithPhoto || viewState.status !== "active" || !selectedPhoto) return;

    setConfirming(true);
    setActionError(null);
    try {
      const response: DeliveryQRConfirmResponse = await confirmDeliveredByQRSession(selectedPhoto);
      deadlineRef.current = null;
      setRemainingSeconds(0);
      setViewState({
        status: "success",
        session: viewState.session,
        message: response.message || "Đơn hàng đã được xác nhận giao thành công",
        proofImageUrl: response.proof_image_url,
      });
    } catch (error) {
      const nextState = mapViewStateFromError(error as DeliveryQRFlowError);
      if (nextState.status === "error") {
        setActionError(nextState.message);
      } else if (nextState.status === "alreadyDelivered") {
        deadlineRef.current = null;
        setRemainingSeconds(0);
        setViewState(nextState);
      } else {
        deadlineRef.current = nextState.status === "expired" ? null : deadlineRef.current;
        setViewState(nextState);
      }
    } finally {
      setConfirming(false);
    }
  };

  const activeSession =
    viewState.status === "active" || viewState.status === "success"
      ? viewState.session
      : viewState.status === "expired"
        ? viewState.session
        : undefined;

  const proofImageUrl =
    viewState.status === "success" || viewState.status === "alreadyDelivered"
      ? viewState.proofImageUrl
      : undefined;

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        px: 2,
        py: 3,
        bgcolor: "grey.100",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 4,
          p: 3,
        }}
      >
        <Stack spacing={3} alignItems="stretch">
          <Stack spacing={1} alignItems="center" textAlign="center">
            {viewState.status === "success" ? (
              <CheckCircleOutlineRoundedIcon color="success" sx={{ fontSize: 52 }} />
            ) : viewState.status === "loading" ? (
              <CircularProgress size={44} />
            ) : viewState.status === "active" ? (
              <LocalShippingRoundedIcon color="primary" sx={{ fontSize: 52 }} />
            ) : (
              <QrCode2RoundedIcon color="action" sx={{ fontSize: 52 }} />
            )}

            <Typography variant="h5" fontWeight={700}>
              Xác nhận giao hàng
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Mở từ QR trên phiếu giao hàng để bắt đầu phiên xác nhận.
            </Typography>
          </Stack>

          {viewState.status === "loading" && (
            <Alert severity="info">Đang khởi tạo phiên giao hàng...</Alert>
          )}

          {viewState.status === "active" && (
            <Alert severity="success">{viewState.session.message}</Alert>
          )}

          {viewState.status === "success" && (
            <Alert severity="success">
              {viewState.message || "Đơn hàng đã được xác nhận giao thành công"}
            </Alert>
          )}

          {viewState.status === "expired" && (
            <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>
              {viewState.message || "Phiên xác nhận đã hết hạn. Vui lòng quét lại QR."}
            </Alert>
          )}

          {viewState.status === "invalid" && (
            <Alert severity="error">{viewState.message}</Alert>
          )}

          {viewState.status === "alreadyDelivered" && (
            <Alert severity="info">{viewState.message || "Đơn hàng đã được giao trước đó"}</Alert>
          )}

          {activeSession && (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                p: 2,
                bgcolor: "background.default",
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Mã đơn hàng
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    #{activeSession.order_id}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Thời gian còn lại
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color={remainingSeconds > 10 ? "text.primary" : "warning.main"}
                  >
                    {viewState.status === "success" ? "Hoàn tất" : formatCountdown(remainingSeconds)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          )}

          {(viewState.status === "error" || actionError) && (
            <Alert severity="error">
              {viewState.status === "error" ? viewState.message : actionError}
            </Alert>
          )}

          {viewState.status === "active" && (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                p: 2,
                bgcolor: "background.default",
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Ảnh xác nhận giao hàng
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trên thiết bị di động, trình duyệt có thể cho phép chụp ảnh trực tiếp hoặc chọn từ thư viện.
                </Typography>

                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  disabled={!canUpload}
                >
                  {selectedPhoto ? "Đổi ảnh xác nhận" : "Chụp hoặc chọn ảnh xác nhận"}
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                </Button>

                {selectedPhoto && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedPhoto.name} • {formatFileSize(selectedPhoto.size)}
                  </Typography>
                )}

                {selectedPhotoPreviewUrl && (
                  <Box
                    component="img"
                    src={selectedPhotoPreviewUrl}
                    alt="Ảnh xác nhận giao hàng"
                    sx={{
                      width: "100%",
                      borderRadius: 2,
                      maxHeight: 260,
                      objectFit: "cover",
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  />
                )}

                {!selectedPhoto && (
                  <Typography variant="body2" color="text.secondary">
                    Vui lòng chụp hoặc chọn một ảnh xác nhận trước khi hoàn tất.
                  </Typography>
                )}
              </Stack>
            </Paper>
          )}

          {proofImageUrl && (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                p: 2,
                bgcolor: "background.default",
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Ảnh xác nhận
                </Typography>
                <Box
                  component="img"
                  src={proofImageUrl}
                  alt="Proof giao hàng"
                  sx={{
                    width: "100%",
                    borderRadius: 2,
                    maxHeight: 260,
                    objectFit: "cover",
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <Typography
                  component="a"
                  href={proofImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="body2"
                  sx={{ wordBreak: "break-all" }}
                >
                  {proofImageUrl}
                </Typography>
              </Stack>
            </Paper>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={!canConfirmWithPhoto}
            onClick={handleConfirm}
            sx={{ minHeight: 52 }}
          >
            {confirming ? "Đang xác nhận..." : "Xác nhận đã giao"}
          </Button>

          {(viewState.status === "invalid" ||
            viewState.status === "expired" ||
            viewState.status === "alreadyDelivered") && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Vui lòng quay lại phiếu giao hàng và quét lại QR nếu cần tạo phiên mới.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
