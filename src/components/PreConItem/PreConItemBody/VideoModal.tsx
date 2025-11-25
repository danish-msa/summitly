"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Video } from 'lucide-react'

interface VideoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videos: string[]
}

const VideoModal: React.FC<VideoModalProps> = ({ open, onOpenChange, videos }) => {
  // Helper function to detect video platform and get embed URL
  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null

    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    // Direct video URL (mp4, webm, etc.)
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return url
    }

    return null
  }

  // Helper to check if URL is a direct video file
  const isDirectVideo = (url: string): boolean => {
    return /\.(mp4|webm|ogg|mov)$/i.test(url)
  }

  if (videos.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Property Videos</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No videos available</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Property Videos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {videos.map((videoUrl, index) => {
            const embedUrl = getVideoEmbedUrl(videoUrl)
            const isDirect = isDirectVideo(videoUrl)

            if (!embedUrl && !isDirect) {
              return (
                <div key={index} className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <div className="text-white text-center p-4">
                    <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Invalid video URL</p>
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline mt-2 block"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              )
            }

            return (
              <div key={index} className="space-y-2">
                {videos.length > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Video {index + 1} of {videos.length}
                  </p>
                )}
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {isDirect ? (
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full"
                      style={{ objectFit: 'contain' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <iframe
                      src={embedUrl || ''}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Property video ${index + 1}`}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VideoModal

