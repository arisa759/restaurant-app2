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
  isMoveTargetSelected?: boolean
  subText?: string

  onEatingSeatClick?: (id: string) => void
  onOpenSeatMenu?: (id: string) => void
  onStartEatingSeats?: () => void
  onClearEatingSelection?: () => void
  onStartReservation?: () => void

  isReservedSeat?: boolean
  onStartReservedSeat?: () => void
  onCancelReservation?: () => void
  onOverrideReservation?: () => void

  seatMoveMode?: boolean
  onMoveSeatTarget?: () => void
  onStartSeatMove?: () => void

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
  isMoveTargetSelected = false,
  subText,
  onEatingSeatClick,
  onOpenSeatMenu,
  onStartEatingSeats,
  onClearEatingSelection,
  onStartReservation,
  isReservedSeat = false,
  onStartReservedSeat,
  onCancelReservation,
  onOverrideReservation,
  seatMoveMode = false,
  onMoveSeatTarget,
  onStartSeatMove,
}: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: top + height + 8, left })
  const [dragging, setDragging] = useState(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const timerRef = useRef<number | null>(null)
  const longPressRef = useRef(false)

  const isActive = activeSeatId === id
  const isDimmed = activeSeatId !== null && activeSeatId !== id

  const handleTouchStart = () => {
    longPressRef.current = false

    timerRef.current = window.setTimeout(() => {
      longPressRef.current = true

      setMenuPosition({
        top: top + height + 8,
        left: left,
      })

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

  const handleMenuPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true)

    dragOffsetRef.current = {
      x: e.clientX - menuPosition.left,
      y: e.clientY - menuPosition.top,
    }

    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleMenuPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return

    setMenuPosition({
      left: e.clientX - dragOffsetRef.current.x,
      top: e.clientY - dragOffsetRef.current.y,
    })
  }

  const handleMenuPointerUp = () => {
    setDragging(false)
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
    isMoveTargetSelected
      ? "yellow"
      : isEatingSelected
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
          if (seatMoveMode) {
            onMoveSeatTarget?.()
            return
          }

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
              onPointerDown={handleMenuPointerDown}
              onPointerMove={handleMenuPointerMove}
              onPointerUp={handleMenuPointerUp}
              style={{
                position: "absolute",
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 1000,
                touchAction: "none",
                cursor: dragging ? "grabbing" : "grab",
              }}
            >
              {isReservedSeat ? (
                <>
                  <button
                    onClick={() => {
                      onStartReservedSeat?.()
                      setShowMenu(false)
                      onClearEatingSelection?.()
                    }}
                  >
                    着席開始
                  </button>

                  <button
                    onClick={() => {
                      onOverrideReservation?.()
                      setShowMenu(false)
                      onClearEatingSelection?.()
                    }}
                  >
                    割り込み着席
                  </button>

                  <button
                    className="danger-menu-button"
                    onClick={() => {
                      onCancelReservation?.()
                      setShowMenu(false)
                      onClearEatingSelection?.()
                    }}
                  >
                    予約キャンセル
                  </button>

                  <button
                    onClick={() => {
                      onStartSeatMove?.()
                      setShowMenu(false)
                    }}
                  >
                    席移動
                  </button>

                  <button onClick={handleClose}>
                    閉じる
                  </button>
                </>
            ) : (
              <>
                {status === "empty" && (
                  <>
                    <button onClick={handleStart}>
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
                  </>
                )}

                {(status === "occupied" ||
                  status === "donabe" ||
                  status === "food") && (
                  <>
                    <button
                      onClick={() => {
                        onStartSeatMove?.()
                        setShowMenu(false)
                        onClearEatingSelection?.()
                      }}
                    >
                      席移動
                    </button>

                    <button
                      className="danger-menu-button"
                      onClick={handleLeave}
                    >
                      退店
                    </button>
                  </>
                )}

                <button onClick={handleClose}>
                  閉じる
                </button>
              </>
            )}
            </div>
          )}
    </>
  )
}

export default Seat