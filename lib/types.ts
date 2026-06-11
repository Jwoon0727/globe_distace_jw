export interface Place {
  id: string
  name: string
  address: string
  lng: number
  lat: number
}

export interface RecentSearch {
  id: string
  origin: Place
  destText: string
  url: string
  ts: number
}
