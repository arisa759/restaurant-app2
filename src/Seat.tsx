import { useEffect, useRef, useState } from "react"

type Props = {
  id: string
  top: number
  left: number
  width?: number
  height?: number
  activeSeatId: string | null
  setActiveSeatId: (id: string | null) => void
  onStart: (id: string, time: Date) => void
  onSeatClick?: (id: string) => void
  onLeave: (id: string) => void
  isReserveSelected?: boolean
  isMerged?: boolean
  displayLabel?: string
  status?:
    | "empty"
    | "occupied"
    | "donabe"
    | "food"
    | "reserved2h"
    | "reserved1h"
    | "reserved30m"
}

function Seat({
  id,
  top,
  left,
  width = 60,
  height = 60,
  activeSeatId,
  setActiveSeatId,
  onStart,
  onLeave,
  status = "empty",
  onSeatClick,
  displayLabel,
}: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = window.setInterval(() => {
        setNow(new Date())
    }, 1000)

    return () => {
        clearInterval(timer)
    }
   }, [])
  const timerRef = useRef<number | null>(null)
  const longPressRef = useRef(false)

  const isActive = activeSeatId === id
  const isDimmed = activeSeatId !== null && activeSeatId !== id

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getElapsedMinutes = () => {
    if (!startTime) return null

    const diffMs = now.getTime() - startTime.getTime()
    return Math.floor(diffMs / 1000 / 60)
  }

  const handleTouchStart = () => {
    longPressRef.current = false

    timerRef.current = window.setTimeout(() => {
      longPressRef.current = true
      setShowMenu(true)
      setActiveSeatId(id)
    }, 600)
  }

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  const handleStart = () => {
    const now = new Date()
    setStartTime(now)
    onStart(id, now)   // ←追加
    setShowMenu(false)
    setActiveSeatId(null)
  }

  const handleLeave = () => {
    onLeave(id)
    setStartTime(null)
    setShowMenu(false)
    setActiveSeatId(null)
  }

  const handleClose = () => {
    setShowMenu(false)
    setActiveSeatId(null)
  }
  const seatColor =
  status === "food"
    ? "red"
    : status === "donabe"
    ? "orange"
    : status === "occupied"
    ? "#bdbdbd"
    : status === "reserved30m"
    ? "black"
    : status === "reserved1h"
    ? "#007bff"
    : status === "reserved2h"
    ? "#87cefa"
    : "white"

  const textColor =
  status === "reserved30m" || status === "reserved1h" ? "white" : "black"
  const displayColor = seatColor

  return (

    <>
      <button
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => onSeatClick?.(id)}
        style={{
            position: "absolute",
            top: top,
            left: left,
            width: width,
            height: height,
            backgroundColor: displayColor,
            color: textColor,
            border: "2px solid black",
            outline: "none",
            borderRadius: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 18,
            fontWeight: "normal",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            touchAction: "manipulation",
            opacity: isDimmed ? 0.35 : 1,
            transform: isActive ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.18s ease-out, opacity 0.18s ease-out",
            zIndex: isActive ? 50 : 10,
        }}
      >

        <div>{displayLabel ?? id}</div>

        {startTime && (
            <>
            <div style={{ fontSize: 14 }}>
                {formatTime(startTime)}
            </div>
            <div style={{ fontSize: 14 }}>
                {getElapsedMinutes()}分
            </div>
            </>
        )}
        </button>
      {showMenu && (
        <div
            style={{
            position: "absolute",
            top: top + height + 8,
            left: left,
            zIndex: 100,
            width: 150,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
            animation: "popMenu 0.18s ease-out",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(0,0,0,0.25)",
            }}
        >
            <button
            onClick={handleStart}
            style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                color: "black",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(0,0,0,1)",
                textAlign: "center",
                fontWeight: "normal",
            }}
            >
            着席開始
            </button>
            <button
            onClick={handleLeave}
            style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                color: "black",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(0,0,0,0.2)",
                textAlign: "center",
                fontWeight: "normal",
            }}
            >
            退店
            </button>
            <button
            onClick={handleClose}
            style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                color: "black",
                backgroundColor: "transparent",
                border: "none",
                textAlign: "center",
                fontWeight: "normal",
            }}
            >
            閉じる
            </button>
        </div>
        )}
    </>
  )
}

export default Seat