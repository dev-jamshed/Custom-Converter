const express = require('express');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4000;

app.get('/convert', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send('Missing URL');

  const filename = `audio-${Date.now()}.mp3`;
  const filePath = path.join(__dirname, filename);

  try {
    await youtubedl(videoUrl, {
      extractAudio: true,
      audioFormat: 'mp3',
      // ffmpegLocation: 'ffmpeg', // if ffmpeg is in PATH
      output: filename,
    });

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Download failed');
      } else {
        fs.unlink(filePath, () => {}); // delete after send
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Download failed');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
