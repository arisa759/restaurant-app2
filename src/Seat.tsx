import { useRef, useState } from "react"

type Props = {
  id: string
  top: number
  left: number
  width?: number
  height?: number
  activeSeatId: string | null
  onSeatClick?: (id: string) => void
  onLeave: (id: string) => void
  isReserveSelected?: boolean
  isMerged?: boolean
  displayLabel?: string
  isEatingSelected?: boolean
  subText?: string
  onEatingSeatClick?: (id: string) => void
  onOpenSeatMenu?: (id: string) => void
  onStartEatingSeats?: () => void
  onClearEatingSelection?: () => void
  onStartReservation?: () => void
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
  onLeave,
  status = "empty",
  onSeatClick,
  displayLabel,
  isReserveSelected = false,
  isEatingSelected = false,
  subText,
  onEatingSeatClick,
  onOpenSeatMenu,
  onStartEatingSeats,
  onClearEatingSelection,
  onStartReservation,
}: Props) {
  const [showMenu, setShowMenu] = useState(false)

  const timerRef = useRef<number | null>(null)
  const longPressRef = useRef(false)

  const isActive = activeSeatId === id
  const isDimmed = activeSeatId !== null && activeSeatId !== id

  const handleTouchStart = () => {
    longPressRef.current = false

    timerRef.current = window.setTimeout(() => {
      longPressRef.current = true
      setShowMenu(true)
      onOpenSeatMenu?.(id)
    }, 600)
  }

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  const handleStart = () => {
    onStartEatingSeats?.()
    setShowMenu(false)
    onClearEatingSelection?.()
  }
  const handleLeave = () => {
    onLeave(id)
    setShowMenu(false)
    onClearEatingSelection?.()
  }
  
  const handleClose = () => {
    setShowMenu(false)
    onClearEatingSelection?.()
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
  const displayColor =
  isEatingSelected
    ? "yellow"
    : isReserveSelected
    ? "yellow"
    : seatColor

  return (

    <>
      <button
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
       onClick={() => {
          if (activeSeatId) {
            onEatingSeatClick?.(id)
            return
          }

          onSeatClick?.(id)
        }}
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

        {subText && (
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {subText}
          </div>
        )}

        </button>
          {showMenu && (
              <div
                className="seat-menu"
                style={{
                  position: "absolute",
                  top: top + height + 6,
                  left: left,
                  zIndex: 1000,
                }}
              >
              <button
                onClick={() => {
                  handleStart()
                }}
              >
                着席開始
              </button>

              <button
                onClick={() => {
                  onStartReservation?.()
                  setShowMenu(false)
                  onClearEatingSelection?.()
                }}
              >
                予約
              </button>

              <button
                onClick={() => {
                  handleLeave()
                }}
              >
                退店
              </button>

              <button
                onClick={() => {
                  handleClose()
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