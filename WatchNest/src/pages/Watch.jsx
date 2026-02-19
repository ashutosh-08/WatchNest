import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { videoService, commentService, subscriptionService } from '../services/api.service'
import { useAuth } from '../context/AuthContext'
import Plyr from 'plyr'

const COMMENT_EMOJIS = ['😀', '😂', '😍', '🔥', '👏', '👍', '❤️', '🎉', '😎', '🤩', '🙌', '💯']
const USE_PROGRESS_ANCHORED_PREVIEW = true

const isStoryboardDebugEnabled = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('wn_storyboard_debug') === '1'
  } catch {
    return false
  }
}

const logStoryboardDebug = (...args) => {
  if (!isStoryboardDebugEnabled()) return
  console.log('[storyboard-preview]', ...args)
}

const parseVttTimeToSeconds = (raw = '') => {
  const parts = String(raw).trim().split(':')
  if (parts.length < 3) return NaN
  const hh = Number(parts[0] || 0)
  const mm = Number(parts[1] || 0)
  const ss = Number(parts[2] || 0)
  if (![hh, mm, ss].every(Number.isFinite)) return NaN
  return hh * 3600 + mm * 60 + ss
}

const parseVttToCues = (text = '', vttUrl = '') => {
  const blocks = String(text)
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const parsed = []
  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    const timing = lines.find((line) => line.includes('-->'))
    if (!timing) continue
    const [startRaw, endRaw] = timing.split('-->').map((s) => s.trim())
    const start = parseVttTimeToSeconds(startRaw)
    const end = parseVttTimeToSeconds(endRaw)
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue

    const imageLine = lines.find((line) => !line.includes('-->') && !/^WEBVTT/i.test(line))
    if (!imageLine) continue
    const [rawUrl, rawCoords] = imageLine.split('#xywh=')
    let url = rawUrl || ''
    try {
      url = new URL(rawUrl, vttUrl).toString()
    } catch {
      url = rawUrl
    }
    const [x = '0', y = '0', w = '160', h = '90'] = String(rawCoords || '')
      .split(',')
      .map((item) => item.trim())
    parsed.push({
      start,
      end,
      url,
      x: Number(x) || 0,
      y: Number(y) || 0,
      w: Number(w) || 160,
      h: Number(h) || 90,
    })
  }
  return parsed
}

const sanitizeCues = (input = []) =>
  Array.isArray(input)
    ? input
        .map((cue) => ({
          start: Number(cue?.start) || 0,
          end: Number(cue?.end) || 0,
          url: cue?.url || '',
          x: Number(cue?.x) || 0,
          y: Number(cue?.y) || 0,
          w: Number(cue?.w) || 160,
          h: Number(cue?.h) || 90,
        }))
        .filter((cue) => cue.url && cue.end >= cue.start)
        .sort((a, b) => a.start - b.start)
    : []

const StoryboardVideoPlayer = React.memo(function StoryboardVideoPlayer({
  mediaKey,
  src,
  vttUrl,
  poster,
  cues = [],
  durationSec = 0,
  onFirstPlay
}) {
  const playerShellRef = useRef(null)
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const hasPlayedRef = useRef(false)
  const onFirstPlayRef = useRef(onFirstPlay)
  const [resolvedCues, setResolvedCues] = useState([])
  const [hoverPreview, setHoverPreview] = useState({ visible: false, left: 0, top: null, cue: null, time: 0 })
  const [overlayHost, setOverlayHost] = useState(null)

  useEffect(() => {
    hasPlayedRef.current = false
  }, [src, mediaKey])

  useEffect(() => {
    onFirstPlayRef.current = onFirstPlay
  }, [onFirstPlay])

  useEffect(() => {
    let active = true
    const directCues = sanitizeCues(cues)
    const normalizedVttUrl = typeof vttUrl === 'string' ? vttUrl.trim() : ''

    if (directCues.length > 0) {
      setResolvedCues(directCues)
      return () => {
        active = false
      }
    }

    if (!normalizedVttUrl) {
      setResolvedCues([])
      return () => {
        active = false
      }
    }

    fetch(normalizedVttUrl)
      .then((res) => (res.ok ? res.text() : ''))
      .then((text) => {
        if (!active) return
        const parsed = parseVttToCues(text, normalizedVttUrl).sort((a, b) => a.start - b.start)
        setResolvedCues(parsed)
      })
      .catch((error) => {
        if (!active) return
        console.error('Failed parsing storyboard VTT on client:', error)
        setResolvedCues([])
      })

    return () => {
      active = false
    }
  }, [cues, vttUrl, mediaKey])

  const formatHoverTime = useCallback((secondsInput) => {
    const safe = Math.max(0, Math.floor(Number(secondsInput) || 0))
    const h = Math.floor(safe / 3600)
    const m = Math.floor((safe % 3600) / 60)
    const s = safe % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }, [])

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || !src) return

    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }

    let player = null

    try {
      player = new Plyr(videoEl, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
        tooltips: { controls: true, seek: true },
      })
    } catch (error) {
      console.error('Plyr init failed:', error)
      return
    }

    const handlePlay = () => {
      if (hasPlayedRef.current) return
      hasPlayedRef.current = true
      onFirstPlayRef.current?.()
    }

    player.on('play', handlePlay)
    const updateOverlayHost = () => {
      setOverlayHost(player?.elements?.container || playerShellRef.current || null)
    }
    const updateOverlayHostOnFsChange = () => {
      updateOverlayHost()
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(updateOverlayHost)
      }
    }
    const handleDocumentFullscreenChange = () => {
      updateOverlayHostOnFsChange()
    }

    player.on('ready', updateOverlayHost)
    player.on('enterfullscreen', updateOverlayHostOnFsChange)
    player.on('exitfullscreen', updateOverlayHostOnFsChange)
    document.addEventListener('fullscreenchange', handleDocumentFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleDocumentFullscreenChange)
    playerRef.current = player
    updateOverlayHost()

    return () => {
      if (player) {
        player.off('play', handlePlay)
        player.off('ready', updateOverlayHost)
        player.off('enterfullscreen', updateOverlayHostOnFsChange)
        player.off('exitfullscreen', updateOverlayHostOnFsChange)
        player.destroy()
      }
      document.removeEventListener('fullscreenchange', handleDocumentFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleDocumentFullscreenChange)
      if (playerRef.current === player || !player) {
        playerRef.current = null
      }
      setOverlayHost(null)
    }
  }, [src, vttUrl, mediaKey])

  const applyPreviewAtRatio = useCallback((ratio, layout = {}) => {
    if (resolvedCues.length === 0) return

    const safeRatio = Math.min(1, Math.max(0, ratio))
    const cueIndex = Math.min(
      resolvedCues.length - 1,
      Math.max(0, Math.floor(safeRatio * (resolvedCues.length - 1)))
    )
    const cue = resolvedCues[cueIndex]
    if (!cue) return

    const videoEl = videoRef.current
    const duration =
      Number(playerRef.current?.duration) ||
      Number(videoEl?.duration) ||
      Number(durationSec) ||
      Number(resolvedCues[resolvedCues.length - 1]?.end || 0)
    const hoverTime = duration > 0 ? safeRatio * duration : Number(cue.start || 0)
    const cueWidth = Number(cue?.w) || 160
    const cueHeight = Number(cue?.h) || 90
    const rawLeft = Number(layout?.leftPx)
    const rawHostWidth = Number(layout?.hostWidthPx)
    const rawProgressTop = Number(layout?.progressTopPx)

    let safeLeft = Number.isFinite(rawLeft) ? rawLeft : 0
    if (USE_PROGRESS_ANCHORED_PREVIEW && Number.isFinite(rawHostWidth) && rawHostWidth > 0) {
      const minLeft = cueWidth / 2 + 8
      const maxLeft = Math.max(minLeft, rawHostWidth - cueWidth / 2 - 8)
      safeLeft = Math.min(Math.max(safeLeft, minLeft), maxLeft)
    }

    const safeTop =
      USE_PROGRESS_ANCHORED_PREVIEW && Number.isFinite(rawProgressTop)
        ? Math.max(8, rawProgressTop - cueHeight - 14)
        : null

    setHoverPreview({
      visible: true,
      left: safeLeft,
      top: safeTop,
      cue,
      time: hoverTime,
    })
  }, [resolvedCues, durationSec])

  useEffect(() => {
    const hostEl = overlayHost || playerShellRef.current
    if (!hostEl || resolvedCues.length === 0) return
    const progressEl = playerRef.current?.elements?.container?.querySelector('.plyr__progress')

    const hidePreview = () => {
      setHoverPreview((prev) => (prev.visible ? { ...prev, visible: false } : prev))
    }

    if (USE_PROGRESS_ANCHORED_PREVIEW && progressEl) {
      logStoryboardDebug('bind strategy=progress', {
        mediaKey,
        fullscreenActive: Boolean(playerRef.current?.fullscreen?.active),
      })

      const handleProgressMove = (event) => {
        const hostRect = hostEl.getBoundingClientRect()
        const progressRect = progressEl.getBoundingClientRect()
        if (hostRect.width <= 0 || hostRect.height <= 0 || progressRect.width <= 0) {
          hidePreview()
          return
        }

        const localProgressX = Math.min(Math.max(event.clientX - progressRect.left, 0), progressRect.width)
        const ratio = localProgressX / Math.max(1, progressRect.width)
        const previewLeft = (progressRect.left - hostRect.left) + localProgressX
        const progressTop = progressRect.top - hostRect.top

        applyPreviewAtRatio(ratio, {
          leftPx: previewLeft,
          progressTopPx: progressTop,
          hostWidthPx: hostRect.width,
        })
      }

      progressEl.addEventListener('mousemove', handleProgressMove)
      progressEl.addEventListener('mouseenter', handleProgressMove)
      progressEl.addEventListener('mouseleave', hidePreview)
      hostEl.addEventListener('mouseleave', hidePreview)

      return () => {
        progressEl.removeEventListener('mousemove', handleProgressMove)
        progressEl.removeEventListener('mouseenter', handleProgressMove)
        progressEl.removeEventListener('mouseleave', hidePreview)
        hostEl.removeEventListener('mouseleave', hidePreview)
      }
    }

    logStoryboardDebug('bind strategy=host-fallback', {
      mediaKey,
      hasProgressElement: Boolean(progressEl),
    })

    const handleHostMove = (event) => {
      const hostRect = hostEl.getBoundingClientRect()
      if (hostRect.width <= 0 || hostRect.height <= 0) return

      const progressRect = progressEl?.getBoundingClientRect?.()
      let ratio = 0
      let previewLeft = 0
      if (progressRect && progressRect.width > 0) {
        const minY = progressRect.top - 24
        const maxY = progressRect.bottom + 24
        if (event.clientY < minY || event.clientY > maxY) {
          hidePreview()
          return
        }
        const localProgressX = Math.min(Math.max(event.clientX - progressRect.left, 0), progressRect.width)
        ratio = localProgressX / Math.max(1, progressRect.width)
        previewLeft = (progressRect.left - hostRect.left) + localProgressX
      } else {
        const localX = Math.min(Math.max(event.clientX - hostRect.left, 0), hostRect.width)
        const localY = Math.min(Math.max(event.clientY - hostRect.top, 0), hostRect.height)
        if (localY < hostRect.height - 120) {
          hidePreview()
          return
        }
        ratio = localX / Math.max(1, hostRect.width)
        previewLeft = localX
      }

      applyPreviewAtRatio(ratio, {
        leftPx: previewLeft,
        hostWidthPx: hostRect.width,
      })
    }

    hostEl.addEventListener('mousemove', handleHostMove)
    hostEl.addEventListener('mouseenter', handleHostMove)
    hostEl.addEventListener('mouseleave', hidePreview)
    document.addEventListener('mousemove', handleHostMove)
    document.addEventListener('mouseleave', hidePreview)

    return () => {
      hostEl.removeEventListener('mousemove', handleHostMove)
      hostEl.removeEventListener('mouseenter', handleHostMove)
      hostEl.removeEventListener('mouseleave', hidePreview)
      document.removeEventListener('mousemove', handleHostMove)
      document.removeEventListener('mouseleave', hidePreview)
    }
  }, [mediaKey, resolvedCues, applyPreviewAtRatio, overlayHost])

  return (
    <div
      key={mediaKey}
      ref={playerShellRef}
      className="relative w-full bg-black overflow-visible"
    >
      <video
        ref={videoRef}
        className="plyr-react w-full h-[480px] bg-black"
        crossOrigin="anonymous"
        playsInline
        controls
        poster={poster || undefined}
      >
        <source src={src || ''} type="video/mp4" />
        {vttUrl ? <track kind="metadata" src={vttUrl} default /> : null}
      </video>
      {(resolvedCues.length > 0 && (overlayHost || playerShellRef.current))
        ? createPortal(
            <div
              data-storyboard-fallback="1"
              className="absolute pointer-events-none z-[999]"
              style={{
                left: `${hoverPreview.left}px`,
                ...(USE_PROGRESS_ANCHORED_PREVIEW && Number.isFinite(hoverPreview.top)
                  ? { top: `${hoverPreview.top}px` }
                  : { bottom: '64px' }),
                transform: 'translateX(-50%)',
                opacity: hoverPreview.visible ? 1 : 0,
              }}
            >
              <div
                className="border border-white/35 rounded-md shadow-[0_12px_26px_rgba(0,0,0,0.5)] bg-black"
                style={{
                  width: `${hoverPreview.cue?.w || 160}px`,
                  height: `${hoverPreview.cue?.h || 90}px`,
                  backgroundImage: hoverPreview.cue?.url ? `url(${hoverPreview.cue.url})` : 'none',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `-${hoverPreview.cue?.x || 0}px -${hoverPreview.cue?.y || 0}px`,
                }}
              />
              <div className="mt-1 text-center text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {formatHoverTime(hoverPreview.time)}
              </div>
            </div>,
            overlayHost || playerShellRef.current
          )
        : null}
    </div>
  )
})

export default function Watch(){
  const {id} = useParams()
  const { user, isAuthenticated } = useAuth()
  const [video,setVideo] = useState(null)
  const [storyboard, setStoryboard] = useState(null)
  const [comments, setComments] = useState([])
  const [loading,setLoading]=useState(true)
  const [commentText, setCommentText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [ownerSubscribersCount, setOwnerSubscribersCount] = useState(0)
  const [subscribing, setSubscribing] = useState(false)
  const [recommendedVideos, setRecommendedVideos] = useState([])
  const [loadingRecommended, setLoadingRecommended] = useState(true)
  const [spark, setSpark] = useState(null)
  const [showBountyToast, setShowBountyToast] = useState(false)
  const [bountyPulse, setBountyPulse] = useState(false)
  const [bountyProgress, setBountyProgress] = useState(0)
  const subscribeButtonRef = useRef(null)
  const bountyBarRef = useRef(null)

  const getAvatarSrc = (avatar, name = 'User') => {
    if (avatar) return avatar
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U'
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='#e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' font-family='Arial, sans-serif' fill='#334155'>${initials}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  const resolveOwnerData = (entity) => {
    if (!entity) return {}
    const owner = entity.owner
    const ownerLooksLikeProfile =
      owner && typeof owner === 'object' && (owner.fullName || owner.username || owner.avatar)

    if (ownerLooksLikeProfile) return owner
    return entity.ownerDetails || {}
  }

  const resolveMediaUrl = (value) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object') {
      return value.secure_url || value.url || value.location || ''
    }
    return ''
  }

  const formatCompactViews = (views = 0) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`
    return `${views} views`
  }

  useEffect(()=>{
    let isActive = true

    const fetchData = async ()=>{
      setLoading(true)
      setVideo(null)
      setStoryboard(null)
      setComments([])
      try{
        const videoRes = await videoService.getVideoById(id)
        if (!isActive) return
        const videoData = videoRes?.data?.data || null
        const normalizedVideo = videoData
          ? {
              ...videoData,
              videoFile: resolveMediaUrl(
                videoData.videoFile || videoData.videoUrl || videoData.video_file
              ),
            }
          : null
        setVideo(normalizedVideo)
        setLoading(false)

        // Load non-critical data in parallel so video starts immediately.
        videoService
          .getVideoStoryboard(id)
          .then((storyboardRes) => {
            if (!isActive) return
            const sb = storyboardRes?.data?.data || null
            if (sb) {
              setStoryboard({
                ...sb,
                vttUrl: resolveMediaUrl(sb.vttUrl || sb.storyboardVttUrl),
                spriteUrl: resolveMediaUrl(sb.spriteUrl || sb.storyboardSpriteUrl),
              })
            } else {
              setStoryboard(null)
            }
          })
          .catch((storyboardError) => {
            if (!isActive) return
            console.error('Failed to fetch storyboard:', storyboardError)
            setStoryboard(null)
          })

        commentService
          .getVideoComments(id)
          .then((commentsRes) => {
            if (!isActive) return
            setComments(commentsRes?.data?.data || [])
          })
          .catch((commentsError) => {
            if (!isActive) return
            console.error('Failed to fetch comments:', commentsError)
            setComments([])
          })
      }catch(err){
        if (!isActive) return
        console.error('Failed to fetch:', err)
        setLoading(false)
      }
    }
    fetchData()
    return () => {
      isActive = false
    }
  },[id])

  useEffect(() => {
    let isActive = true
    const fetchRecommendedVideos = async () => {
      setLoadingRecommended(true)
      try {
        const res = await videoService.getAllVideos(1, 20)
        if (!isActive) return
        const payload = res?.data?.data
        const list = Array.isArray(payload) ? payload : payload?.videos
        const safeList = Array.isArray(list) ? list : []
        const filtered = safeList
          .filter((item) => item?._id && String(item._id) !== String(id))
          .slice(0, 8)
        setRecommendedVideos(filtered)
      } catch (err) {
        if (!isActive) return
        console.error('Failed to fetch recommended videos:', err)
        setRecommendedVideos([])
      } finally {
        if (isActive) setLoadingRecommended(false)
      }
    }

    fetchRecommendedVideos()
    return () => {
      isActive = false
    }
  }, [id])

  const handleFirstPlay = useCallback(() => {
    videoService.incrementViews(id).catch((error) => {
      console.error('Failed to increment views:', error)
    })
  }, [id])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !isAuthenticated) return

    setSubmittingComment(true)
    try {
      const res = await commentService.addComment(id, commentText)
      setComments([res.data.data, ...comments])
      setCommentText('')
      setShowEmojiPicker(false)
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleAddEmoji = (emoji) => {
    setCommentText((prev) => `${prev}${emoji}`)
    setShowEmojiPicker(false)
  }

  const videoOwner = resolveOwnerData(video)
  const resolvedVttUrl =
    resolveMediaUrl(storyboard?.vttUrl) ||
    resolveMediaUrl(video?.storyboard?.vttUrl) ||
    resolveMediaUrl(video?.storyboardVttUrl)
  const storyboardState =
    storyboard?.status ||
    video?.storyboard?.status ||
    video?.storyboardStatus ||
    'none'
  const ownerName = videoOwner.fullName || videoOwner.username || 'Unknown creator'
  const ownerAvatar = videoOwner.avatar
  const ownerUsername = videoOwner.username
  const ownerId = videoOwner._id
  const isOwnVideo = Boolean(ownerId && user?._id && String(ownerId) === String(user._id))
  const ownerSubscribers = ownerSubscribersCount || Number(videoOwner.subscribersCount) || 0
  const bountySource = videoOwner.activeBounty || video?.activeBounty || video?.bounty
  const hasActiveBounty = Boolean(
    bountySource &&
      (
        bountySource.isActive === true ||
        bountySource.active === true ||
        bountySource.status === 'active'
      )
  )
  const bountyCurrentSubscribers = Number(bountySource?.currentSubscribers) || ownerSubscribers
  const bountyTargetSubscribers =
    Number(bountySource?.targetSubscribers) || Math.max(bountyCurrentSubscribers + 20, 20)
  const bountyName = bountySource?.title || 'Weekly Creator Bounty'

  const triggerBountyPulse = () => {
    setBountyProgress((prev) => Math.min(100, prev + Math.max(1, Math.floor(100 / bountyTargetSubscribers))))
    setBountyPulse(true)
    setShowBountyToast(true)
    window.setTimeout(() => setBountyPulse(false), 320)
    window.setTimeout(() => setShowBountyToast(false), 1400)

    const buttonEl = subscribeButtonRef.current
    const barEl = bountyBarRef.current
    if (!buttonEl || !barEl) return

    const buttonRect = buttonEl.getBoundingClientRect()
    const barRect = barEl.getBoundingClientRect()
    const startX = buttonRect.left + buttonRect.width / 2
    const startY = buttonRect.top + buttonRect.height / 2
    const endX = barRect.left + barRect.width / 2
    const endY = barRect.top + barRect.height / 2

    setSpark({
      id: Date.now(),
      startX,
      startY,
      deltaX: endX - startX,
      deltaY: endY - startY,
    })
  }

  useEffect(() => {
    setOwnerSubscribersCount(Number(videoOwner.subscribersCount) || 0)
  }, [videoOwner.subscribersCount, ownerId])

  useEffect(() => {
    const initialProgress = Math.round((bountyCurrentSubscribers / bountyTargetSubscribers) * 100)
    setBountyProgress(Math.min(100, Math.max(0, initialProgress)))
  }, [bountyCurrentSubscribers, bountyTargetSubscribers, ownerId])

  useEffect(() => {
    const fetchSubscriptionState = async () => {
      if (!ownerId) return

      try {
        const res = await subscriptionService.getChannelSubscribers(ownerId)
        const list = Array.isArray(res?.data?.data) ? res.data.data : []
        setOwnerSubscribersCount(list.length)

        if (isAuthenticated && user?._id) {
          const currentUserSubscribed = list.some((entry) => {
            const subscriberId = entry?.subscriber?._id || entry?.subscriber
            return subscriberId && String(subscriberId) === String(user._id)
          })
          setIsSubscribed(currentUserSubscribed)
        } else {
          setIsSubscribed(false)
        }
      } catch (err) {
        console.error('Failed to fetch subscription state:', err)
      }
    }

    fetchSubscriptionState()
  }, [ownerId, isAuthenticated, user?._id])

  const handleToggleSubscription = async () => {
    if (!isAuthenticated || !ownerId || isOwnVideo || subscribing) return

    setSubscribing(true)
    try {
      const wasSubscribed = isSubscribed
      const res = await subscriptionService.toggleSubscription(ownerId)
      const payload = res?.data?.data || {}
      const nextSubscribed =
        typeof payload.isSubscribed === 'boolean' ? payload.isSubscribed : !wasSubscribed

      setIsSubscribed(nextSubscribed)
      if (typeof payload.subscribersCount === 'number') {
        setOwnerSubscribersCount(payload.subscribersCount)
      }

      if (!wasSubscribed && nextSubscribed && hasActiveBounty) {
        triggerBountyPulse()
      }
    } catch (err) {
      console.error('Failed to toggle subscription:', err)
    } finally {
      setSubscribing(false)
    }
  }

  if(loading) return (
    <div className="flex justify-center items-center min-h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39FF14]"></div>
    </div>
  )
  if(!video) return (
    <div className="text-center py-12">
      <p className="text-xl text-white/70">Video not found</p>
    </div>
  )

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {spark && (
          <motion.div
            key={spark.id}
            className="fixed top-0 left-0 z-[80] pointer-events-none"
            initial={{ x: spark.startX, y: spark.startY, scale: 0.6, opacity: 1 }}
            animate={{
              x: spark.startX + spark.deltaX,
              y: spark.startY + spark.deltaY,
              scale: [0.6, 1.1, 0.4],
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            onAnimationComplete={() => setSpark(null)}
          >
            <div className="h-3 w-3 rounded-full bg-[#00F0FF] shadow-[0_0_22px_rgba(0,240,255,0.95)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:col-span-2">
        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden mb-6">
          <StoryboardVideoPlayer
            key={id}
            mediaKey={id}
            src={resolveMediaUrl(video.videoFile)}
            vttUrl={resolvedVttUrl}
            poster={resolveMediaUrl(video.thumbnail)}
            cues={Array.isArray(storyboard?.cues) ? storyboard.cues : []}
            durationSec={Number(video?.duration) || 0}
            onFirstPlay={handleFirstPlay}
          />
        </div>
        <p className="text-xs text-white/65 mb-4">
          Storyboard status: <span className="text-white">{storyboardState}</span>
          {resolvedVttUrl ? ' | VTT URL present' : ' | no VTT URL for this video'}
        </p>

        {/* Video Info */}
        <div className="bg-[#1C2128]/95 border border-white/10 rounded-lg shadow-[0_18px_40px_rgba(0,0,0,0.35)] p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-3">{video.title}</h1>
          
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <img 
                src={getAvatarSrc(ownerAvatar, ownerName)}
                alt={ownerName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                {ownerUsername ? (
                  <Link to={`/channel/${ownerUsername}`} className="font-medium text-white hover:text-[#00F0FF]">
                    {ownerName}
                  </Link>
                ) : (
                  <span className="font-medium text-white">{ownerName}</span>
                )}
                <p className="text-xs text-white/60">
                  {ownerSubscribers} subscribers
                </p>
              </div>
            </div>
            {isAuthenticated && !isOwnVideo && (
              <motion.button
                ref={subscribeButtonRef}
                onClick={handleToggleSubscription}
                disabled={subscribing}
                whileTap={{ scale: 0.95 }}
                className={`relative overflow-hidden px-6 py-2 rounded-full font-semibold transition disabled:opacity-50 ${
                  isSubscribed
                    ? 'bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/60 shadow-[0_0_20px_rgba(57,255,20,0.24)]'
                    : hasActiveBounty
                      ? 'bg-transparent text-[#00F0FF] border border-[#00F0FF]/70 hover:bg-[#00F0FF]/10'
                      : 'bg-[#39FF14] text-black hover:brightness-110'
                }`}
              >
                <motion.span
                  initial={false}
                  animate={{ y: isSubscribed ? -44 : 0 }}
                  className="block"
                >
                  {subscribing ? 'Please wait...' : 'Subscribe'}
                </motion.span>
                <motion.span
                  initial={{ y: 44 }}
                  animate={{ y: isSubscribed ? -23 : 44 }}
                  className="absolute left-0 right-0 text-center text-white"
                >
                  Supporter
                </motion.span>
                {isSubscribed && (
                  <motion.div
                    layoutId="supporter-glow"
                    className="absolute inset-0 bg-[#39FF14]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.18 }}
                    transition={{ duration: 0.28 }}
                  />
                )}
              </motion.button>
            )}
          </div>

          {hasActiveBounty && (
            <div className="relative mb-4 rounded-xl border border-[#00F0FF]/35 bg-[#021118]/70 p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs tracking-[0.14em] uppercase text-[#00F0FF]">Bounty Pulse</p>
                <p className="text-xs text-white/75">{bountyCurrentSubscribers}/{bountyTargetSubscribers} supporters</p>
              </div>
              <p className="text-sm text-white/85 mb-3">{bountyName}</p>
              <motion.div
                ref={bountyBarRef}
                className="h-3 rounded-full bg-black/40 border border-[#00F0FF]/20 overflow-hidden"
                animate={{ scale: bountyPulse ? 1.03 : 1 }}
                transition={{ duration: 0.22 }}
              >
                <motion.div
                  className="h-full bg-[linear-gradient(90deg,#00F0FF_0%,#39FF14_100%)]"
                  animate={{ width: `${bountyProgress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </motion.div>
              <AnimatePresence>
                {showBountyToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24 }}
                    className="absolute -top-3 right-4 rounded-md border border-[#00F0FF]/35 bg-[#03212f] px-2.5 py-1 text-xs font-medium text-[#8CF8FF] shadow-[0_0_18px_rgba(0,240,255,0.35)]"
                  >
                    +1 Subscriber
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-white/65 mb-4">
            <span>{video.views.toLocaleString()} views</span>
            <span>•</span>
            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          </div>

          <p className="text-white/85 whitespace-pre-wrap">{video.description}</p>
        </div>

        {/* Comments Section */}
        <div className="bg-[#1C2128]/95 border border-white/10 rounded-lg shadow-[0_18px_40px_rgba(0,0,0,0.35)] p-6">
          <h2 className="text-2xl font-bold text-white mb-6">{comments.length} Comments</h2>

          {/* Add Comment */}
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="mb-6 pb-6 border-b border-white/10">
              <div className="flex gap-4">
                <img 
                  src={getAvatarSrc(user?.avatar, user?.fullName)}
                  alt={user?.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows={1}
                    className="w-full px-4 py-2 border border-white/15 bg-[#0f141a] text-white placeholder:text-white/45 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00F0FF] resize-none"
                  />
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className="px-3 py-2 text-sm text-white/85 border border-white/15 rounded-lg hover:bg-white/10 transition"
                      >
                        😀 Emoji
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute z-20 mt-2 p-2 w-52 rounded-lg border border-white/15 bg-[#111821] shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
                          <div className="grid grid-cols-6 gap-1">
                            {COMMENT_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleAddEmoji(emoji)}
                                className="h-8 w-8 rounded hover:bg-white/10 transition"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCommentText('')
                          setShowEmojiPicker(false)
                        }}
                        className="px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="px-4 py-2 bg-[#39FF14] text-black rounded-lg hover:brightness-110 transition disabled:opacity-50"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <p className="text-white/70 mb-6 pb-6 border-b border-white/10">
              Sign in to comment on this video
            </p>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment._id} className="flex gap-4">
                {(() => {
                  const commentOwner = resolveOwnerData(comment)
                  const commentOwnerName = commentOwner.fullName || commentOwner.username || 'Unknown user'
                  return (
                    <>
                <img 
                  src={getAvatarSrc(commentOwner.avatar, commentOwnerName)}
                  alt={commentOwnerName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{commentOwnerName}</span>
                    <span className="text-xs text-white/55">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white/85 mt-1">{comment.content}</p>
                </div>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside>
        <div className="bg-[#1C2128]/95 border border-white/10 rounded-lg shadow-[0_18px_40px_rgba(0,0,0,0.35)] p-4 sticky top-20">
          <h3 className="font-bold text-lg text-white mb-4">Recommended</h3>
          {loadingRecommended ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39FF14]"></div>
            </div>
          ) : recommendedVideos.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <p>No recommended videos yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendedVideos.map((recommendedVideo) => {
                const recommendedOwner = resolveOwnerData(recommendedVideo)
                const recommendedOwnerName =
                  recommendedOwner.fullName || recommendedOwner.username || 'Unknown creator'

                return (
                  <Link
                    to={`/watch/${recommendedVideo._id}`}
                    key={recommendedVideo._id}
                    className="block group"
                  >
                    <div className="flex gap-3">
                      <div className="w-40 aspect-video rounded-lg overflow-hidden bg-black/40 shrink-0">
                        <img
                          src={recommendedVideo.thumbnail || '/placeholder.png'}
                          alt={recommendedVideo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm text-white line-clamp-2 group-hover:text-[#00F0FF] transition">
                          {recommendedVideo.title}
                        </h4>
                        <p className="text-xs text-white/60 mt-1">{recommendedOwnerName}</p>
                        <p className="text-xs text-white/60">
                          {formatCompactViews(recommendedVideo.views || 0)}
                        </p>
                        <p className="text-xs text-white/60">
                          {new Date(recommendedVideo.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

