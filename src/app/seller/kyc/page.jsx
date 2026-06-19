'use client'
// Location: app/seller/kyc/page.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  CheckCircle, Clock, XCircle, AlertCircle, ArrowRight,
  Camera, CreditCard, RefreshCw, RotateCcw, ChevronRight, Check, Globe, FileText
} from 'lucide-react'
import api from '@/lib/api'
import useAuthStore from '@/store/authStore'

/* ── Static data ─────────────────────────────────────────────────────── */
const DOCUMENT_TYPES = [
  { value: 'national_id',     label: 'National ID',      desc: 'Government-issued national identity card' },
  { value: 'passport',        label: 'Passport',         desc: 'International travel passport' },
  { value: 'drivers_licence', label: "Driver's Licence", desc: 'Government-issued driving licence' },
]

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bangladesh','Belarus','Belgium','Benin','Bolivia','Bosnia and Herzegovina',
  'Botswana','Brazil','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada',
  'Central African Republic','Chad','Chile','China','Colombia','Congo','Costa Rica',
  "Côte d'Ivoire",'Croatia','Cuba','Czech Republic','DR Congo','Denmark','Djibouti',
  'Dominican Republic','Ecuador','Egypt','El Salvador','Eritrea','Estonia','Eswatini',
  'Ethiopia','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece',
  'Guatemala','Guinea','Guinea-Bissau','Haiti','Honduras','Hungary','India','Indonesia',
  'Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
  'Kenya','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Liberia','Libya',
  'Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Mali','Malta','Mauritania',
  'Mauritius','Mexico','Moldova','Mongolia','Morocco','Mozambique','Myanmar','Namibia',
  'Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
  'Norway','Oman','Pakistan','Palestine','Panama','Paraguay','Peru','Philippines',
  'Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal',
  'Serbia','Sierra Leone','Singapore','Slovakia','Slovenia','Somalia','South Africa',
  'South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland',
  'Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo','Tunisia','Turkey',
  'Turkmenistan','Uganda','Ukraine','United Arab Emirates','United Kingdom',
  'United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
].sort()

/* ── Step config ─────────────────────────────────────────────────────── */
const CAMERA_STEPS = [
  { id: 'id_front', label: 'ID Front',       facingMode: 'environment' },
  { id: 'id_back',  label: 'ID Back',        facingMode: 'environment' },
  { id: 'selfie',   label: 'Selfie with ID', facingMode: 'user'        },
]

const ALL_STEPS = [
  { id: 'info', label: 'Document Info' },
  ...CAMERA_STEPS,
]

/* ── Step Progress Indicator ─────────────────────────────────────────── */
function StepIndicator({ currentStep, captures, docInfo }) {
  return (
    <div className="flex items-center justify-center">
      {ALL_STEPS.map((step, idx) => {
        const isDone   = idx === 0
          ? !!(docInfo.country && docInfo.documentType)
          : captures[step.id] != null
        const isActive = idx === currentStep
        const isPast   = idx < currentStep
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                isDone
                  ? 'bg-foreground border-foreground text-background'
                  : isActive
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-muted-foreground/50'
              }`}>
                {isDone ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap transition-colors ${
                isActive ? 'text-accent' : isDone ? 'text-foreground' : 'text-muted-foreground/50'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < ALL_STEPS.length - 1 && (
              <div className={`h-[2px] w-10 mx-1.5 mb-4 rounded-full transition-all duration-500 ${
                isPast || isDone ? 'bg-foreground' : 'bg-border'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Selfie Guide Illustration ───────────────────────────────────────── */
function SelfieGuideScreen({ onStart }) {
  return (
    <div className="space-y-4">
      {/* Viewport-sized guide card */}
      <div
        className="relative rounded-md overflow-hidden border border-accent/30 bg-muted"
        style={{ aspectRatio: '16/9' }}
      >
        <div className="absolute inset-0 flex items-center justify-center gap-6 px-8">

          {/* SVG Person illustration */}
          <div className="shrink-0">
            <svg width="130" height="200" viewBox="0 0 130 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Camera frame hint */}
              <rect x="2" y="2" width="126" height="196" rx="8"
                stroke="rgba(20,23,28,0.12)" strokeWidth="1.5" strokeDasharray="5 4"/>

              {/* Head */}
              <circle cx="65" cy="46" r="28"
                stroke="rgba(20,23,28,0.5)" strokeWidth="2" fill="rgba(20,23,28,0.04)"/>
              {/* Eyes */}
              <circle cx="55" cy="43" r="3.5" fill="rgba(20,23,28,0.45)"/>
              <circle cx="75" cy="43" r="3.5" fill="rgba(20,23,28,0.45)"/>
              {/* Smile */}
              <path d="M56 55 Q65 63 74 55"
                stroke="rgba(20,23,28,0.4)" strokeWidth="2" strokeLinecap="round" fill="none"/>

              {/* Neck */}
              <rect x="57" y="72" width="16" height="16" rx="3"
                fill="rgba(20,23,28,0.05)" stroke="rgba(20,23,28,0.2)" strokeWidth="1.5"/>

              {/* Shoulders / torso */}
              <path d="M12 130 Q12 88 65 88 Q118 88 118 130 L118 175 L12 175 Z"
                fill="rgba(20,23,28,0.04)" stroke="rgba(20,23,28,0.2)" strokeWidth="1.5"/>

              {/* Left arm */}
              <path d="M12 130 L8 112 L28 108"
                stroke="rgba(20,23,28,0.25)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              {/* Right arm */}
              <path d="M118 130 L122 112 L102 108"
                stroke="rgba(20,23,28,0.25)" strokeWidth="2" strokeLinecap="round" fill="none"/>

              {/* Hands holding card — left */}
              <ellipse cx="28" cy="110" rx="8" ry="6"
                fill="rgba(20,23,28,0.1)" stroke="rgba(20,23,28,0.25)" strokeWidth="1.5"/>
              {/* Hands — right */}
              <ellipse cx="102" cy="110" rx="8" ry="6"
                fill="rgba(20,23,28,0.1)" stroke="rgba(20,23,28,0.25)" strokeWidth="1.5"/>

              {/* ID Card — held at chest, just below chin */}
              <rect x="28" y="104" width="74" height="48" rx="6"
                fill="rgba(181,101,29,0.15)" stroke="#B5651D" strokeWidth="2.5"/>
              {/* Card shine */}
              <rect x="28" y="104" width="74" height="10" rx="6"
                fill="rgba(255,255,255,0.3)"/>
              {/* Card photo box */}
              <rect x="35" y="112" width="20" height="26" rx="3"
                fill="rgba(20,23,28,0.08)" stroke="rgba(20,23,28,0.25)" strokeWidth="1"/>
              {/* Card lines */}
              <line x1="62" y1="117" x2="95" y2="117" stroke="rgba(20,23,28,0.35)" strokeWidth="1.5"/>
              <line x1="62" y1="124" x2="90" y2="124" stroke="rgba(20,23,28,0.25)" strokeWidth="1.5"/>
              <line x1="62" y1="131" x2="87" y2="131" stroke="rgba(20,23,28,0.18)" strokeWidth="1.5"/>
              {/* Card bottom strip */}
              <rect x="35" y="142" width="60" height="5" rx="2"
                fill="rgba(181,101,29,0.5)"/>

              {/* Arrow pointing to card area */}
              <path d="M65 88 L65 100"
                stroke="rgba(181,101,29,0.8)" strokeWidth="2" strokeLinecap="round"
                strokeDasharray="3 3"/>

              {/* "CHEST LEVEL" label */}
              <rect x="14" y="155" width="102" height="14" rx="7"
                fill="rgba(181,101,29,0.12)" stroke="rgba(181,101,29,0.4)" strokeWidth="1"/>
              <text x="65" y="165" textAnchor="middle" fontSize="8"
                fill="#B5651D" fontWeight="600" letterSpacing="1">
                CHEST LEVEL
              </text>
            </svg>
          </div>

          {/* Checklist */}
          <div className="space-y-3 max-w-[210px]">
            <p className="text-sm font-bold text-foreground mb-4">How to take your selfie</p>

            {[
              { emoji: '😊', text: 'Look directly at the camera with your face clearly visible' },
              { emoji: '🪪', text: 'Hold your ID flat at chest level, just below your chin' },
              { emoji: '💡', text: 'Make sure you are in a well-lit area' },
              { emoji: '👁️', text: 'Both your face and all text on the ID must be readable' },
            ].map(({ emoji, text }, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-base shrink-0 mt-0.5">{emoji}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}

            {/* Bad example note */}
            <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-md bg-destructive/5 border border-destructive/20">
              <span className="text-sm shrink-0">❌</span>
              <p className="text-[11px] text-destructive leading-relaxed">
                Do not cover your face or hold the ID too low where it&apos;s out of frame
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-md bg-foreground hover:bg-foreground/90 text-background font-semibold text-base transition-all btn-press"
      >
        <Camera className="h-5 w-5" />
        I understand — Open Camera
      </button>
    </div>
  )
}

/* ── Camera Step ─────────────────────────────────────────────────────── */
function CameraStep({ step, captured, onCapture, onRetake, isLast, onNext, isSubmitting }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const mountedRef = useRef(true)

  // Show the selfie guide BEFORE opening the camera for that step
  const [showGuide,   setShowGuide]   = useState(step.id === 'selfie')
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)

  const hints = {
    id_front: "Point your camera at the front of your document. Ensure all four corners are visible and text is clearly readable.",
    id_back:  "Flip your document over and capture the back side. Make sure the image is in focus and not obscured.",
    selfie:   "Hold your ID at chest level just below your chin. Both your face and the ID must be clearly visible.",
  }

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (mountedRef.current) setCameraReady(false)
  }, [])

  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return
    setCameraError('')
    setCameraReady(false)

    // Give the browser time to fully release the previous stream
    await new Promise(r => setTimeout(r, 250))
    if (!mountedRef.current) return

    // Try preferred facing mode first, then fall back to any available camera
    const constraintSets = [
      { video: { facingMode: { ideal: step.facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: true, audio: false },
    ]

    let stream = null
    let lastErr = null
    for (const c of constraintSets) {
      try { stream = await navigator.mediaDevices.getUserMedia(c); break }
      catch (err) {
        lastErr = err
        if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') break
      }
    }

    if (!mountedRef.current) { stream?.getTracks().forEach(t => t.stop()); return }

    if (!stream) {
      setCameraError(
        lastErr?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : lastErr?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Could not start the camera. Please try again.'
      )
      return
    }

    streamRef.current = stream
    if (videoRef.current && mountedRef.current) {
      videoRef.current.srcObject = stream
      try { await videoRef.current.play() } catch { /* element gone */ }
      if (mountedRef.current) setCameraReady(true)
    }
  }, [step.facingMode])

  // Only auto-start if not showing the guide
  useEffect(() => {
    if (!captured && !showGuide) startCamera()
    return () => stopCamera()
  }, [captured, showGuide]) // eslint-disable-line react-hooks/exhaustive-deps

  const snap = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !cameraReady) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (step.facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `${step.id}.jpg`, { type: 'image/jpeg' })
      onCapture(file, URL.createObjectURL(blob))
      stopCamera()
    }, 'image/jpeg', 0.92)
  }

  const handleRetake = () => {
    // For selfie retake — show the guide again so they can re-read the instructions
    if (step.id === 'selfie') setShowGuide(true)
    onRetake()
  }

  // ── Selfie guide screen (before camera opens) ──
  if (step.id === 'selfie' && showGuide && !captured) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{hints.selfie}</p>
        <SelfieGuideScreen onStart={() => setShowGuide(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">{hints[step.id]}</p>

      {/* Viewport */}
      <div className="relative rounded-md overflow-hidden bg-black border border-border" style={{ aspectRatio: '16/9' }}>
        {captured ? (
          <>
            <Image src={captured.previewUrl} alt={step.label} fill className="object-contain" unoptimized />
            <div className="absolute top-3 right-3 w-8 h-8 rounded-md bg-accent flex items-center justify-center shadow-lg">
              <Check className="h-4 w-4 text-accent-foreground" />
            </div>
          </>
        ) : cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-card">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive text-sm max-w-xs">{cameraError}</p>
            <button onClick={startCamera} className="px-5 py-2.5 rounded-md border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-all btn-press">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${step.facingMode === 'user' ? '[transform:scaleX(-1)]' : ''}`}
              autoPlay playsInline muted
            />
            {/* Corner guides */}
            <div className="absolute inset-0 pointer-events-none p-6">
              <div className="relative w-full h-full">
                <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-white/60 rounded-tl" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-white/60 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-white/60 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-white/60 rounded-br" />
              </div>
            </div>
            {/* Selfie: persistent chest-level reminder bar at bottom of live view */}
            {step.id === 'selfie' && cameraReady && (
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-2 py-2 bg-black/60 backdrop-blur-sm">
                <span className="text-xs text-white/70">🪪</span>
                <p className="text-xs text-white/70 font-medium">Hold ID at chest level, below your chin</p>
              </div>
            )}
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-white/40 text-sm">Starting camera...</p>
              </div>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {captured ? (
        <div className="flex gap-3">
          <button
            onClick={handleRetake}
            className="flex items-center gap-2 px-5 py-3 rounded-md border border-border hover:border-accent/50 text-muted-foreground hover:text-foreground text-sm font-medium transition-all btn-press"
          >
            <RotateCcw className="h-4 w-4" /> Retake
          </button>
          <button
            onClick={onNext}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-md bg-foreground hover:bg-foreground/90 disabled:opacity-50 text-background font-semibold transition-all btn-press"
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> Submitting...</>
            ) : isLast ? (
              <>Submit for Verification <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Next Step <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={snap}
          disabled={!cameraReady || !!cameraError}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-md bg-foreground hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed text-background font-semibold text-lg transition-all btn-press"
        >
          <div className="w-6 h-6 rounded-full border-[3px] border-background flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full transition-all ${cameraReady ? 'bg-background' : 'bg-background/30'}`} />
          </div>
          {cameraReady ? 'Snap Photo' : 'Starting Camera...'}
        </button>
      )}
    </div>
  )
}

/* ── Document Info Step ──────────────────────────────────────────────── */
function DocInfoStep({ docInfo, onChange, onNext }) {
  const [countrySearch, setCountrySearch] = useState(docInfo.country || '')
  const [showDropdown,  setShowDropdown]  = useState(false)

  const filtered = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  ).slice(0, 8)

  const selectCountry = (c) => {
    onChange({ ...docInfo, country: c })
    setCountrySearch(c)
    setShowDropdown(false)
  }

  return (
    <div className="space-y-6">
      {/* Country */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent" /> Country of Issue
        </label>
        <div className="relative">
          <input
            type="text"
            value={countrySearch}
            onChange={(e) => { setCountrySearch(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search your country..."
            className="w-full px-4 py-3 rounded-md bg-background border border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 text-foreground placeholder:text-muted-foreground text-sm transition-all"
          />
          {showDropdown && countrySearch && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-border bg-card shadow-xl z-20 overflow-hidden">
              {filtered.map((c) => (
                <button
                  key={c}
                  onMouseDown={() => selectCountry(c)}
                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
        {docInfo.country && (
          <p className="text-xs text-accent flex items-center gap-1">
            <Check className="h-3 w-3" /> {docInfo.country} selected
          </p>
        )}
      </div>

      {/* Document type */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" /> Document Type
        </label>
        <div className="grid grid-cols-1 gap-3">
          {DOCUMENT_TYPES.map((dt) => {
            const selected = docInfo.documentType === dt.value
            return (
              <button
                key={dt.value}
                onClick={() => onChange({ ...docInfo, documentType: dt.value })}
                className={`flex items-start gap-3 p-4 rounded-md border text-left transition-all ${
                  selected
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-muted/30 hover:border-accent/40'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selected ? 'border-accent' : 'border-border'
                }`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>{dt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{dt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!docInfo.country || !docInfo.documentType}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md bg-foreground hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed text-background font-semibold transition-all btn-press"
      >
        Continue to Document Capture <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ── Status Banner ───────────────────────────────────────────────────── */
function StatusBanner({ kyc }) {
  if (!kyc || kyc.status === 'not_submitted') return null
  const map = {
    pending:  { color: 'border-accent/30 bg-accent/5 text-accent',          Icon: Clock,       title: 'KYC Under Review', body: 'Your documents are being reviewed. This usually takes 1–2 business days.' },
    approved: { color: 'border-chart-2/30 bg-chart-2/5 text-chart-2',       Icon: CheckCircle, title: 'KYC Approved',      body: 'Your identity has been verified. You can now set up your store and list products.' },
    rejected: { color: 'border-destructive/30 bg-destructive/5 text-destructive', Icon: XCircle, title: 'KYC Rejected',      body: kyc.rejection_reason || 'Your submission was rejected. Please resubmit with correct documents.' },
  }
  const cfg = map[kyc.status]
  if (!cfg) return null
  const { Icon } = cfg
  return (
    <div className={`rounded-md border p-5 ${cfg.color}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">{cfg.title}</p>
          <p className="text-sm mt-1 opacity-80">{cfg.body}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────── */
export default function SellerKYCPage() {
  const router = useRouter()
  const { user, isAuthenticated, checkAuth } = useAuthStore()

  const [kyc,         setKyc]         = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [currentStep, setCurrentStep] = useState(0)

  const [docInfo,  setDocInfo]  = useState({ country: '', documentType: '' })
  const [captures, setCaptures] = useState({ id_front: null, id_back: null, selfie: null })

  useEffect(() => { checkAuth() }, [checkAuth])

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login?redirect=/seller/kyc'); return }
    if (user && user.role !== 'seller') { router.replace('/'); return }
    const fetchKyc = async () => {
      try {
        const res = await api.get('/users/seller/kyc/')
        setKyc(res.data)
      } catch {
        setKyc({ status: 'not_submitted' })
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchKyc()
  }, [isAuthenticated, user, router])

  const handleCapture = (stepId) => (file, previewUrl) =>
    setCaptures(prev => ({ ...prev, [stepId]: { file, previewUrl } }))

  const handleRetake = (stepId) => () =>
    setCaptures(prev => ({ ...prev, [stepId]: null }))

  const handleNext = async () => {
    if (currentStep < ALL_STEPS.length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      await handleSubmit()
    }
  }

  const handleSubmit = async () => {
    const { id_front, id_back, selfie } = captures
    if (!id_front || !id_back || !selfie) { setError('Please capture all three documents.'); return }
    setError('')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('id_front',       id_front.file)
      fd.append('id_back',        id_back.file)
      fd.append('selfie_with_id', selfie.file)
      fd.append('country',        docInfo.country)
      fd.append('document_type',  docInfo.documentType)
      const res = await api.post('/users/seller/kyc/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setKyc(res.data)
      setCaptures({ id_front: null, id_back: null, selfie: null })
      setDocInfo({ country: '', documentType: '' })
      setCurrentStep(0)
    } catch (err) {
      setError(err?.response?.data?.error || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-[0.1em]">Loading KYC status...</p>
        </div>
      </div>
    )
  }

  const canSubmit  = kyc?.status === 'not_submitted' || kyc?.status === 'rejected'
  const isApproved = kyc?.status === 'approved'
  const cameraStep = currentStep > 0 ? CAMERA_STEPS[currentStep - 1] : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        <div className="text-center">
          <div className="w-16 h-16 rounded-md bg-foreground flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-background" />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Seller Onboarding</span>
          <h1 className="font-display font-bold text-3xl text-foreground mt-1">Identity Verification</h1>
          <p className="text-muted-foreground mt-2 text-sm">We need to verify your identity before you can start selling on NexCart.</p>
        </div>

        <StatusBanner kyc={kyc} />

        {isApproved && (
          <button
            onClick={() => router.push('/seller/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-md bg-foreground hover:bg-foreground/90 text-background font-semibold text-lg transition-all btn-press"
          >
            Go to Seller Dashboard <ArrowRight className="h-5 w-5" />
          </button>
        )}

        {canSubmit && (
          <div className="space-y-6">
            <StepIndicator currentStep={currentStep} captures={captures} docInfo={docInfo} />

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-destructive/5 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}

            <div className="rounded-md border border-border bg-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                {kyc?.status === 'rejected' && currentStep === 0 && (
                  <RefreshCw className="h-4 w-4 text-destructive shrink-0" />
                )}
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold font-mono">
                    Step {currentStep + 1} of {ALL_STEPS.length}
                  </p>
                  <h2 className="font-display text-lg font-bold text-foreground leading-tight">
                    {ALL_STEPS[currentStep].label}
                  </h2>
                </div>
              </div>

              {currentStep === 0 && (
                <DocInfoStep
                  docInfo={docInfo}
                  onChange={setDocInfo}
                  onNext={() => setCurrentStep(1)}
                />
              )}

              {currentStep > 0 && cameraStep && (
                <CameraStep
                  key={cameraStep.id}
                  step={cameraStep}
                  captured={captures[cameraStep.id]}
                  onCapture={handleCapture(cameraStep.id)}
                  onRetake={handleRetake(cameraStep.id)}
                  isLast={currentStep === ALL_STEPS.length - 1}
                  onNext={handleNext}
                  isSubmitting={submitting}
                />
              )}
            </div>

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(s => s - 1)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                ← Back to previous step
              </button>
            )}
          </div>
        )}

        {kyc?.status === 'pending' && (
          <div className="rounded-md border border-border bg-card p-8 text-center space-y-3">
            <Clock className="h-10 w-10 text-accent mx-auto" />
            <p className="font-display font-semibold text-foreground">Documents Under Review</p>
            <p className="text-muted-foreground text-sm">Your documents are in the review queue. You will be notified once a decision is made.</p>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Your documents are encrypted and stored securely. They are only used for identity verification.
        </p>
      </div>
    </div>
  )
}
