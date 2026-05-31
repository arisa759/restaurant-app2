import { useEffect, useRef, useState } from "react"
import "./App.css"
import Seat from "./Seat"

type Notification = {
  id: string
  seatId: string
  type: "donabe" | "food"
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

type EatingGroup = {
  seats: string[]
  representativeSeatId: string
  displayNumber: string
}

type AvailabilityItem = {
  id: string
  text: string
  createdAt: number
  seatIds: string[]
  displayNumber: string
}

type Reservation = {
  id: string
  time: string
  customerName: string
  adultCount: number
  childCount: number
  memo: string
  seats: string[]
  displaySeatNumber: string
  createdAt: number
  status: "reserved" | "seated" | "cancelled" | "waiting"
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeSeatId, setActiveSeatId] = useState<string | null>(null)

  const [seatTimes, setSeatTimes] = useState<{ [key: string]: Date }>({})
  const [reservationTimes, setReservationTimes] = useState<{ [key: string]: Date }>({})
  const [seatStatuses, setSeatStatuses] = useState<{ [key: string]: SeatStatus }>({})

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [confirmFoodCheck, setConfirmFoodCheck] = useState<{
    seatId: string
    notificationId: string
  } | null>(null)

  const [confirmLeaveSeatId, setConfirmLeaveSeatId] = useState<string | null>(null)

  const [reservationMode, setReservationMode] = useState(false)
  const [selectedReserveSeats, setSelectedReserveSeats] = useState<string[]>([])
  const [reserveTimeText, setReserveTimeText] = useState("")
  const [reserveDisplayNumber, setReserveDisplayNumber] = useState("")
  const [reservationLabels, setReservationLabels] = useState<{ [key: string]: string }>({})
  const [mergedReserveGroups, setMergedReserveGroups] = useState<MergedReserveGroup[]>([])

  const [selectedEatingSeats, setSelectedEatingSeats] = useState<string[]>([])
  const [eatingDisplayNumber, setEatingDisplayNumber] = useState("")
  const [eatingLabels, setEatingLabels] = useState<{ [key: string]: string }>({})
  const [eatingGroups, setEatingGroups] = useState<EatingGroup[]>([])
  const [availabilityItems, setAvailabilityItems] = useState<AvailabilityItem[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reservationPanelOpen, setReservationPanelOpen] = useState(false)

  const [reserveCustomerName, setReserveCustomerName] = useState("")
  const [reserveAdultCount, setReserveAdultCount] = useState(2)
  const [reserveChildCount, setReserveChildCount] = useState(0)
  const [reserveMemo, setReserveMemo] = useState("")
  const [overrideReservations, setOverrideReservations] = useState<
    {
      reservationId: string
      seats: string[]
      displaySeatNumber: string
    }[]
  >([])
  const [seatMoveMode, setSeatMoveMode] = useState(false)
  const [movingSeatIds, setMovingSeatIds] = useState<string[]>([])
  const [selectedMoveTargetSeats, setSelectedMoveTargetSeats] = useState<string[]>([])
  const [movingDisplayNumber, setMovingDisplayNumber] = useState("")
  const firedRef = useRef<{ [key: string]: boolean }>({})

  const counterSeats = [
    "k1", "(k1)", "k2", "k3", "k4", "k5", "k6", "k7", "k8",
    "k9", "k10", "k11", "k12", "k13", "k14", "k15", "k16",
  ]

  const tableSeats = ["201", "2021", "2022", "2031", "2032", "204"]
  const zashikiSeats = ["301", "302", "303", "304"]

  const reservationTimeOptions = Array.from({ length: 61 }, (_, i) => {
    const totalMinutes = 17 * 60 + i * 5
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
  })

  const seatLayout: {
    [key: string]: { top: number; left: number; width: number; height: number }
  } = {
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

  useEffect(() => {
    const timer = window.setInterval(() => {
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

  const formatHourMinute = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSeatGroup = (id: string) => {
    if (counterSeats.includes(id)) return "counter"
    if (tableSeats.includes(id)) return "table"
    if (zashikiSeats.includes(id)) return "zashiki"
    return "other"
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

  const getEatingGroupBySeatId = (seatId: string) => {
    return eatingGroups.find((group) => group.seats.includes(seatId))
  }

  const getSameEatingSeatIds = (seatId: string) => {
    const group = getEatingGroupBySeatId(seatId)
    return group ? group.seats : [seatId]
  }

  const getNotificationSeatInfo = (seatId: string) => {
    const group = getEatingGroupBySeatId(seatId)

    if (!group) {
      return {
        targetSeatId: seatId,
        displaySeatId: eatingLabels[seatId] ?? seatId,
      }
    }

    return {
      targetSeatId: group.representativeSeatId,
      displaySeatId: group.displayNumber,
    }
  }

  const getEatingSeatNumber = () => {
    if (selectedEatingSeats.length === 0) return ""

    const group = getSeatGroup(selectedEatingSeats[0])

    if (group === "counter") return getRepresentativeSeatId(selectedEatingSeats)
    if (group === "zashiki") return getRepresentativeSeatId(selectedEatingSeats)
    if (group === "table") return eatingDisplayNumber

    return selectedEatingSeats[0]
  }

  const getReservationSeatNumber = () => {
    if (selectedReserveSeats.length === 0) return ""

    const group = getSeatGroup(selectedReserveSeats[0])

    if (group === "counter") return getRepresentativeSeatId(selectedReserveSeats)
    if (group === "zashiki") return getRepresentativeSeatId(selectedReserveSeats)
    if (group === "table") return reserveDisplayNumber

    return selectedReserveSeats[0]
  }

  const getSortedReservations = () => {
    return [...reservations]
      .filter((reservation) => reservation.status === "reserved")
      .sort((a, b) => {
        if (a.time !== b.time) {
          return a.time.localeCompare(b.time)
        }

        return a.createdAt - b.createdAt
      })
  }

  const getReservationPeopleText = (reservation: Reservation) => {
    if (reservation.childCount > 0) {
      return `大${reservation.adultCount}＋小${reservation.childCount}`
    }

    return `${reservation.adultCount}名`
  }

  const getMergedBox = (group: string[]) => {
    const layouts = group.map((id) => seatLayout[id]).filter(Boolean)

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

  const addAvailabilityItem = (
    seats: string[],
    displayNumber: string,
    startTime: Date
  ) => {
    const endTime = new Date(startTime)
    endTime.setHours(endTime.getHours() + 2)

    const seatText =
      seats.length > 1
        ? `${displayNumber}（${seats.join("＋")}）`
        : displayNumber

    setAvailabilityItems((prev) => [
      ...prev,
      {
        id: `${displayNumber}-${startTime.getTime()}`,
        text: `${seatText} ${formatHourMinute(endTime)}空き予定`,
        createdAt: startTime.getTime(),
        seatIds: [...seats],
        displayNumber,
      },
    ])
  }

  const removeAvailabilityBySeats = (seats: string[]) => {
    setAvailabilityItems((prev) =>
      prev.filter((item) => !item.seatIds.some((seatId) => seats.includes(seatId)))
    )
  }

  const handleOpenSeatMenu = (id: string) => {
    setActiveSeatId(id)
    setSelectedEatingSeats([id])
    setEatingDisplayNumber("")
  }

  const clearEatingSelection = () => {
    setActiveSeatId(null)
    setSelectedEatingSeats([])
    setEatingDisplayNumber("")
  }

  const startReservationFromSeatMenu = () => {
  setReservationMode(true)

  setSelectedReserveSeats([...selectedEatingSeats])

  setReserveTimeText("")
  setReserveDisplayNumber("")

  setReserveCustomerName("")
  setReserveAdultCount(2)
  setReserveChildCount(0)
  setReserveMemo("")

  setActiveSeatId(null)
}

  const handleEatingSeatClick = (id: string) => {
    if (!activeSeatId) return
    if (id === activeSeatId) return

    const clickedGroup = getSeatGroup(id)

    if (selectedEatingSeats.length > 0) {
      const currentGroup = getSeatGroup(selectedEatingSeats[0])

      if (clickedGroup !== currentGroup) {
        alert("同じ種類の席だけ選択できます")
        return
      }
    }

    setSelectedEatingSeats((prev) => {
      if (prev.includes(id)) {
        return prev.filter((seatId) => seatId !== id)
      }

      return [...prev, id]
    })
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

  const handleStartEatingSeats = () => {
    if (selectedEatingSeats.length === 0) return

    const group = getSeatGroup(selectedEatingSeats[0])
    const displayNumber = getEatingSeatNumber()

    if (group === "table" && selectedEatingSeats.length > 1 && !displayNumber) {
      alert("テーブル席番号を選択してください")
      return
    }

    const alreadyEating = selectedEatingSeats.some((seatId) =>
      ["occupied", "donabe", "food"].includes(seatStatuses[seatId])
    )

    if (alreadyEating) {
      alert("お食事中です。")
      return
    }

    const now = new Date()
    const representativeSeatId = getRepresentativeSeatId(selectedEatingSeats)
    const label = displayNumber || representativeSeatId

    selectedEatingSeats.forEach((seatId) => {
      setSeatTimes((prev) => ({
        ...prev,
        [seatId]: now,
      }))

      setSeatStatuses((prev) => ({
        ...prev,
        [seatId]: "occupied",
      }))
    })

    setEatingLabels((prev) => {
      const next = { ...prev }

      selectedEatingSeats.forEach((seatId) => {
        next[seatId] = seatId === representativeSeatId ? label : ""
      })

      return next
    })

    if (selectedEatingSeats.length > 1) {
      setEatingGroups((prev) => [
        ...prev,
        {
          seats: [...selectedEatingSeats],
          representativeSeatId,
          displayNumber: label,
        },
      ])
    }

    addAvailabilityItem(selectedEatingSeats, label, now)
    clearEatingSelection()
  }
  
 const handleSeatReservation = (reservation: Reservation) => {
  const now = new Date()
  const representativeSeatId = getRepresentativeSeatId(reservation.seats)

  reservation.seats.forEach((seatId) => {
    setSeatTimes((prev) => ({
      ...prev,
      [seatId]: now,
    }))

    setSeatStatuses((prev) => ({
      ...prev,
      [seatId]: "occupied",
    }))
  })

  setEatingLabels((prev) => {
    const next = { ...prev }

    reservation.seats.forEach((seatId) => {
      next[seatId] =
        seatId === representativeSeatId
          ? reservation.displaySeatNumber
          : ""
    })

    return next
  })

  if (reservation.seats.length > 1) {
    setEatingGroups((prev) => [
      ...prev,
      {
        seats: [...reservation.seats],
        representativeSeatId,
        displayNumber: reservation.displaySeatNumber,
      },
    ])
  }

  addAvailabilityItem(reservation.seats, reservation.displaySeatNumber, now)

  setReservations((prev) =>
    prev.map((r) =>
      r.id === reservation.id
        ? { ...r, status: "seated" }
        : r
    )
  )

  reservation.seats.forEach((seatId) => {
    setReservationTimes((prev) => {
      const next = { ...prev }
      delete next[seatId]
      return next
    })

    setReservationLabels((prev) => {
      const next = { ...prev }
      delete next[seatId]
      return next
    })
  })
}

  const getReservationBySeatId = (seatId: string) => {
    return reservations.find(
      (reservation) =>
        reservation.status === "reserved" &&
        reservation.seats.includes(seatId)
    )
  }

  const handleStartReservedSeat = (seatId: string) => {
    const reservation = getReservationBySeatId(seatId)

    if (!reservation) {
      alert("この席の予約が見つかりません")
      return
    }

    handleSeatReservation(reservation)
  }

  const handleCancelReservation = (seatId: string) => {
    const reservation = getReservationBySeatId(seatId)

    if (!reservation) {
      alert("この席の予約が見つかりません")
      return
    }

    const ok = window.confirm(
      `${reservation.displaySeatNumber}席の予約をキャンセルしますか？`
    )

    if (!ok) return

    reservation.seats.forEach((id) => {
      setSeatStatuses((prev) => ({
        ...prev,
        [id]: "empty",
      }))

      setReservationTimes((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })

      setReservationLabels((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    })

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservation.id
          ? {
              ...r,
              status: "cancelled",
            }
          : r
      )
    )

    setSelectedReserveSeats([])
    setReservationMode(false)
  }

  const handleOverrideReservation = (seatId: string) => {
  const reservation = getReservationBySeatId(seatId)

  if (!reservation) {
    alert("予約が見つかりません")
    return
  }

  const now = new Date()

  const targetSeats =
    selectedEatingSeats.length > 0
      ? selectedEatingSeats
      : [seatId]

  targetSeats.forEach((id) => {
    setSeatStatuses((prev) => ({
      ...prev,
      [id]: "occupied",
    }))

    setSeatTimes((prev) => ({
      ...prev,
      [id]: now,
    }))
  })

  const representativeSeatId = getRepresentativeSeatId(targetSeats)
  const displayNumber = representativeSeatId

  setEatingLabels((prev) => {
    const next = { ...prev }

    targetSeats.forEach((id) => {
      next[id] = id === representativeSeatId ? displayNumber : ""
    })

    return next
  })

  if (targetSeats.length > 1) {
    setEatingGroups((prev) => [
      ...prev,
      {
        seats: [...targetSeats],
        representativeSeatId,
        displayNumber,
      },
    ])
  }

  addAvailabilityItem(targetSeats, displayNumber, now)

  setOverrideReservations((prev) => [
    ...prev,
    {
      reservationId: reservation.id,
      seats: [...targetSeats],
      displaySeatNumber: displayNumber,
    },
  ])

  clearEatingSelection()
}

  const handleStartSeatMove = (seatId: string) => {
    const group = getEatingGroupBySeatId(seatId)

    const sourceSeats =
      selectedEatingSeats.length > 1
        ? [...selectedEatingSeats]
        : group
        ? [...group.seats]
        : [seatId]

    setMovingSeatIds(sourceSeats)
    setSelectedMoveTargetSeats([])
    setMovingDisplayNumber("")
    setSeatMoveMode(true)

    setActiveSeatId(null)
    setSelectedEatingSeats([])
    setEatingDisplayNumber("")
  }

  const handleMoveTargetSeatClick = (seatId: string) => {
    if (!seatMoveMode) return

    const sourceGroup = getSeatGroup(movingSeatIds[0])
    const targetGroup = getSeatGroup(seatId)

    if (sourceGroup !== targetGroup) {
      alert("同じ種類の席だけ移動できます")
      return
    }

    setSelectedMoveTargetSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId)
      }

      return [...prev, seatId]
    })
  }

  const handleConfirmSeatMove = () => {
  if (movingSeatIds.length === 0) return

  if (selectedMoveTargetSeats.length === 0) {
    alert("移動先の席を選択してください")
    return
  }

  if (movingSeatIds.length !== selectedMoveTargetSeats.length) {
    alert("移動元と同じ数の席を選択してください")
    return
  }

  const sourceReservation = reservations.find(
    (reservation) =>
      reservation.status === "reserved" &&
      reservation.seats.some((seatId) => movingSeatIds.includes(seatId))
  )

  const sourceRepresentativeSeatId = getRepresentativeSeatId(movingSeatIds)
  const targetRepresentativeSeatId =
    getRepresentativeSeatId(selectedMoveTargetSeats)

  const sourceStatus = seatStatuses[sourceRepresentativeSeatId] ?? "empty"

  const sourceIsEating =
    sourceStatus === "occupied" ||
    sourceStatus === "donabe" ||
    sourceStatus === "food"

  const sourceEatingLabel =
    eatingLabels[sourceRepresentativeSeatId] ||
    sourceRepresentativeSeatId

  const sourceReservationLabel =
    sourceReservation?.displaySeatNumber ||
    reservationLabels[sourceRepresentativeSeatId] ||
    sourceRepresentativeSeatId

  const sourceStartTime = seatTimes[sourceRepresentativeSeatId]
  const sourceReserveTime =
    sourceReservation
      ? reservationTimes[sourceReservation.seats[0]]
      : reservationTimes[sourceRepresentativeSeatId]

  const targetLabel =
    movingDisplayNumber ||
    (sourceReservation ? sourceReservationLabel : sourceEatingLabel)

  // 1. 移動元の席情報を完全に削除
  movingSeatIds.forEach((oldSeatId) => {
    setSeatStatuses((prev) => ({
      ...prev,
      [oldSeatId]: "empty",
    }))

    setSeatTimes((prev) => {
      const next = { ...prev }
      delete next[oldSeatId]
      return next
    })

    setReservationTimes((prev) => {
      const next = { ...prev }
      delete next[oldSeatId]
      return next
    })

    setEatingLabels((prev) => {
      const next = { ...prev }
      delete next[oldSeatId]
      return next
    })

    setReservationLabels((prev) => {
      const next = { ...prev }
      delete next[oldSeatId]
      return next
    })

    firedRef.current[`${oldSeatId}-donabe`] = false
    firedRef.current[`${oldSeatId}-food`] = false
  })

  // 2. 着席情報を移動先へ反映
  if (sourceIsEating) {
    selectedMoveTargetSeats.forEach((newSeatId) => {
      setSeatStatuses((prev) => ({
        ...prev,
        [newSeatId]: sourceStatus,
      }))

      if (sourceStartTime) {
        setSeatTimes((prev) => ({
          ...prev,
          [newSeatId]: sourceStartTime,
        }))
      }
    })

    setEatingLabels((prev) => {
      const next = { ...prev }

      selectedMoveTargetSeats.forEach((seatId) => {
        next[seatId] =
          seatId === targetRepresentativeSeatId ? targetLabel : ""
      })

      return next
    })

    setEatingGroups((prev) => {
      const withoutOldGroup = prev.filter(
        (group) =>
          !group.seats.some((seatId) => movingSeatIds.includes(seatId))
      )

      if (selectedMoveTargetSeats.length <= 1) {
        return withoutOldGroup
      }

      return [
        ...withoutOldGroup,
        {
          seats: [...selectedMoveTargetSeats],
          representativeSeatId: targetRepresentativeSeatId,
          displayNumber: targetLabel,
        },
      ]
    })

    removeAvailabilityBySeats(movingSeatIds)

    if (sourceStartTime) {
      addAvailabilityItem(
        selectedMoveTargetSeats,
        targetLabel,
        sourceStartTime
      )
    }
  } else {
    setEatingGroups((prev) =>
      prev.filter(
        (group) =>
          !group.seats.some((seatId) => movingSeatIds.includes(seatId))
      )
    )
  }

  // 3. 予約情報を移動先へ反映
  if (sourceReservation) {
    setReservations((prev) =>
      prev.map((reservation) =>
        reservation.id === sourceReservation.id
          ? {
              ...reservation,
              seats: [...selectedMoveTargetSeats],
              displaySeatNumber: targetLabel,
            }
          : reservation
      )
    )

    if (sourceReserveTime) {
      selectedMoveTargetSeats.forEach((seatId) => {
        setReservationTimes((prev) => ({
          ...prev,
          [seatId]: sourceReserveTime,
        }))
      })
    }

    setReservationLabels((prev) => {
      const next = { ...prev }

      selectedMoveTargetSeats.forEach((seatId) => {
        next[seatId] =
          seatId === targetRepresentativeSeatId ? targetLabel : ""
      })

      return next
    })

    if (!sourceIsEating) {
      selectedMoveTargetSeats.forEach((seatId) => {
        setSeatStatuses((prev) => ({
          ...prev,
          [seatId]: "reserved2h",
        }))
      })
    }
  }

  // 4. 予約枠情報も移動先へ更新
  setMergedReserveGroups((prev) =>
    prev.map((group) => {
      const isTargetGroup = group.seats.some((seatId) =>
        movingSeatIds.includes(seatId)
      )

      if (!isTargetGroup) return group

      return {
        ...group,
        seats: [...selectedMoveTargetSeats],
        reservationSeatNumber: targetLabel,
      }
    })
  )

  // 5. 割り込み予約枠も移動先へ更新
  setOverrideReservations((prev) =>
    prev.map((group) => {
      const isTargetGroup = group.seats.some((seatId) =>
        movingSeatIds.includes(seatId)
      )

      if (!isTargetGroup) return group

      return {
        ...group,
        seats: [...selectedMoveTargetSeats],
        displaySeatNumber: targetLabel,
      }
    })
  )

  setSeatMoveMode(false)
  setMovingSeatIds([])
  setSelectedMoveTargetSeats([])
  setMovingDisplayNumber("")

  setActiveSeatId(null)
  setSelectedEatingSeats([])
  setEatingDisplayNumber("")
  setSelectedReserveSeats([])
  }
  const handleCancelSeatMove = () => {
    setSeatMoveMode(false)
    setMovingSeatIds([])
    setSelectedMoveTargetSeats([])
    setMovingDisplayNumber("")

    setActiveSeatId(null)
    setSelectedEatingSeats([])
    setEatingDisplayNumber("")
  }

  const handleLeave = (id: string) => {
    setConfirmLeaveSeatId(id)
  }

  const executeLeave = (id: string) => {
    const group = getEatingGroupBySeatId(id)

    if (group && id === group.representativeSeatId) {
      group.seats.forEach((seatId) => {
        const overrideReservation = overrideReservations.find((group) =>
          group.seats.includes(id)
        )
        setSeatStatuses((prev) => ({
          ...prev,
          [id]: overrideReservation ? "reserved2h" : "empty",
        }))

        setSeatTimes((prev) => {
          const next = { ...prev }
          delete next[seatId]
          return next
        })

        firedRef.current[`${seatId}-donabe`] = false
        firedRef.current[`${seatId}-food`] = false
      })

      setEatingLabels((prev) => {
        const next = { ...prev }

        group.seats.forEach((seatId) => {
          delete next[seatId]
        })

        return next
      })

      setEatingGroups((prev) => prev.filter((g) => g !== group))
      removeAvailabilityBySeats(group.seats)

      setNotifications((prev) =>
        prev.filter((n) => !group.seats.includes(n.seatId))
      )

      setConfirmLeaveSeatId(null)
      clearEatingSelection()
      return
    }

    if (group && id !== group.representativeSeatId) {
      const otherSeats = group.seats.filter((seatId) => seatId !== id)
      const message = `${otherSeats.join("席、")}席のお客様は退店していませんが、退店しますか`

      const ok = window.confirm(message)

      if (!ok) {
        setConfirmLeaveSeatId(null)
        return
      }

      setEatingGroups((prev) =>
        prev
          .map((g) => {
            if (g !== group) return g

            return {
              ...g,
              seats: g.seats.filter((seatId) => seatId !== id),
            }
          })
          .filter((g) => g.seats.length > 1)
      )

      setSeatStatuses((prev) => ({
        ...prev,
        [id]: "empty",
      }))

      setSeatTimes((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })

      setEatingLabels((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })

      firedRef.current[`${id}-donabe`] = false
      firedRef.current[`${id}-food`] = false

      removeAvailabilityBySeats([id])
      setNotifications((prev) => prev.filter((n) => n.seatId !== id))

      setConfirmLeaveSeatId(null)
      clearEatingSelection()
      return
    }

    setSeatStatuses((prev) => ({
      ...prev,
      [id]: "empty",
    }))

    setSeatTimes((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    setEatingLabels((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    firedRef.current[`${id}-donabe`] = false
    firedRef.current[`${id}-food`] = false

    removeAvailabilityBySeats([id])
    setNotifications((prev) => prev.filter((n) => n.seatId !== id))

    setConfirmLeaveSeatId(null)
    clearEatingSelection()
  }

  const handleConfirmLeaveYes = () => {
    if (!confirmLeaveSeatId) return
    executeLeave(confirmLeaveSeatId)
  }

  const handleConfirmLeaveNo = () => {
    setConfirmLeaveSeatId(null)
    clearEatingSelection()
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

    if (hasEatingSeat) {
      setMergedReserveGroups((prev) => [
        ...prev,
        {
          seats: [...selectedReserveSeats],
          reservationSeatNumber,
          pendingUntilEmpty: true,
        },
      ])
    }

    if (!hasEatingSeat) {
      setReservationLabels((prev) => {
        const next = { ...prev }

        selectedReserveSeats.forEach((seatId) => {
          next[seatId] =
            seatId === representativeSeatId ? reservationSeatNumber : ""
        })

        return next
      })
    }

    setReservations((prev) => [
      ...prev,
      {
        id: `reservation-${Date.now()}`,
        time: reserveTimeText,
        customerName: reserveCustomerName || "名前未入力",
        adultCount: reserveAdultCount,
        childCount: reserveChildCount,
        memo: reserveMemo,
        seats: [...selectedReserveSeats],
        displaySeatNumber:
        reservationSeatNumber || getRepresentativeSeatId(selectedReserveSeats),
        createdAt: Date.now(),
        status: "reserved",
      },
    ])

    alert(`予約席番号：${reservationSeatNumber}\n予約時間：${reserveTimeText}`)

    setReservationMode(false)
    setSelectedReserveSeats([])
    setReserveTimeText("")
    setReserveDisplayNumber("")
    setReserveCustomerName("")
    setReserveAdultCount(2)
    setReserveChildCount(0)
    setReserveMemo("")
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
          next[seatId] = seatId === representativeSeatId ? group.reservationSeatNumber : ""
        })

        return next
      })

      setMergedReserveGroups((prev) => prev.filter((g) => g !== group))
    })
  }, [seatStatuses, mergedReserveGroups])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date()

      Object.entries(seatTimes).forEach(([id, startTime]) => {
        const { targetSeatId, displaySeatId } = getNotificationSeatInfo(id)

        if (targetSeatId !== id) return

        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60)

        const donabeKey = `${targetSeatId}-donabe`
        const foodKey = `${targetSeatId}-food`

        if (diff >= 60 && !firedRef.current[donabeKey]) {
          firedRef.current[donabeKey] = true

          setNotifications((prev) => [
            ...prev,
            {
              id: donabeKey,
              seatId: targetSeatId,
              type: "donabe",
              text: `土鍋 ${displaySeatId}`,
            },
          ])
        }

        if (diff >= 90 && !firedRef.current[foodKey]) {
          firedRef.current[foodKey] = true

          setNotifications((prev) => [
            ...prev,
            {
              id: foodKey,
              seatId: targetSeatId,
              type: "food",
              text: `フード ${displaySeatId}`,
            },
          ])
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [seatTimes, eatingGroups, eatingLabels])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date()

      Object.entries(reservationTimes).forEach(([id, reserveTime]) => {
        const diff = Math.floor((reserveTime.getTime() - now.getTime()) / 1000 / 60)

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

  const handleNotificationClick = (notification: Notification) => {
    const targetSeatIds = getSameEatingSeatIds(notification.seatId)

    if (notification.type === "food") {
      const hasDonabeNotification = notifications.some(
        (n) => n.type === "donabe" && targetSeatIds.includes(n.seatId)
      )

      if (hasDonabeNotification) {
        setConfirmFoodCheck({
          seatId: notification.seatId,
          notificationId: notification.id,
        })
        return
      }

      setSeatStatuses((prev) => {
        const next = { ...prev }

        targetSeatIds.forEach((seatId) => {
          next[seatId] = "food"
        })

        return next
      })

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      return
    }

    if (notification.type === "donabe") {
      setSeatStatuses((prev) => {
        const next = { ...prev }

        targetSeatIds.forEach((seatId) => {
          if (next[seatId] !== "food") {
            next[seatId] = "donabe"
          }
        })

        return next
      })

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    }
  }

  const handleConfirmYes = () => {
    if (!confirmFoodCheck) return

    const { seatId, notificationId } = confirmFoodCheck
    const targetSeatIds = getSameEatingSeatIds(seatId)

    setSeatStatuses((prev) => {
      const next = { ...prev }

      targetSeatIds.forEach((id) => {
        next[id] = "food"
      })

      return next
    })

    setNotifications((prev) =>
      prev.filter((n) => {
        const isClickedFood = n.id === notificationId
        const isSameGroupDonabe =
          n.type === "donabe" && targetSeatIds.includes(n.seatId)

        return !isClickedFood && !isSameGroupDonabe
      })
    )

    setConfirmFoodCheck(null)
  }

  const handleConfirmNo = () => {
    setConfirmFoodCheck(null)
  }

  const getSeatSubText = (id: string) => {
    const status = seatStatuses[id]

    if (
      status === "occupied" ||
      status === "donabe" ||
      status === "food"
    ) {
      const startTime = seatTimes[id]
      if (!startTime) return ""

      const diff = Math.floor(
        (currentTime.getTime() - startTime.getTime()) / 1000 / 60
      )

      return `${diff}分経過`
    }

    if (
      status === "reserved2h" ||
      status === "reserved1h" ||
      status === "reserved30m"
    ) {
      const reserveTime = reservationTimes[id]
      if (!reserveTime) return ""

      const diff = Math.ceil(
        (reserveTime.getTime() - currentTime.getTime()) / 1000 / 60
      )

      if (diff <= 0) {
        return "予約時刻"
      }

      return `あと${diff}分`
    }

    return ""
  }

const seatCommonProps = (id: string) => ({
  activeSeatId,
  setActiveSeatId,
  onLeave: handleLeave,
  status: seatStatuses[id] ?? "empty",

  onSeatClick: handleReserveSeatClick,
  isReserveSelected: selectedReserveSeats.includes(id),
  isEatingSelected: selectedEatingSeats.includes(id),

  isReservedSeat:
    seatStatuses[id] === "reserved2h" ||
    seatStatuses[id] === "reserved1h" ||
    seatStatuses[id] === "reserved30m",

  onStartReservedSeat: () => handleStartReservedSeat(id),
  onCancelReservation: () => handleCancelReservation(id),

  onEatingSeatClick: handleEatingSeatClick,
  onOpenSeatMenu: handleOpenSeatMenu,
  onStartEatingSeats: handleStartEatingSeats,
  onClearEatingSelection: clearEatingSelection,
  onStartReservation: startReservationFromSeatMenu,
  onOverrideReservation: () => handleOverrideReservation(id),

  seatMoveMode,
  isMoveTargetSelected: selectedMoveTargetSeats.includes(id),
  onMoveSeatTarget: () => handleMoveTargetSeatClick(id),
  onStartSeatMove: () => handleStartSeatMove(id),

  displayLabel:
    eatingLabels[id] !== undefined
      ? eatingLabels[id]
      : reservationLabels[id] !== undefined
      ? reservationLabels[id]
      : id,

  subText: getSeatSubText(id),
})

   return (
    <div>
      <button
        className="reservation-panel-toggle"
        onClick={() => setReservationPanelOpen((prev) => !prev)}
      >
        ☰
      </button>

      <div
        className={`reservation-side-panel ${
          reservationPanelOpen ? "open" : ""
        }`}
      >
        <div className="reservation-side-title">予約表</div>

        {getSortedReservations().map((reservation) => (
          <div key={reservation.id} className="reservation-card">
            <div className="reservation-main-row">
              <label className="reservation-check-row">
                <input
                  type="checkbox"
                  onChange={() => {
                    handleSeatReservation(reservation)
                  }}
                />

                <span>{reservation.time}</span>
              </label>

              <div className="reservation-name">
                {reservation.customerName}
              </div>

              <div className="reservation-people">
                {getReservationPeopleText(reservation)}
              </div>

              <div className="reservation-seat">
                <div className="reservation-seat">
                  席：
                  {reservation.displaySeatNumber ||
                    getRepresentativeSeatId(reservation.seats)}
                </div>
              </div>
            </div>

            {reservation.memo && (
              <div className="reservation-memo-row">
                メモ：{reservation.memo}
              </div>
            )}
</div>
        ))}
      </div>

      <div className="notification-bar">
        <div className="current-time-box">
          <div>{formatCurrentTime(currentTime)}</div>
        </div>

        <div className="notification-area">
          {reservationMode && (
            <div className="availability-area">
              {[...availabilityItems]
                .sort((a, b) => a.createdAt - b.createdAt)
                .map((item) => (
                  <div key={item.id} className="availability-item">
                    {item.text}
                  </div>
                ))}
            </div>
          )}

          {seatMoveMode && (
            <div className="reservation-panel">
              <div>
                移動元：
                {movingSeatIds.join(" + ")}
                {" → "}
                移動先：
                {selectedMoveTargetSeats.length > 0
                  ? selectedMoveTargetSeats.join(" + ")
                  : "未選択"}
              </div>

              {selectedMoveTargetSeats.length > 1 &&
                getSeatGroup(selectedMoveTargetSeats[0]) === "table" && (
                  <div>
                    表示席番号：
                    <select
                      value={movingDisplayNumber}
                      onChange={(e) => setMovingDisplayNumber(e.target.value)}
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

              <button onClick={handleConfirmSeatMove}>
                移動確定
              </button>

              <button onClick={handleCancelSeatMove}>
                キャンセル
              </button>
            </div>
          )}

          {notifications.map((n, index) => (
            <div
              key={n.id}
              className={`notification-item ${
                index === notifications.length - 1 ? "enter" : ""
              }`}
              onClick={() => handleNotificationClick(n)}
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

      {confirmLeaveSeatId && (
        <div className="confirm-overlay">
          <div className="confirm-menu">
            <div className="confirm-message">
              お会計は済みましたか
            </div>

            <button className="confirm-button" onClick={handleConfirmLeaveYes}>
              はい
            </button>

            <button className="confirm-button" onClick={handleConfirmLeaveNo}>
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
            お名前：
            <input
              value={reserveCustomerName}
              onChange={(e) => setReserveCustomerName(e.target.value)}
              placeholder="お客様名"
              className="reservation-input"
            />
          </div>

          <div>
            大人：
            <input
              type="number"
              min={0}
              value={reserveAdultCount}
              onChange={(e) => setReserveAdultCount(Number(e.target.value))}
              className="reservation-number-input"
            />

            子供：
            <input
              type="number"
              min={0}
              value={reserveChildCount}
              onChange={(e) => setReserveChildCount(Number(e.target.value))}
              className="reservation-number-input"
            />
          </div>

          <div>
            メモ：
            <input
              value={reserveMemo}
              onChange={(e) => setReserveMemo(e.target.value)}
              placeholder="メモ"
              className="reservation-input"
            />
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
              setReserveCustomerName("")
              setReserveAdultCount(2)
              setReserveChildCount(0)
              setReserveMemo("")
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

        {overrideReservations.map((group, index) => {
          const box = getMergedBox(group.seats)

          if (!box) return null

          return (
            <div
              key={`override-${index}`}
              style={{
                position: "absolute",
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
                border: "4px dashed #00bfff",
                backgroundColor: "rgba(0,191,255,0.15)",
                zIndex: 4,
                pointerEvents: "none",
              }}
            />
          )
        })}

        {activeSeatId &&
          selectedEatingSeats.length > 1 &&
          getSeatGroup(selectedEatingSeats[0]) === "table" && (
            <div className="map-calculator">
              <div className="calculator-title">着席席番号</div>

              <select
                value={eatingDisplayNumber}
                onChange={(e) => setEatingDisplayNumber(e.target.value)}
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