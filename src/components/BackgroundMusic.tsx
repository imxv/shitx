'use client'

import { useEffect, useRef, useState } from 'react'

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // 尝试自动播放
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          // 设置音量
          audioRef.current.volume = 0.3
          await audioRef.current.play()
          setIsPlaying(true)
        } catch {
          // 自动播放被阻止，等待用户交互
          console.log('自动播放被阻止，需要用户交互')
        }
      }
    }

    // 延迟一下再尝试播放，确保音频元素已加载
    setTimeout(playAudio, 100)

    // 监听用户交互以启动播放
    const handleUserInteraction = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(console.error)
      }
    }

    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [isPlaying])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/shit4u.mp3"
        loop
        preload="auto"
      />
      <button
        onClick={togglePlay}
        className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-3 rounded-full hover:bg-black/90 transition-colors"
        aria-label={isPlaying ? '暂停音乐' : '播放音乐'}
      >
        {isPlaying ? '🔊' : '🔇'}
      </button>
    </>
  )
}