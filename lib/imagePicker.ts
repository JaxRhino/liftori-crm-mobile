/**
 * Cross-platform image capture → a PhotoUploadFile body the CSC service can
 * upload. Native uses expo-image-picker (camera); web uses a hidden
 * <input type="file" capture> so the App-Viewer web preview still works.
 *
 * Native dep: expo-image-picker (added to package.json). Adding it requires a
 * fresh APK rebuild (`eas build --profile csc`) — OTA cannot ship native code.
 */
import { Platform } from "react-native";
import type { PhotoUploadFile } from "@/lib/services/csc";

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic")) return "heic";
  return "jpg";
}

/** Capture a photo on web via a hidden file input. Returns null if cancelled. */
function captureWeb(): Promise<PhotoUploadFile | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    // `capture` hints mobile-web browsers to open the camera.
    input.setAttribute("capture", "environment");
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const buf = await file.arrayBuffer();
      const contentType = file.type || "image/jpeg";
      resolve({ body: buf, contentType, ext: extFromMime(contentType) });
    };
    // Some browsers require the element to be in the DOM to fire the dialog.
    input.style.display = "none";
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 60_000);
  });
}

/** Capture a photo on native via the camera (expo-image-picker). */
async function captureNative(): Promise<PhotoUploadFile | null> {
  // Lazy require so web bundles never pull the native module.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ImagePicker = require("expo-image-picker");
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Camera permission is required to capture cleaning photos.");
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    exif: true,
    base64: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  // Fetch the local file:// uri into a blob for upload.
  const res = await fetch(asset.uri);
  const blob = await res.blob();
  const contentType = asset.mimeType || blob.type || "image/jpeg";
  const exif = asset.exif ?? {};
  return {
    body: blob,
    contentType,
    ext: extFromMime(contentType),
    latitude: typeof exif.GPSLatitude === "number" ? exif.GPSLatitude : null,
    longitude: typeof exif.GPSLongitude === "number" ? exif.GPSLongitude : null,
  };
}

/** Capture a single photo, choosing the right path per platform. */
export function capturePhoto(): Promise<PhotoUploadFile | null> {
  return Platform.OS === "web" ? captureWeb() : captureNative();
}
