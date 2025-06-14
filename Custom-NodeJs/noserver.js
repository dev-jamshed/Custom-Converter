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

// app.get("/download", async (req, res) => {
//   const videoUrl = req.query.url;
//   const formatId = req.query.formatId;

//   if (!videoUrl || !formatId) {
//     return res.status(400).send("Missing parameters");
//   }

//   try {
//     // Step 1: Get full video info
//     const info = await youtubedl(videoUrl, {
//       dumpSingleJson: true,
//     });

//     let title = info.title || `video-${Date.now()}`;
//     title = title.replace(/[\\/:*?"<>|]/g, ""); // Illegal characters hatao

//     const filename = `${title}.mp4`;
//     const filePath = path.join(__dirname, filename);

//     // Step 2: Check selected format
//     const selectedFormat = info.formats.find(f => f.format_id === formatId);
//     let formatString;

//     // Agar format me audio nahi hai to merge karo
//     if (selectedFormat && (!selectedFormat.acodec || selectedFormat.acodec === 'none')) {
//       formatString = `${formatId}+bestaudio`;
//     } else {
//       formatString = formatId;
//     }

//     // Step 3: Download and merge
//     await youtubedl(videoUrl, {
//       format: formatString,
//       output: filename,
//       mergeOutputFormat: "mp4", // Yeh zaroori hai merge ke liye
//     });

//     // Step 4: Send download response
//     res.download(filePath, filename, (err) => {
//       if (err) {
//         console.error(err);
//         res.status(500).send("Download failed");
//       } else {
//         fs.unlink(filePath, () => {}); // Temp file delete
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
  if (!videoUrl || !formatId) return res.status(400).send("Missing parameters");

  try {
    const info = await youtubedl(videoUrl, { dumpSingleJson: true });
    let title = info.title.replace(/[\\/:*?"<>|]/g, "");
    const filename = `${title}.mp4`;
    const filePath = path.join(__dirname, filename);

    const fmt = info.formats.find(f => f.format_id === formatId);
    let formatString;
    if (fmt && (!fmt.acodec || fmt.acodec === 'none')) {
      formatString = `${formatId}+bestaudio[ext=m4a]`;
    } else {
      formatString = formatId;
    }
    console.log("Using format:", formatString);

    await youtubedl(videoUrl, {
      format: formatString,
      output: filename,
      mergeOutputFormat: "mp4",
      // preferFFmpeg: true
    });

    res.download(filePath, filename, err => {
      fs.unlink(filePath, () => {});
      if (err) return res.status(500).send("Download failed");
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Download failed");
  }
});



app.get("/convert", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send("Missing URL");

  try {
    const info = await youtubedl(videoUrl, {
      dumpSingleJson: true,
    });

    let title = info.title || `audio-${Date.now()}`;
    title = title.replace(/[\\/:*?"<>|]/g, "");

    const filename = `${title}.mp3`;
    const filePath = path.join(__dirname, filename);

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
