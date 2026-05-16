// src/components/emergency/MapComponent.jsx
import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'
import 'leaflet-control-geocoder'

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function LocationMarker({ onSelect }) {
  const [position, setPosition] = useState(null)
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onSelect(e.latlng.lat, e.latlng.lng, '')
      
      // Reverse geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(res => res.json())
        .then(data => {
          onSelect(e.latlng.lat, e.latlng.lng, data.display_name)
        })
        .catch(console.error)
    },
  })

  return position === null ? null : <Marker position={position} draggable />
}

export default function MapComponent({ lat, lng, onSelect, searchQuery }) {
  const mapRef = useRef()
  const [center, setCenter] = useState([20.5937, 78.9629]) // Default to India

  useEffect(() => {
    if (lat && lng) {
      setCenter([lat, lng])
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 13)
      }
    }
  }, [lat, lng])

  useEffect(() => {
    if (searchQuery && searchQuery.length > 3) {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      fetch(geocodeUrl)
        .then(res => res.json())
        .then(data => {
          if (data && data[0]) {
            const newLat = parseFloat(data[0].lat)
            const newLng = parseFloat(data[0].lon)
            setCenter([newLat, newLng])
            if (mapRef.current) {
              mapRef.current.setView([newLat, newLng], 13)
            }
            onSelect(newLat, newLng, data[0].display_name)
          }
        })
        .catch(console.error)
    }
  }, [searchQuery, onSelect])

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onSelect={onSelect} />
    </MapContainer>
  )
}