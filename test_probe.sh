#!/bin/bash

# Test Modal FFmpeg API

FFMPEG_API="https://abhirooprasad--ffmpeg-api-fastapi-app.modal.run"

echo "=== Test 1: Check FFmpeg API Health ==="
curl -s "$FFMPEG_API/health" | jq '.'

echo ""
echo "=== Test 2: Probe a video (need signed URL) ==="
echo "Get a video URL from your browser console, then run:"
echo "VIDEO_URL='<your-signed-url>'"
echo "curl -s \"$FFMPEG_API/probe?url=\$VIDEO_URL\" | jq '.'"

