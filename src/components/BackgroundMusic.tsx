'use client'

import { useEffect, useRef, useState } from 'react'

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    // 尝试自动播放
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          // 设置音量更低，增加自动播放成功率
          audioRef.current.volume = 0.2
          // 设置静音启动（某些浏览器允许静音自动播放）
          audioRef.current.muted = true
          await audioRef.current.play()
          // 播放成功后立即取消静音
          audioRef.current.muted = false
          setIsPlaying(true)
          setHasInteracted(true)
        } catch {
          // 如果静音播放也失败，尝试正常播放
          try {
            audioRef.current.muted = false
            audioRef.current.volume = 0.2
            await audioRef.current.play()
            setIsPlaying(true)
            setHasInteracted(true)
          } catch {
            // 自动播放被阻止，等待用户交互
            console.log('自动播放被阻止，需要用户交互')
          }
        }
      }
    }

    // 延迟一下再尝试播放，确保音频元素已加载
    setTimeout(playAudio, 100)

    // 监听用户交互以启动播放
    const handleUserInteraction = () => {
      if (audioRef.current && !hasInteracted) {
        audioRef.current.volume = 0.2
        audioRef.current.muted = false
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true)
            setHasInteracted(true)
          })
          .catch(console.error)
      }
    }

    // 监听多种用户交互事件
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)
    document.addEventListener('scroll', handleUserInteraction)

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      document.removeEventListener('scroll', handleUserInteraction)
    }
  }, [hasInteracted])

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
      
      {/* 未播放时的提示 */}
      {!hasInteracted && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm animate-pulse">
          🎵 点击任意位置开启背景音乐
        </div>
      )}
      
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