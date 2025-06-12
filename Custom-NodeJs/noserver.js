const express = require("express");
const youtubedl = require("youtube-dl-exec");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(cors());

// Get Available Formats
// Get Available Formats
app.get("/formats", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send("Missing URL");

  try {
    const result = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificates: true,
    });

    const seen = new Set();
    const uniqueFormats = [];

    result.formats
      .filter(f => f.ext === "mp4" && f.height) // sirf mp4 aur resolution wale
      .forEach(f => {
        const key = `${f.height}p`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueFormats.push({
            quality: key,
            height: f.height,
            format_id: f.format_id,
          });
        }
      });

    uniqueFormats.sort((a, b) => b.height - a.height); // high to low

    res.json({
      title: result.title,
      thumbnail: result.thumbnail,
      formats: uniqueFormats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch formats");
  }
});

// Download with formatId
// app.get("/download", async (req, res) => {
//   const videoUrl = req.query.url;
//   const formatId = req.query.formatId;
//   const filename = `video-${Date.now()}.mp4`;
//   const filePath = path.join(__dirname, filename);

//   if (!videoUrl || !formatId) {
//     return res.status(400).send("Missing parameters");
//   }

//   try {
//     await youtubedl(videoUrl, {
//       format: formatId,
//       output: filename,
//       mergeOutputFormat: "mp4",
//     });

//     res.download(filePath, filename, (err) => {
//       if (err) {
//         console.error(err);
//         res.status(500).send("Download failed");
//       } else {
//         fs.unlink(filePath, () => { });
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Download failed");
//   }
// });

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const formatId = req.query.formatId;

  if (!videoUrl || !formatId) {
    return res.status(400).send("Missing parameters");
  }

  try {
    // Step 1: Get video info
    const info = await youtubedl(videoUrl, {
      dumpSingleJson: true,
    });

    let title = info.title || `video-${Date.now()}`;
    title = title.replace(/[\\/:*?"<>|]/g, ""); // Remove illegal characters

    const filename = `${title}.mp4`;
    const filePath = path.join(__dirname, filename);

    // Step 2: Download video
    await youtubedl(videoUrl, {
      format: formatId,
      output: filename,
      mergeOutputFormat: "mp4",
    });

    // Step 3: Send file
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Download failed");
      } else {
        fs.unlink(filePath, () => {});
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Download failed");
  }
});


// Convert to MP3
app.get("/convert", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send("Missing URL");

  const filename = `audio-${Date.now()}.mp3`;
  const filePath = path.join(__dirname, filename);

  try {
    await youtubedl(videoUrl, {
      extractAudio: true,
      audioFormat: "mp3",
      output: filename,
    });

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Download failed");
      } else {
        fs.unlink(filePath, () => { });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Download failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
