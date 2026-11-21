import { TileLayer } from 'react-leaflet'

export default function CivicTileLayer() {
  return (
    <TileLayer
      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      className="civic-tiles"
    />
  )
}
