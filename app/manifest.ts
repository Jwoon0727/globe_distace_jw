import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Distance Globe",
    short_name: "Globe",
    description: "GLOBE_DISTANCE_MEASURER",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait",
    icons: [
      {
        src: "/public/192192D.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/public/512512D.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
