"use client"

import { useState } from "react"
import RotatingEarth from "@/components/rotating-earth"
import OriginList from "@/components/origin-list"
import DistanceForm from "@/components/distance-form"
import ExternalLinks from "@/components/external-links"
import RecentSearches from "@/components/recent-searches"
import type { Place } from "@/lib/types"

export default function Home() {
  const [origin, setOrigin] = useState<Place | null>(null)

  return (
    <main className="min-h-screen bg-black flex flex-col items-center overflow-x-hidden">
      <div className="w-full flex justify-center px-2">
        <RotatingEarth
          width={1100}
          height={900}
          hub={{ lng: -74.2585, lat: 41.1601 }}
          markers={[
            { lng: 127, lat: 37, color: "#f97316" },
            { lng: -74.2585, lat: 41.1601, color: "#3b82f6" },
            { lng: -79.9478, lat: 43.6276, color: "#3b82f6" },
            { lng: -98.895, lat: 19.5447, color: "#3b82f6" },
            { lng: -69.8339, lat: 18.4907, color: "#3b82f6" },
            { lng: -74.3414, lat: 4.8219, color: "#3b82f6" },
            { lng: -47.9351, lat: -23.2185, color: "#3b82f6" },
            { lng: 139.3802, lat: 35.4385, color: "#3b82f6" },
            { lng: 121.1147, lat: 24.9625, color: "#3b82f6" },
            { lng: 121.0118, lat: 14.6369, color: "#3b82f6" },
            { lng: 106.7905, lat: -6.1748, color: "#3b82f6" },
            { lng: 77.5857, lat: 13.2384, color: "#3b82f6" },
            { lng: 27.8182, lat: -26.0911, color: "#3b82f6" },
            { lng: 5.7538, lat: 6.6183, color: "#3b82f6" },
            { lng: -0.0718, lat: 5.6114, color: "#3b82f6" },
            { lng: 36.8834, lat: -1.2212, color: "#3b82f6" },
            { lng: 28.3297, lat: -15.3941, color: "#3b82f6" },
            { lng: 15.3264, lat: -4.3315, color: "#3b82f6" },
            { lng: 150.8415, lat: -34.0102, color: "#3b82f6" },
            { lng: 147.2025, lat: -9.4933, color: "#3b82f6" },
            { lng: 178.4388, lat: -18.1256, color: "#3b82f6" },
            { lng: 159.9824, lat: -9.4358, color: "#3b82f6" },
            { lng: 8.2435, lat: 50.3241, color: "#3b82f6" },
            { lng: 0.4901, lat: 51.6882, color: "#3b82f6" },
            { lng: 1.1894, lat: 49.2085, color: "#3b82f6" },
            { lng: 11.6967, lat: 55.7091, color: "#3b82f6" },
            { lng: 12.5448, lat: 41.9806, color: "#3b82f6" },
            { lng: -3.4939, lat: 40.5186, color: "#3b82f6" },
            { lng: 23.8655, lat: 38.1065, color: "#3b82f6" },
            { lng: 20.8122, lat: 52.0913, color: "#3b82f6" },
            { lng: 19.0069, lat: 47.4925, color: "#3b82f6" },
            { lng: 26.1132, lat: 44.4372, color: "#3b82f6" },
            { lng: 25.0117, lat: 60.2944, color: "#3b82f6" },
            { lng: -58.5284, lat: -34.8219, color: "#3b82f6" },
            { lng: -70.7932, lat: -33.3283, color: "#3b82f6" },
            { lng: -77.0806, lat: -11.9722, color: "#3b82f6" },
            { lng: -79.9723, lat: -2.0465, color: "#3b82f6" },
            { lng: -63.1678, lat: -17.7345, color: "#3b82f6" },
            { lng: 23.9511, lat: 49.9015, color: "#3b82f6" },
            { lng: 34.7702, lat: 32.0691, color: "#3b82f6" },
            { lng: 76.8188, lat: 43.2422, color: "#3b82f6" },
            { lng: 17.1357, lat: 48.1978, color: "#3b82f6" },
            { lng: 28.8475, lat: 47.0261, color: "#3b82f6" },
            { lng: 44.9122, lat: 41.6781, color: "#3b82f6" },
          ]}
        />
      </div>

      <div className="w-full max-w-lg px-4 pb-16 -mt-4 sm:-mt-8 flex flex-col gap-4">
        <div className="glass rounded-2xl p-5">
          <OriginList value={origin} onChange={setOrigin} />
        </div>
        <div className="glass rounded-2xl p-5">
          <DistanceForm origin={origin} />
        </div>
        <div className="glass rounded-2xl p-5">
          <ExternalLinks />
        </div>
        <RecentSearches />
      </div>
    </main>
  )
}
