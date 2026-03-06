export type DeliveryQRSessionStartResponse = {
  message?: string;
  message_type?: string;
  session_id: string;
  order_id: number;
  expires_in_seconds: number;
  expires_at?: string;
};

export type DeliveryQRConfirmResponse = {
  message: string;
  proof_image_url?: string;
};

export type DeliveryQRFlowErrorKind =
  | "invalid"
  | "expired"
  | "alreadyDelivered"
  | "fileInvalid"
  | "fileTooLarge"
  | "error";

export type DeliveryQRFlowError = {
  kind: DeliveryQRFlowErrorKind;
  message: string;
  statusCode?: number;
  errorCode?: string;
  proofImageUrl?: string;
};
