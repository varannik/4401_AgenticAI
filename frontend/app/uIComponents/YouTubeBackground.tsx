'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubeBackground() {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const initializePlayer = () => {
      if (window.YT && window.YT.Player && playerRef.current) {
        playerInstanceRef.current = new window.YT.Player(playerRef.current, {
          videoId: 'SqixvcrBtks', // Video ID from the YouTube URL
          playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: 'SqixvcrBtks', // Required for looping
            controls: 0,
            showinfo: 0,
            rel: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              event.target.playVideo();
              event.target.mute();
            },
            onStateChange: (event: any) => {
              // Loop the video when it ends
              if (event.data === window.YT.PlayerState.ENDED) {
                event.target.playVideo();
              }
            },
          },
        });
      }
    };

    // Set up the callback for when YouTube API is ready
    if (window.YT && window.YT.Player) {
      initializePlayer();
    } else {
      window.onYouTubeIframeAPIReady = initializePlayer;
    }

    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden">
      {/* Dark overlay to make content more readable */}
      <div className="absolute inset-0 bg-black/30 z-10"></div>
      
      {/* YouTube video container */}
      <div className="relative w-full h-full">
        <div
          ref={playerRef}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '100vw',
            height: '56.25vw', // 16:9 aspect ratio
            minHeight: '100vh',
            minWidth: '177.78vh', // 16:9 aspect ratio
          }}
        />
      </div>
    </div>
  );
} 