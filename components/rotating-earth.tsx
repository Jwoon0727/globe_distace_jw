"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

export interface GlobeMarker {
  lng: number
  lat: number
  color?: string
}

interface GlobeHub {
  lng: number
  lat: number
}

interface RotatingEarthProps {
  width?: number
  height?: number
  className?: string
  markers?: GlobeMarker[]
  hub?: GlobeHub
}

export default function RotatingEarth({
  width = 800,
  height = 600,
  className = "",
  markers = [],
  hub,
}: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const markersRef = useRef(markers)
  markersRef.current = markers
  const hubRef = useRef(hub)
  hubRef.current = hub
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    // Set up responsive dimensions — clamp to viewport, keep roughly square on mobile
    const isMobileViewport = window.innerWidth < 768
    const maxWidth = window.innerWidth - 32
    const containerWidth = Math.min(width, maxWidth)
    const containerHeight = Math.min(height, containerWidth, window.innerHeight - 80)
    // Slightly smaller globe on mobile (zoom out)
    const radius = Math.min(containerWidth, containerHeight) / (isMobileViewport ? 3.1 : 2.5)

    // Zoom limits (relative to the base radius) — prevent infinite zoom in/out
    const MIN_SCALE = radius * 0.8
    const MAX_SCALE = radius * 2.5
    const clampScale = (s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s))

    // Cap DPR on mobile to reduce per-frame fill cost (smoother rotation)
    const rawDpr = window.devicePixelRatio || 1
    const dpr = isMobileViewport ? Math.min(rawDpr, 2) : rawDpr
    canvas.width = containerWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    context.scale(dpr, dpr)

    // Create projection and path generator for Canvas
    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90)

    const path = d3.geoPath().projection(projection).context(context)

    const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
      const [x, y] = point
      let inside = false

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }

      return inside
    }

    const pointInFeature = (point: [number, number], feature: any): boolean => {
      const geometry = feature.geometry

      if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates
        // Check if point is in outer ring
        if (!pointInPolygon(point, coordinates[0])) {
          return false
        }
        // Check if point is in any hole (inner rings)
        for (let i = 1; i < coordinates.length; i++) {
          if (pointInPolygon(point, coordinates[i])) {
            return false // Point is in a hole
          }
        }
        return true
      } else if (geometry.type === "MultiPolygon") {
        // Check each polygon in the MultiPolygon
        for (const polygon of geometry.coordinates) {
          // Check if point is in outer ring
          if (pointInPolygon(point, polygon[0])) {
            // Check if point is in any hole
            let inHole = false
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) {
                inHole = true
                break
              }
            }
            if (!inHole) {
              return true
            }
          }
        }
        return false
      }

      return false
    }

    const generateDotsInPolygon = (feature: any, dotSpacing = 16) => {
      const dots: [number, number][] = []
      const bounds = d3.geoBounds(feature)
      const [[minLng, minLat], [maxLng, maxLat]] = bounds

      const stepSize = dotSpacing * 0.08
      let pointsGenerated = 0

      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          const point: [number, number] = [lng, lat]
          if (pointInFeature(point, feature)) {
            dots.push(point)
            pointsGenerated++
          }
        }
      }

      console.log(
        `[v0] Generated ${pointsGenerated} points for land feature:`,
        feature.properties?.featurecla || "Land",
      )
      return dots
    }

    interface DotData {
      lng: number
      lat: number
      visible: boolean
    }

    const allDots: DotData[] = []
    let landFeatures: any

    const hexToRgb = (hex: string) => {
      const normalized = hex.replace("#", "")
      const value = parseInt(
        normalized.length === 3
          ? normalized.split("").map((c) => c + c).join("")
          : normalized,
        16,
      )
      return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
      }
    }

    const drawStarlightMarker = (
      x: number,
      y: number,
      color: string,
      scale: number,
    ) => {
      const coreRadius = 3 * scale
      const glowColor = color || "#f97316"
      const { r, g, b } = hexToRgb(glowColor)

      const glowLayers = [
        { radius: 24 * scale, alpha: 0.14 },
        { radius: 18 * scale, alpha: 0.22 },
        { radius: 12 * scale, alpha: 0.35 },
        { radius: 7 * scale, alpha: 0.52 },
        { radius: 4 * scale, alpha: 0.7 },
      ]

      for (const layer of glowLayers) {
        const gradient = context.createRadialGradient(x, y, 0, x, y, layer.radius)
        gradient.addColorStop(0, `rgba(${Math.min(255, r + 90)}, ${Math.min(255, g + 90)}, ${Math.min(255, b + 90)}, ${layer.alpha})`)
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${layer.alpha * 0.85})`)
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
        context.beginPath()
        context.arc(x, y, layer.radius, 0, 2 * Math.PI)
        context.fillStyle = gradient
        context.fill()
      }

      context.save()
      context.globalAlpha = 0.25
      context.strokeStyle = `rgba(${Math.min(255, r + 120)}, ${Math.min(255, g + 120)}, ${Math.min(255, b + 120)}, 0.6)`
      context.lineWidth = 0.8 * scale
      context.lineCap = "round"
      const rayLength = 14 * scale
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4
        const length = i % 2 === 0 ? rayLength : rayLength * 0.65
        context.beginPath()
        context.moveTo(x + Math.cos(angle) * coreRadius * 0.3, y + Math.sin(angle) * coreRadius * 0.3)
        context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
        context.stroke()
      }
      context.restore()

      context.save()
      context.shadowBlur = 22 * scale
      context.shadowColor = glowColor
      context.beginPath()
      context.arc(x, y, coreRadius, 0, 2 * Math.PI)
      const coreGradient = context.createRadialGradient(x, y, 0, x, y, coreRadius)
      coreGradient.addColorStop(0, "#ffffff")
      coreGradient.addColorStop(0.25, `rgb(${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)})`)
      coreGradient.addColorStop(0.6, `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`)
      coreGradient.addColorStop(1, glowColor)
      context.fillStyle = coreGradient
      context.fill()
      context.restore()
    }

    const isSameLocation = (
      a: { lng: number; lat: number },
      b: { lng: number; lat: number },
    ) => Math.abs(a.lng - b.lng) < 0.0001 && Math.abs(a.lat - b.lat) < 0.0001

    const geoToCartesian = (lng: number, lat: number): [number, number, number] => {
      const λ = (lng * Math.PI) / 180
      const φ = (lat * Math.PI) / 180
      const cosφ = Math.cos(φ)
      return [cosφ * Math.sin(λ), Math.sin(φ), cosφ * Math.cos(λ)]
    }

    const slerp = (
      a: [number, number, number],
      b: [number, number, number],
      t: number,
    ): [number, number, number] => {
      const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
      const omega = Math.acos(dot)
      if (omega < 1e-6) return a

      const sinOmega = Math.sin(omega)
      const aWeight = Math.sin((1 - t) * omega) / sinOmega
      const bWeight = Math.sin(t * omega) / sinOmega
      return [
        aWeight * a[0] + bWeight * b[0],
        aWeight * a[1] + bWeight * b[1],
        aWeight * a[2] + bWeight * b[2],
      ]
    }

    const projectElevatedPoint = (x: number, y: number, z: number): [number, number] | null => {
      const radius = Math.hypot(x, y, z)
      const lng = (Math.atan2(x, z) * 180) / Math.PI
      const lat = (Math.asin(y / radius) * 180) / Math.PI
      const geoRotation = d3.geoRotation(projection.rotate())
      const rotated = geoRotation([lng, lat])
      if (!rotated) return null

      const [rx, ry, rz] = geoToCartesian(rotated[0], rotated[1]).map((c) => c * radius) as [
        number,
        number,
        number,
      ]
      if (rz <= 0.001) return null

      const s = projection.scale()
      const [tx, ty] = projection.translate()
      return [s * rx + tx, ty - s * ry]
    }

    const drawHubConnections = (scale: number) => {
      const hubPoint = hubRef.current
      if (!hubPoint) return

      const hubCartesian = geoToCartesian(hubPoint.lng, hubPoint.lat)
      const arcHeight = 0.55
      const segments = 72

      markersRef.current.forEach((marker) => {
        if (isSameLocation(marker, hubPoint)) return

        const targetCartesian = geoToCartesian(marker.lng, marker.lat)
        let drawing = false

        context.beginPath()
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const direction = slerp(hubCartesian, targetCartesian, t)
          const elevation = 1 + arcHeight * Math.sin(Math.PI * t)
          const projected = projectElevatedPoint(
            direction[0] * elevation,
            direction[1] * elevation,
            direction[2] * elevation,
          )

          if (projected) {
            if (!drawing) {
              context.moveTo(projected[0], projected[1])
              drawing = true
            } else {
              context.lineTo(projected[0], projected[1])
            }
          } else {
            drawing = false
          }
        }

        context.strokeStyle = "rgba(59, 130, 246, 0.5)"
        context.lineWidth = 1 * scale
        context.globalAlpha = 0.6
        context.stroke()
        context.globalAlpha = 1
      })
    }

    const render = () => {
      // Clear canvas
      context.clearRect(0, 0, containerWidth, containerHeight)

      const currentScale = projection.scale()
      const scaleFactor = currentScale / radius

      // Draw ocean (globe background)
      context.beginPath()
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI)
      context.fillStyle = "#000000"
      context.fill()
      context.strokeStyle = "#ffffff"
      context.lineWidth = 2 * scaleFactor
      context.stroke()

      if (landFeatures) {
        // Draw graticule
        const graticule = d3.geoGraticule()
        context.beginPath()
        path(graticule())
        context.strokeStyle = "#ffffff"
        context.lineWidth = 1 * scaleFactor
        context.globalAlpha = 0.25
        context.stroke()
        context.globalAlpha = 1

        // Draw land outlines
        context.beginPath()
        landFeatures.features.forEach((feature: any) => {
          path(feature)
        })
        context.strokeStyle = "#ffffff"
        context.lineWidth = 1 * scaleFactor
        context.stroke()

        // Draw halftone dots
        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat])
          if (
            projected &&
            projected[0] >= 0 &&
            projected[0] <= containerWidth &&
            projected[1] >= 0 &&
            projected[1] <= containerHeight
          ) {
            context.beginPath()
            context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI)
            context.fillStyle = "#999999"
            context.fill()
          }
        })

        // Draw hub connection arcs
        drawHubConnections(scaleFactor)

        // Draw location markers
        markersRef.current.forEach((marker) => {
          const projected = projection([marker.lng, marker.lat])
          if (!projected) return

          const [x, y] = projected
          drawStarlightMarker(x, y, marker.color ?? "#f97316", scaleFactor)
        })
      }
    }

    const loadWorldData = async () => {
      try {
        setIsLoading(true)

        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json",
        )
        if (!response.ok) throw new Error("Failed to load land data")

        landFeatures = await response.json()

        // Generate dots for all land features
        let totalDots = 0
        landFeatures.features.forEach((feature: any) => {
          // Fewer dots on mobile → fewer per-frame projections (less jank)
          const dots = generateDotsInPolygon(feature, isMobileViewport ? 22 : 16)
          dots.forEach(([lng, lat]) => {
            allDots.push({ lng, lat, visible: true })
            totalDots++
          })
        })

        console.log(`[v0] Total dots generated: ${totalDots} across ${landFeatures.features.length} land features`)

        render()
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load land map data")
        setIsLoading(false)
      }
    }

    // Set up rotation and interaction
    const rotation: [number, number] = [0, 0]
    let autoRotate = true
    const rotationSpeed = 0.11
    const rotate = () => {
      if (autoRotate) {
        rotation[0] += rotationSpeed
        projection.rotate(rotation)
        render()
      }
    }

    // Auto-rotation timer
    const rotationTimer = d3.timer(rotate)

    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false
      const startX = event.clientX
      const startY = event.clientY
      const startRotation: [number, number] = [...rotation]

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.5
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY

        rotation[0] = startRotation[0] + dx * sensitivity
        rotation[1] = startRotation[1] - dy * sensitivity
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]))

        projection.rotate(rotation)
        render()
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)

        setTimeout(() => {
          autoRotate = true
        }, 10)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
      const newRadius = clampScale(projection.scale() * scaleFactor)
      projection.scale(newRadius)
      render()
    }

    // --- Touch support (single-finger rotate, two-finger pinch zoom) ---
    let touchMode: "none" | "rotate" | "pinch" = "none"
    let touchStartX = 0
    let touchStartY = 0
    let touchStartRotation: [number, number] = [0, 0]
    let pinchStartDist = 0
    let pinchStartScale = 0

    const touchDistance = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)

    const beginRotate = (touch: Touch) => {
      touchMode = "rotate"
      touchStartX = touch.clientX
      touchStartY = touch.clientY
      touchStartRotation = [...rotation]
    }

    const handleTouchStart = (event: TouchEvent) => {
      autoRotate = false
      if (event.touches.length === 1) {
        beginRotate(event.touches[0])
      } else if (event.touches.length === 2) {
        touchMode = "pinch"
        pinchStartDist = touchDistance(event.touches[0], event.touches[1])
        pinchStartScale = projection.scale()
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      if (touchMode === "rotate" && event.touches.length === 1) {
        const sensitivity = 0.5
        const dx = event.touches[0].clientX - touchStartX
        const dy = event.touches[0].clientY - touchStartY
        rotation[0] = touchStartRotation[0] + dx * sensitivity
        rotation[1] = touchStartRotation[1] - dy * sensitivity
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]))
        projection.rotate(rotation)
        render()
      } else if (touchMode === "pinch" && event.touches.length === 2) {
        const dist = touchDistance(event.touches[0], event.touches[1])
        if (pinchStartDist > 0) {
          const factor = dist / pinchStartDist
          const newRadius = clampScale(pinchStartScale * factor)
          projection.scale(newRadius)
          render()
        }
      }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length === 0) {
        touchMode = "none"
        setTimeout(() => {
          autoRotate = true
        }, 10)
      } else if (event.touches.length === 1) {
        // pinch released to one finger → continue rotating from the remaining touch
        beginRotate(event.touches[0])
      }
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("wheel", handleWheel, { passive: false })
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("touchend", handleTouchEnd)
    canvas.addEventListener("touchcancel", handleTouchEnd)

    // Load the world data
    loadWorldData()

    // Cleanup
    return () => {
      rotationTimer.stop()
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("wheel", handleWheel)
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchend", handleTouchEnd)
      canvas.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [width, height])

  if (error) {
    return (
      <div className={`dark flex items-center justify-center bg-card rounded-2xl p-8 ${className}`}>
        <div className="text-center">
          <p className="dark text-destructive font-semibold mb-2">Error loading Earth visualization</p>
          <p className="dark text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative flex justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-auto max-w-full rounded-2xl bg-background dark"
        style={{ touchAction: "none" }}
      />
    </div>
  )
}
