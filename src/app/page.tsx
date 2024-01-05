"use client";
import { ChangeEvent, useEffect, useRef, useState } from "react";

export default function Home() {
  const [playing, setplaying] = useState<number>(0);
  const [videoListLength, setVideoListLength] = useState<number>(0);
  const [videoFile, setVideoFile] = useState<File | Blob | null>(null);
  const [uploading, setUploading] = useState<boolean | undefined>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Boolean>(false);
  const videoRef = useRef(null);

  const fetchVideosLength = async () => {
    const response = await fetch("http://localhost:4000/filelength");
    if (!response.ok) {
      console.error("Error fetching videos");
      setVideoListLength(0);
      return;
    }
    const data = await response.json();
    setVideoListLength(data.fileLength);
  };

  const handleVideoUpload = async () => {
    setUploading(true);
    setSuccess(false);
    setError(null);
    if (!videoFile) {
      setUploading(false);
      setSuccess(false);
      setError("No file Added");
      return;
    }
    const formData = new FormData();
    formData.append("file", videoFile);

    try {
      const response = await fetch("http://localhost:4000", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setSuccess(true);
      setError(null);
      window.location.reload();
      console.log("Upload success:", data);
    } catch (error) {
      setSuccess(false);
      setError(`Error uploading video: ${error}`);
    }
    setUploading(false);
  };

  useEffect(() => {
    fetchVideosLength();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      (videoRef.current as HTMLVideoElement).pause();
      (videoRef.current as HTMLVideoElement).removeAttribute("src");
      (videoRef.current as HTMLVideoElement).load();
    }
  }, [playing]);

  return (
    <main className="bg-slate-200 min-h-screen flex flex-col items-center gap-5">
      <div className="text-4xl font-bold p-4">Video Streaming</div>
      <div className=" bg-green-600">
        <video controls className="h-[450px] max-w-[450px]" ref={videoRef}>
          <source
            src={`http://localhost:4000/stream/${playing}`}
            type="video/mp4"
          />
          video not supported
        </video>
      </div>
      <div className="flex gap-2">
        {videoListLength <= 0 ? (
          <div>No videos found</div>
        ) : (
          Array(videoListLength)
            .fill(0)
            .map((item, index) => (
              <button
                className={`text-lg font-bold border-2 p-3 rounded-lg border-slate-700 ${
                  playing == index
                    ? "text-slate-200 bg-slate-700"
                    : "text-slate-700 bg-slate-200"
                }`}
                key={`${index}`}
                onClick={() => setplaying(index)}
              >
                Video {index + 1}
              </button>
            ))
        )}
      </div>
      <hr />
      <div className="text-2xl">
        <input
          type="file"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setVideoFile(e.target.files ? e.target.files[0] : null)
          }
        />
        <button
          onClick={handleVideoUpload}
          className="bg-red-200 p-2 rounded-lg disabled:bg-yellow-200"
          disabled={uploading}
        >
          {uploading ? <p>Uploading...</p> : <p>Upload New Video</p>}
        </button>
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        {success && (
          <div className="text-green-500 text-sm text-center">
            Upload suceess!
          </div>
        )}
      </div>
    </main>
  );
}
