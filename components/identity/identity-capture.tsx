"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MediaPreview, privateAssetSrc } from "@/components/media/preview";
import { uploadSignedFile } from "@/components/media/upload";
import { Button } from "@/components/ui/button";
import {
  PHOTO_GUIDES,
  PHOTO_MAX_BYTES,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_SECONDS,
  VIDEO_MIN_SECONDS,
  videoPrompt,
} from "@/lib/identity/copy";
import { identityPhotoAccept, identityVideoAccept } from "@/lib/identity/mime";
import { slotPath } from "@/lib/identity/slots";
import type { IdentityRole } from "@/lib/r2/keys";

export function IdentityCapture({
  firstName,
  businessName,
  assets,
}: {
  firstName: string;
  businessName: string;
  assets: Partial<Record<IdentityRole, { assetId: string; mimeType: string }>>;
}) {
  return (
    <div className="mt-10 flex flex-col gap-10">
      <VideoCapture
        firstName={firstName}
        businessName={businessName}
        asset={assets.IDENTITY_VIDEO ?? null}
      />
      {(Object.keys(PHOTO_GUIDES) as Array<keyof typeof PHOTO_GUIDES>).map((role) => (
        <PhotoCapture key={role} role={role} asset={assets[role] ?? null} />
      ))}
    </div>
  );
}

function PhotoCapture({
  role,
  asset,
}: {
  role: keyof typeof PHOTO_GUIDES;
  asset: { assetId: string; mimeType: string } | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraLive, setCameraLive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const guide = PHOTO_GUIDES[role];

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!cameraLive) {
      return;
    }
    const live = liveRef.current;
    const stream = streamRef.current;
    if (!live || !stream) {
      return;
    }
    live.srcObject = stream;
    void live.play().catch(() => undefined);
  }, [cameraLive]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const live = liveRef.current;
    if (live) {
      live.srcObject = null;
    }
    setCameraLive(false);
    setCameraReady(false);
  }

  async function startCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("The camera is not available in this browser. Upload a photo instead.");
      return;
    }
    setRequesting(true);
    try {
      const stream = await openUserCamera();
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setCameraLive(true);
    } catch {
      setError("Camera access was not given. You can upload a photo instead.");
      stopCamera();
    } finally {
      setRequesting(false);
    }
  }

  async function snapPhoto() {
    const live = liveRef.current;
    if (!live) {
      return;
    }
    try {
      const file = await captureJpegFromVideo(live);
      stopCamera();
      await onFile(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not take that photo. Try again.");
    }
  }

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) {
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setError("That photo is too large. Keep it under 8 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setPending(true);
    setProgress(0);
    try {
      const slot = slotPath(role);
      const uploaded = await uploadSignedFile({
        signUrl: `/api/identity/${slot}/uploads`,
        completeUrl: `/api/identity/${slot}/complete`,
        file,
        mimeType: file.type || "image/jpeg",
        onProgress: setProgress,
      });
      if (uploaded.assetId) {
        setPreview(privateAssetSrc(uploaded.assetId));
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed. You can retry.");
    } finally {
      setPending(false);
    }
  }

  const shown = preview ?? (asset ? privateAssetSrc(asset.assetId) : null);
  const showLive = cameraLive || requesting;

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-display text-2xl text-foreground">{guide.title}</h2>
      <p className="mt-2 text-muted">{guide.instruction}</p>
      <p className="mt-2 text-sm text-muted">
        Face clear, good light, shoulders visible, one person, no heavy shadows, no filters, no
        sunglasses.
      </p>
      <video
        ref={liveRef}
        className={showLive ? "mt-4 w-full max-w-md rounded-md bg-black" : "hidden"}
        muted
        playsInline
        autoPlay
        onLoadedMetadata={() => setCameraReady(true)}
      />
      {!showLive && shown ? (
        <MediaPreview
          src={shown}
          mimeType={asset?.mimeType}
          alt={guide.title}
          className="mt-4 max-h-56 max-w-full rounded-md bg-surface-secondary"
        />
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {cameraLive ? (
          <>
            <Button type="button" disabled={!cameraReady || pending} onClick={() => void snapPhoto()}>
              Capture photo
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={stopCamera}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              busy={requesting}
              onClick={() => void startCamera()}
            >
              Take photo
            </Button>
            <Button type="button" variant="outline" disabled={pending || requesting} onClick={() => fileRef.current?.click()}>
              Upload photo
            </Button>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={identityPhotoAccept()}
        className="hidden"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      {pending && progress !== null ? <p className="mt-3 text-sm text-muted">Uploading {progress}%</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}

function VideoCapture({
  firstName,
  businessName,
  asset,
}: {
  firstName: string;
  businessName: string;
  asset: { assetId: string; mimeType: string } | null;
}) {
  const router = useRouter();
  const liveRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) {
      return;
    }
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      setSeconds(elapsed);
      if (elapsed >= VIDEO_MAX_SECONDS && recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
        setRecording(false);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const live = liveRef.current;
    if (live) {
      live.srcObject = null;
    }
  }

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording is not available in this browser. Upload a video instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      const live = liveRef.current;
      if (live) {
        live.srcObject = stream;
        void live.play().catch(() => undefined);
      }
      const mimeType = pickRecorderMime();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        const duration = (Date.now() - startedAtRef.current) / 1000;
        stopStream();
        void saveVideo(blob, duration);
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);
      recorder.start();
    } catch {
      setError("Camera access was not given. You can upload a video instead.");
      stopStream();
      setRecording(false);
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  async function saveVideo(file: Blob, durationSeconds: number) {
    if (durationSeconds < VIDEO_MIN_SECONDS || durationSeconds > VIDEO_MAX_SECONDS + 0.5) {
      setError("The reference video must be about 8 to 15 seconds.");
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      setError("That video is too large. Keep it under 40 MB.");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setPending(true);
    setProgress(0);
    try {
      const uploaded = await uploadSignedFile({
        signUrl: "/api/identity/video/uploads",
        completeUrl: "/api/identity/video/complete",
        file,
        mimeType: file.type || "video/webm",
        extraComplete: {
          durationSeconds: Math.min(VIDEO_MAX_SECONDS, Math.round(durationSeconds)),
        },
        onProgress: setProgress,
      });
      if (uploaded.assetId) {
        setPreviewUrl(privateAssetSrc(uploaded.assetId));
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed. You can retry.");
    } finally {
      setPending(false);
    }
  }

  async function onUpload(file: File | undefined) {
    if (!file) {
      return;
    }
    try {
      const duration = await readVideoDuration(file);
      await saveVideo(file, duration);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't read that video.");
    }
  }

  const shown = previewUrl ?? (asset ? privateAssetSrc(asset.assetId) : null);

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-display text-2xl text-foreground">Reference video</h2>
      <p className="mt-2 text-muted">
        About 8 to 15 seconds. Face the camera, speak naturally, good front lighting, quiet room. No
        music, filters, sunglasses, or anything covering your face.
      </p>
      <p className="mt-3 text-foreground">Suggested line: “{videoPrompt(firstName, businessName)}”</p>
      <video
        ref={liveRef}
        className={recording ? "mt-4 w-full max-w-md rounded-md bg-black" : "hidden"}
        muted
        playsInline
      />
      {!recording && shown ? (
        <MediaPreview
          src={shown}
          mimeType={asset?.mimeType ?? "video/webm"}
          alt="Reference video"
          className="mt-4 w-full max-w-md rounded-md bg-black"
        />
      ) : null}
      <p className="mt-3 text-sm text-muted">
        {recording ? `Recording ${Math.min(VIDEO_MAX_SECONDS, Math.floor(seconds))}s` : null}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {recording ? (
          <Button type="button" onClick={stopRecording}>
            Stop
          </Button>
        ) : (
          <Button type="button" busy={pending} onClick={() => void startRecording()}>
            Record Now
          </Button>
        )}
        <Button type="button" variant="outline" disabled={pending || recording} onClick={() => fileRef.current?.click()}>
          Upload Video
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={identityVideoAccept()}
        className="hidden"
        onChange={(event) => void onUpload(event.target.files?.[0])}
      />
      {pending && progress !== null ? <p className="mt-3 text-sm text-muted">Uploading {progress}%</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}

async function openUserCamera(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }
}

function captureJpegFromVideo(video: HTMLVideoElement): Promise<File> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    return Promise.reject(new Error("The camera is not ready yet. Try again."));
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return Promise.reject(new Error("We could not take that photo. Try again."));
  }
  context.drawImage(video, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("We could not take that photo. Try again."));
          return;
        }
        resolve(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}

function pickRecorderMime(): string | undefined {
  const types = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find((type) => MediaRecorder.isTypeSupported(type));
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const duration = el.duration;
      URL.revokeObjectURL(el.src);
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error("We couldn't read the length of that video."));
        return;
      }
      resolve(duration);
    };
    el.onerror = () => reject(new Error("We couldn't read that video."));
    el.src = URL.createObjectURL(file);
  });
}
