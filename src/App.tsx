import { useEffect, useRef, useState } from "react"
import "./App.css"
import Seat from "./Seat"

type Notification = {
  id: string
  text: string
}

type SeatStatus =
  | "empty"
  | "occupied"
  | "donabe"
  | "food"
  | "reserved2h"
  | "reserved1h"
  | "reserved30m"

  type MergedReserveGroup = {
  seats: string[]
  reservationSeatNumber: string
  pendingUntilEmpty: boolean
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeSeatId, setActiveSeatId] = useState<string | null>(null)
  const [seatTimes, setSeatTimes] = useState<{ [key: string]: Date }>({})
  const [reservationTimes, setReservationTimes] = useState<{ [key: string]: Date }>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [seatStatuses, setSeatStatuses] = useState<{ [key: string]: SeatStatus }>({})
  const [confirmFoodCheck, setConfirmFoodCheck] = useState<{
    seatId: string
    notificationId: string
  } | null>(null)

  const [reservationMode, setReservationMode] = useState(false)
  const [selectedReserveSeats, setSelectedReserveSeats] = useState<string[]>([])
  const [reserveTimeText, setReserveTimeText] = useState("")
  const [reserveDisplayNumber, setReserveDisplayNumber] = useState("")
  const [mergedReserveGroups, setMergedReserveGroups] = useState<MergedReserveGroup[]>([])
  const [reservationLabels, setReservationLabels] = useState<{ [key: string]: string }>({})
  const reservationTimeOptions = Array.from({ length: 61 }, (_, i) => {
  const totalMinutes = 17 * 60 + i * 5
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
})

  const firedRef = useRef<{ [key: string]: boolean }>({})

  const counterSeats = [
    "k1", "(k1)", "k2", "k3", "k4", "k5", "k6", "k7", "k8",
    "k9", "k10", "k11", "k12", "k13", "k14", "k15", "k16",
  ]

  const tableSeats = ["201", "2021", "2022", "2031", "2032", "204"]
  const zashikiSeats = ["301", "302", "303", "304"]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatCurrentTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleStart = (id: string, time: Date) => {
    const currentStatus = seatStatuses[id]

    if (
      currentStatus === "occupied" ||
      currentStatus === "donabe" ||
      currentStatus === "food"
    ) {
      alert("お食事中です。")
      return
    }

    setSeatTimes((prev) => ({
      ...prev,
      [id]: time,
    }))

    setSeatStatuses((prev) => ({
      ...prev,
      [id]: "occupied",
    }))
  }

  const handleLeave = (id: string) => {
    setSeatTimes((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    setSeatStatuses((prev) => ({
      ...prev,
      [id]: "empty",
    }))

    firedRef.current[`${id}-donabe`] = false
    firedRef.current[`${id}-food`] = false

    setNotifications((prev) =>
      prev.filter(
        (n) => n.text !== `土鍋 ${id}` && n.text !== `フード ${id}`
      )
    )
  }

  const getSeatGroup = (id: string) => {
    if (counterSeats.includes(id)) return "counter"
    if (tableSeats.includes(id)) return "table"
    if (zashikiSeats.includes(id)) return "zashiki"
    return "other"
  }

  const handleReserveSeatClick = (id: string) => {
    if (!reservationMode) return

    const clickedGroup = getSeatGroup(id)

    if (selectedReserveSeats.length > 0) {
      const currentGroup = getSeatGroup(selectedReserveSeats[0])

      if (clickedGroup !== currentGroup) {
        alert("同じ種類の席だけ選択できます")
        return
      }
    }

    setSelectedReserveSeats((prev) => {
      if (prev.includes(id)) {
        return prev.filter((seatId) => seatId !== id)
      }

      return [...prev, id]
    })
  }

  const getRepresentativeSeatId = (seats: string[]) => {
    if (seats.length === 0) return ""

    const group = getSeatGroup(seats[0])

    if (group === "counter") {
      return [...seats].sort((a, b) => {
        const numA = Number(a.replace("k", "").replace("(", "").replace(")", ""))
        const numB = Number(b.replace("k", "").replace("(", "").replace(")", ""))
        return numA - numB
      })[0]
    }

    if (group === "zashiki" || group === "table") {
      return [...seats].sort((a, b) => Number(a) - Number(b))[0]
    }

    return seats[0]
  }

  const getReservationSeatNumber = () => {
    if (selectedReserveSeats.length === 0) return ""

    const group = getSeatGroup(selectedReserveSeats[0])

    if (group === "counter") {
      return [...selectedReserveSeats].sort(
        (a, b) => Number(a.replace("k", "")) - Number(b.replace("k", ""))
      )[0]
    }

    if (group === "zashiki") {
      return [...selectedReserveSeats].sort((a, b) => Number(a) - Number(b))[0]
    }

    if (group === "table") {
      return reserveDisplayNumber
    }

    return selectedReserveSeats[0]
  }

  const handleConfirmReservation = () => {
    if (selectedReserveSeats.length === 0) {
      alert("予約する席を選択してください")
      return
    }

    if (!reserveTimeText) {
      alert("予約時間を入力してください")
      return
    }

    const group = getSeatGroup(selectedReserveSeats[0])
    const reservationSeatNumber = getReservationSeatNumber()

    if (group === "table" && !reservationSeatNumber) {
      alert("テーブル席の予約席番号を入力してください")
      return
    }

    const [hourText, minuteText] = reserveTimeText.split(":")
    const hour = Number(hourText)
    const minute = Number(minuteText)

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      alert("18:30 のように入力してください")
      return
    }

    const reserveTime = new Date()
    reserveTime.setHours(hour)
    reserveTime.setMinutes(minute)
    reserveTime.setSeconds(0)
    reserveTime.setMilliseconds(0)

    const hasEatingSeat = selectedReserveSeats.some((seatId) =>
      ["occupied", "donabe", "food"].includes(seatStatuses[seatId])
    )

    const representativeSeatId = getRepresentativeSeatId(selectedReserveSeats)

    selectedReserveSeats.forEach((seatId) => {
      setReservationTimes((prev) => ({
        ...prev,
        [seatId]: reserveTime,
      }))

      if (!hasEatingSeat) {
        setSeatStatuses((prev) => ({
          ...prev,
          [seatId]: "reserved2h",
        }))
      }
    })

    if (selectedReserveSeats.length > 1 && hasEatingSeat) {
      setMergedReserveGroups((prev) => [
        ...prev,
        {
          seats: selectedReserveSeats,
          reservationSeatNumber,
          pendingUntilEmpty: true,
        },
      ])
    }

    if (!hasEatingSeat) {
      setReservationLabels((prev) => {
        const next = { ...prev }

        selectedReserveSeats.forEach((seatId) => {
          if (seatId === representativeSeatId) {
            next[seatId] = reservationSeatNumber
          } else {
            next[seatId] = ""
          }
        })

        return next
      })
    }

    alert(`予約席番号：${reservationSeatNumber}\n予約時間：${reserveTimeText}`)

    setReservationMode(false)
    setSelectedReserveSeats([])
    setReserveTimeText("")
    setReserveDisplayNumber("")
  }

  useEffect(() => {
  mergedReserveGroups.forEach((group) => {
    if (!group.pendingUntilEmpty) return

    const stillEating = group.seats.some((seatId) =>
      ["occupied", "donabe", "food"].includes(seatStatuses[seatId])
    )

    if (stillEating) return

    const representativeSeatId = getRepresentativeSeatId(group.seats)

    group.seats.forEach((seatId) => {
      setSeatStatuses((prev) => ({
        ...prev,
        [seatId]: "reserved2h",
      }))
    })

    setReservationLabels((prev) => {
      const next = { ...prev }

      group.seats.forEach((seatId) => {
        if (seatId === representativeSeatId) {
          next[seatId] = group.reservationSeatNumber
        } else {
          next[seatId] = ""
        }
      })

      return next
    })

    setMergedReserveGroups((prev) =>
      prev.filter((g) => g !== group)
    )
  })
}, [seatStatuses, mergedReserveGroups])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()

      Object.entries(seatTimes).forEach(([id, startTime]) => {
        const diff = (now.getTime() - startTime.getTime()) / 60000

        const donabeKey = `${id}-donabe`
        const foodKey = `${id}-food`

        if (diff >= 1 && !firedRef.current[donabeKey]) {
          firedRef.current[donabeKey] = true
          setNotifications((prev) => [
            ...prev,
            { id: donabeKey, text: `土鍋 ${id}` },
          ])
        }

        if (diff >= 2 && !firedRef.current[foodKey]) {
          firedRef.current[foodKey] = true
          setNotifications((prev) => [
            ...prev,
            { id: foodKey, text: `フード ${id}` },
          ])
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [seatTimes])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()

      Object.entries(reservationTimes).forEach(([id, reserveTime]) => {
        const diff = (reserveTime.getTime() - now.getTime()) / 60000

        setSeatStatuses((prev) => {
          if (
            prev[id] === "occupied" ||
            prev[id] === "donabe" ||
            prev[id] === "food"
          ) {
            return prev
          }

          if (diff >= 0 && diff <= 30) {
            return { ...prev, [id]: "reserved30m" }
          }

          if (diff > 30 && diff <= 60) {
            return { ...prev, [id]: "reserved1h" }
          }

          return { ...prev, [id]: "reserved2h" }
        })
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [reservationTimes])

  const handleNotificationClick = (text: string, notificationId: string) => {
    const [type, seatId] = text.split(" ")

    if (type === "フード") {
      const hasDonabeNotification = notifications.some(
        (n) => n.text === `土鍋 ${seatId}`
      )

      if (hasDonabeNotification) {
        setConfirmFoodCheck({ seatId, notificationId })
        return
      }

      setSeatStatuses((prev) => ({
        ...prev,
        [seatId]: "food",
      }))

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      return
    }

    if (type === "土鍋") {
      setSeatStatuses((prev) => {
        if (prev[seatId] === "food") return prev
        return { ...prev, [seatId]: "donabe" }
      })

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    }
  }

  const handleConfirmYes = () => {
    if (!confirmFoodCheck) return

    const { seatId, notificationId } = confirmFoodCheck

    setSeatStatuses((prev) => ({
      ...prev,
      [seatId]: "food",
    }))

    setNotifications((prev) =>
      prev.filter((n) => {
        const isClickedFood = n.id === notificationId
        const isSameSeatDonabe = n.text === `土鍋 ${seatId}`
        return !isClickedFood && !isSameSeatDonabe
      })
    )

    setConfirmFoodCheck(null)
  }

  const handleConfirmNo = () => {
    setConfirmFoodCheck(null)
  }

    const seatCommonProps = (id: string) => ({
      activeSeatId,
      setActiveSeatId,
      onStart: handleStart,
      onLeave: handleLeave,
      status: seatStatuses[id] ?? "empty",
      onSeatClick: handleReserveSeatClick,
      displayLabel:
        reservationLabels[id] !== undefined ? reservationLabels[id] : id,
    })

    const seatLayout: { [key: string]: { top: number; left: number; width: number; height: number } } = {
      k1: { top: 161, left: 784, width: 60, height: 60 },
      "(k1)": { top: 222, left: 784, width: 60, height: 60 },
      k2: { top: 284, left: 784, width: 60, height: 60 },
      k3: { top: 345, left: 784, width: 60, height: 60 },
      k4: { top: 345, left: 723, width: 60, height: 60 },
      k5: { top: 345, left: 662, width: 60, height: 60 },
      k6: { top: 345, left: 600, width: 60, height: 60 },
      k7: { top: 345, left: 539, width: 60, height: 60 },
      k8: { top: 345, left: 477, width: 60, height: 60 },
      k9: { top: 345, left: 416, width: 60, height: 60 },
      k10: { top: 345, left: 354, width: 60, height: 60 },
      k11: { top: 345, left: 293, width: 60, height: 60 },
      k12: { top: 345, left: 232, width: 60, height: 60 },
      k13: { top: 284, left: 232, width: 60, height: 60 },
      k14: { top: 222, left: 232, width: 60, height: 60 },
      k15: { top: 161, left: 232, width: 60, height: 60 },
      k16: { top: 100, left: 232, width: 60, height: 60 },

      301: { top: 510, left: 50, width: 100, height: 150 },
      302: { top: 370, left: 50, width: 100, height: 100 },
      303: { top: 235, left: 50, width: 100, height: 100 },
      304: { top: 100, left: 50, width: 100, height: 100 },

      201: { top: 55, left: 930, width: 100, height: 150 },
      2021: { top: 240, left: 930, width: 100, height: 60 },
      2022: { top: 301, left: 930, width: 100, height: 60 },
      2031: { top: 390, left: 930, width: 100, height: 60 },
      2032: { top: 465, left: 930, width: 100, height: 60 },
      204: { top: 560, left: 930, width: 100, height: 100 },

      205: { top: 520, left: 640, width: 100, height: 100 },
      206: { top: 520, left: 485, width: 100, height: 100 },
      207: { top: 520, left: 325, width: 100, height: 100 },
    }

    const getMergedBox = (group: string[]) => {
      const layouts = group
        .map((id) => seatLayout[id])
        .filter(Boolean)

      if (layouts.length === 0) return null

      const left = Math.min(...layouts.map((s) => s.left))
      const top = Math.min(...layouts.map((s) => s.top))
      const right = Math.max(...layouts.map((s) => s.left + s.width))
      const bottom = Math.max(...layouts.map((s) => s.top + s.height))

      return {
        left,
        top,
        width: right - left,
        height: bottom - top,
      }
    }

  return (
    <div>
      <div className="notification-bar">
        <div className="current-time-box">
          <div>{formatCurrentTime(currentTime)}</div>

          <button
            onClick={() => {
              setReservationMode(true)
              setSelectedReserveSeats([])
              setReserveTimeText("")
              setReserveDisplayNumber("")
            }}
            className="reserve-start-button"
          >
            +予約
          </button>
        </div>

        <div className="notification-area">
          {notifications.map((n, index) => (
            <div
              key={n.id}
              className={`notification-item ${
                index === notifications.length - 1 ? "enter" : ""
              }`}
              onClick={() => handleNotificationClick(n.text, n.id)}
            >
              {n.text}
            </div>
          ))}
        </div>
      </div>

      {confirmFoodCheck && (
        <div className="confirm-overlay">
          <div className="confirm-menu">
            <div className="confirm-message">
              土鍋の通知が未チェックですが、チェックしますか？
            </div>

            <button className="confirm-button" onClick={handleConfirmYes}>
              はい
            </button>

            <button className="confirm-button" onClick={handleConfirmNo}>
              いいえ
            </button>
          </div>
        </div>
      )}

      {reservationMode && (
        <div className="reservation-panel">
         <div>
          選択中：
          {selectedReserveSeats.length > 0
            ? selectedReserveSeats.join(" + ")
            : "なし"}
          {"　"}
          予定席番号：
          {selectedReserveSeats.length > 0
            ? getReservationSeatNumber() || "未設定"
            : "なし"}
        </div>

          <div>
            予約時間：
          <select
            value={reserveTimeText}
            onChange={(e) => setReserveTimeText(e.target.value)}
            className="reserve-time-select"
          >
            <option value="">時間選択</option>
            {reservationTimeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          </div>

          <button onClick={handleConfirmReservation}>予約確定</button>

          <button
            onClick={() => {
              setReservationMode(false)
              setSelectedReserveSeats([])
              setReserveTimeText("")
              setReserveDisplayNumber("")
            }}
          >
            キャンセル
          </button>
        </div>
      )}
      

      <div
        style={{
          position: "relative",
          width: 1100,
          height: 700,
          border: "2px solid black",
          backgroundColor: "#f7f7f7",
        }}
      >

      {mergedReserveGroups.map((group, index) => {
          const stillEating = group.seats.some((seatId) =>
            ["occupied", "donabe", "food"].includes(seatStatuses[seatId])
          )

          if (!group.pendingUntilEmpty || !stillEating) return null

          const box = getMergedBox(group.seats)
          if (!box) return null

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
                border: "4px solid black",
                backgroundColor: "rgba(135, 206, 250, 0.25)",
                zIndex: 5,
                pointerEvents: "none",
              }}
            />
          )
        })}

        {reservationMode &&
        selectedReserveSeats.length > 0 &&
        getSeatGroup(selectedReserveSeats[0]) === "table" && (
          <div className="map-calculator">
            <div className="calculator-title">予約席番号</div>

          <select
            value={reserveDisplayNumber}
            onChange={(e) => setReserveDisplayNumber(e.target.value)}
            className="reserve-seat-number-select"
          >
            <option value="">席番号選択</option>
            {tableSeats.map((seatId) => (
              <option key={seatId} value={seatId}>
                {seatId}
              </option>
            ))}
          </select>
          </div>
        )}

        <Seat id="k1" top={161} left={784} {...seatCommonProps("k1")} />
        <Seat id="(k1)" top={222} left={784} {...seatCommonProps("(k1)")} />
        <Seat id="k2" top={284} left={784} {...seatCommonProps("k2")} />
        <Seat id="k3" top={345} left={784} {...seatCommonProps("k3")} />
        <Seat id="k4" top={345} left={723} {...seatCommonProps("k4")} />
        <Seat id="k5" top={345} left={662} {...seatCommonProps("k5")} />
        <Seat id="k6" top={345} left={600} {...seatCommonProps("k6")} />
        <Seat id="k7" top={345} left={539} {...seatCommonProps("k7")} />
        <Seat id="k8" top={345} left={477} {...seatCommonProps("k8")} />
        <Seat id="k9" top={345} left={416} {...seatCommonProps("k9")} />
        <Seat id="k10" top={345} left={354} {...seatCommonProps("k10")} />
        <Seat id="k11" top={345} left={293} {...seatCommonProps("k11")} />
        <Seat id="k12" top={345} left={232} {...seatCommonProps("k12")} />
        <Seat id="k13" top={284} left={232} {...seatCommonProps("k13")} />
        <Seat id="k14" top={222} left={232} {...seatCommonProps("k14")} />
        <Seat id="k15" top={161} left={232} {...seatCommonProps("k15")} />
        <Seat id="k16" top={100} left={232} {...seatCommonProps("k16")} />

        <Seat id="301" top={510} left={50} width={100} height={150} {...seatCommonProps("301")} />
        <Seat id="302" top={370} left={50} width={100} height={100} {...seatCommonProps("302")} />
        <Seat id="303" top={235} left={50} width={100} height={100} {...seatCommonProps("303")} />
        <Seat id="304" top={100} left={50} width={100} height={100} {...seatCommonProps("304")} />

        <Seat id="201" top={55} left={930} width={100} height={150} {...seatCommonProps("201")} />
        <Seat id="2021" top={240} left={930} width={100} height={60} {...seatCommonProps("2021")} />
        <Seat id="2022" top={301} left={930} width={100} height={60} {...seatCommonProps("2022")} />
        <Seat id="2031" top={390} left={930} width={100} height={60} {...seatCommonProps("2031")} />
        <Seat id="2032" top={465} left={930} width={100} height={60} {...seatCommonProps("2032")} />
        <Seat id="204" top={560} left={930} width={100} height={100} {...seatCommonProps("204")} />

        <Seat id="205" top={520} left={640} width={100} height={100} {...seatCommonProps("205")} />
        <Seat id="206" top={520} left={485} width={100} height={100} {...seatCommonProps("206")} />
        <Seat id="207" top={520} left={325} width={100} height={100} {...seatCommonProps("207")} />
      </div>
    </div>
  )
}

export default App