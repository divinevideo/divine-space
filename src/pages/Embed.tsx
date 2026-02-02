import { useParams } from 'react-router-dom';
import { useDivineVideo } from '@/hooks/useDivineVideos';

/**
 * Minimal video embed page for Twitter player cards and other embeds.
 * This page renders just the video player without any UI chrome.
 */
export default function Embed() {
  const { id } = useParams<{ id: string }>();
  const { data: video, isLoading, error } = useDivineVideo(id);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white">
        <p>Video not found</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <video
        src={video.video_url}
        poster={video.thumbnail}
        controls
        autoPlay
        loop
        playsInline
        className="max-w-full max-h-full object-contain"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
