import { storage } from "../firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Helper: Calculate SHA-1 hex string using browser Web Crypto API
async function calculateSha1(text) {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-1", enc.encode(text));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper: Compress image to small Base64 JPEG data URL (<40KB)
export function compressImageToBase64(file, maxDimension = 350, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Robust Multi-Tier Image Upload:
 * Tier 1: Cloudinary Signed Upload (using API Key + Secret with SHA-1 signature)
 * Tier 2: Firebase Storage
 * Tier 3: Client-side compressed Base64 Data URL (guaranteed 100% fallback)
 */
export async function uploadProfileImage(file, uid) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dvfwfiohx";
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || "519882852215923";
  const apiSecret =
    import.meta.env.VITE_CLOUDINARY_API_SECRET || "RfSFtToCXM8m4O345lTNw2YKGcg";

  // Tier 1: Try Cloudinary Signed Upload
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await calculateSha1(`timestamp=${timestamp}${apiSecret}`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    } else {
      console.warn("Cloudinary signed upload returned non-200, trying tier 2...", await res.text());
    }
  } catch (err) {
    console.warn("Cloudinary signed upload failed, attempting Firebase Storage fallback:", err);
  }

  // Tier 2: Try Firebase Storage
  try {
    if (storage) {
      const storageRef = ref(storage, `profiles/${uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      if (downloadUrl) {
        return downloadUrl;
      }
    }
  } catch (err) {
    console.warn("Firebase Storage upload failed, attempting Base64 fallback:", err);
  }

  // Tier 3: Guaranteed client-side compressed Base64
  console.log("Using compressed Base64 storage fallback");
  return await compressImageToBase64(file);
}

