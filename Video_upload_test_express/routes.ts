import express from "express";
import multer from "multer";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./videos");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const uploadMiddleware = multer({ storage });

const files = (): Promise<string[] | null> => {
  return new Promise((resolve) => {
    fs.readdir("./videos", (err, files) => {
      if (err) {
        resolve(null);
      } else {
        resolve(files);
      }
    });
  });
};

const stream = (req: Request, res: Response) => {
  const index = parseInt(req.params.index);

  files().then((files) => {
    if (files == null) {
      res.status(500).json({ err: "Errror getting files" });
    } else if (index < 0 || index > files.length) {
      res.status(404).json({ err: "File not found" });
    } else {
      const videoPath = path.join("./videos", files[index]);
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        console.log(end);

        const chunksize = end - start + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "video/mp4",
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
      }

      console.log(fileSize);
      console.log(range);
    }
  });
};

//Routes

router.post(
  "/",
  uploadMiddleware.single("file"),
  (req: Request, res: Response) => {
    console.log("Upload Success");
    res
      .status(201)
      .json({ success: true, message: "Video uploaded successfully" });
  }
);

router.get("/filelength", (req: Request, res: Response) => {
  files().then((files) => {
    if (files == null) {
      res.status(500).json({ err: "Errror getting files" });
    } else {
      res.status(200).json({ fileLength: files.length });
    }
  });
});
router.get("/stream/:index", stream);
