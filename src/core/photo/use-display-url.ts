import * as React from "react";
import { downloadPhotoWithMeta } from "@core/photo/download-photo.api";
import { bytesToBlobUrl } from "@shared/utils/file.utils";

export function useDisplayUrl(src?: string | null) {
  const [displayUrl, setDisplayUrl] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!src) {
      setDisplayUrl(undefined);
      return;
    }

    let active = true;
    let blobUrl: string | null = null;

    async function loadThumb() {
      try {
        // Nếu là URL trực tiếp → dùng luôn
        if (src!.startsWith("blob:") || src!.startsWith("data:") || src!.startsWith("http")) {
          if (active) setDisplayUrl(src!);
          return;
        }

        // Nếu là ID → tải từ server
        const { bytes, contentType } = await downloadPhotoWithMeta(src!, "thumbnail");
        blobUrl = bytesToBlobUrl(bytes, contentType);
        if (active) setDisplayUrl(blobUrl);
      } catch (err) {
        if (active) setDisplayUrl(src!);
      }
    }

    loadThumb();

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  return displayUrl;
}
