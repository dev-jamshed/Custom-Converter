const express = require("express");
const youtubedl = require("youtube-dl-exec");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 4000;

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
        fs.unlink(filePath, () => {}); // delete after send
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Download failed");
  }
});

// app.get('/download', async (req, res) => {
//   const videoUrl = req.query.url;
//   if (!videoUrl) return res.status(400).send('Missing URL');

//   const filename = `video-${Date.now()}.mp4`;
//   const filePath = path.join(__dirname, filename);

//   try {
//     await youtubedl(videoUrl, {
//       format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
//       output: filename,
//     });

//     res.download(filePath, filename, (err) => {
//       if (err) {
//         console.error(err);
//         res.status(500).send('Download failed');
//       } else {
//         fs.unlink(filePath, () => {});
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Download failed');
//   }
// });

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send("Missing URL");

  const filename = `video-${Date.now()}.mp4`;
  const filePath = path.join(__dirname, filename);

  try {
    await youtubedl(videoUrl, {
      output: filename,
      format: "mp4",
    //   ffmpegLocation: "ffmpeg", // Optional if in system PATH
      mergeOutputFormat: "mp4", // Ensure xmerge happens
      preferFreeFormats: true,
      noCheckCertificates: true,
    });

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
