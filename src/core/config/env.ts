// Không hardcode — đọc từ VITE_*
const baseAddress = import.meta.env.VITE_BASE_ADDRESS ?? "127.0.0.1:7999";
const httpProto = import.meta.env.VITE_HTTP_PROTOCOL ?? "http";
const wsProto = import.meta.env.VITE_WS_PROTOCOL ?? "ws";

export const env = {
  mode: import.meta.env.MODE,
  apiOrigin: `${httpProto}://${baseAddress}`, // vd: http://127.0.0.1:7999
  wsOrigin: `${wsProto}://${baseAddress}`,   // vd: ws://127.0.0.1:7999
  apiBasePath: "/api",                       // prefix bắt buộc của server
  apiBaseUrl: `${httpProto}://${baseAddress}/api`, // vd: http://127.0.0.1:7999/api
  wsBaseUrl: `${wsProto}://${baseAddress}/ws`, // vd: ws://127.0.0.1:7999/ws
};
