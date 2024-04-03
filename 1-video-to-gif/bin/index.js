#!/usr/bin/env node

import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
ffmpeg.setFfprobePath("./ffprobe.exe");

const filePath = process.argv[2];
const inputStartTime = process.argv[3];
const inputEendTime = process.argv[4];

const startTimeSeconds = +(inputStartTime.at(-2) + "" + inputStartTime.at(-1));
const startTimeMinutes = +(inputStartTime.at(-5) + "" + inputStartTime.at(-4));
const startTimeHours = +(inputStartTime.at(-8) + "" + inputStartTime.at(-7));

const endTimeSeconds = +(inputEendTime.at(-2) + "" + inputEendTime.at(-1));
const endTimeMinutes = +(inputEendTime.at(-5) + "" + inputEendTime.at(-4));
const endTimeHours = +(inputEendTime.at(-8) + "" + inputEendTime.at(-7));

const endTime = 60 * 60 * endTimeHours + 60 * endTimeMinutes + endTimeSeconds;
const startTime =
  60 * 60 * startTimeHours + 60 * startTimeMinutes + startTimeSeconds;

if (startTime > endTime || isNaN(startTime) || isNaN(endTime)) {
  console.error("Invalid time stamps");
  process.exit(1);
}

if (!filePath) {
  console.error("Please provide the path to the MP4 file.");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error("File does not exist.");
  process.exit(1);
}

ffmpeg(filePath).ffprobe((err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    process.exit(1);
  }

  if (!data.format.format_name.includes("mp4")) {
    console.error("Invalid file type");
    process.exit(1);
  }

  let width = data.streams[0].width;
  let height = data.streams[0].height;
  while (width > 480 && height > 480) {
    width = width / 2;
    height = height / 2;
  }

  const watermarkPath = "./watermark.png";
  const outputFilePathMP4 = `./tempfile-${Date.now()}.mp4`;
  const outputFilePathGIF = `./output/video-${Date.now()}.gif`;

  ffmpeg(filePath)
    .FPS(12)
    .size(`${width}x${height}`)
    .setDuration(`${endTime - startTime}`)
    .setStartTime(inputStartTime)
    .output(outputFilePathMP4)
    .on("end", (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log("Stage 1 completed");
      if (!fs.existsSync(outputFilePathMP4)) {
        console.error("File does not exist.");
        process.exit(1);
      }

      ffmpeg(outputFilePathMP4)
        .input(watermarkPath)
        .complexFilter([
          "[1]format=rgba,scale=w=50:h=50:force_original_aspect_ratio=decrease[logo]",
          "[0][logo]overlay=W-w-10:H-h-10:format=auto,format=yuv420p",
        ])
        .output(outputFilePathGIF)
        .on("end", (err) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log("Stage 2 completed");
          fs.unlinkSync(outputFilePathMP4);
        })
        .run();
    })
    .run();
});

/**
 * ffmpeg -i video.mp4 -i watermark.png -filter_complex "[1]format=rgba,scale=w=326:h=490:force_original_aspect_ratio=decrease[logo]; [0][logo]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p" -ss 00:00:20 -t 00:00:25 -c:a copy watermark.gif
 * mp4gif ./video.mp4 00:16:00 00:16:05
 */
