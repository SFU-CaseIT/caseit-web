"use client";

import React from "react";
import YouTube from "react-youtube";

const YoutubeVideo = () => {
  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
    },
  };

  const onReady = (event: any) => {
    event.target.pauseVideo();
  };

  return (
    <YouTube
      videoId="BMtjWKOfknw"
      opts={opts}
      onReady={onReady}
      className="h-[40vh]"
    />
  );
};

export default YoutubeVideo;
