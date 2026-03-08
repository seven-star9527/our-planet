// src/app/footprint/CityMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// 修复 Leaflet 在 Next.js 中默认图标丢失的问题
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // 确保移动端容器变化后地图正确渲染
    setTimeout(() => map.invalidateSize(), 100);
  }, [center, zoom, map]);
  return null;
}

export default function CityMap({ center, cityName, spots }: { center: [number, number], cityName: string, spots: any[] }) {
  // ECharts 坐标是 [经度, 纬度]，Leaflet 是 [纬度, 经度]，需反转
  const leafletCenter: [number, number] = [center[1], center[0]];

  return (
    <>
      {/* ✨ 关键修复：强制引入外部 CSS，防止 Next.js 移动端打包时丢失样式导致地图空白 */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <MapContainer
        center={leafletCenter}
        zoom={12}
        zoomControl={false} // 隐藏默认的 +- 按钮，移动端更清爽
        style={{ height: '100%', width: '100%', zIndex: 1, borderRadius: '1.5rem' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={leafletCenter} zoom={12} />

        {/* 城市中心的默认坐标点 */}
        <Marker position={leafletCenter} icon={icon}>
          <Popup>
            <div className="text-center">
              <b className="text-emerald-500 text-base">{cityName}</b>
              <p className="text-xs text-gray-500 mt-1">这里留下了 {spots.length} 个专属足迹</p>
            </div>
          </Popup>
        </Marker>

        {/* 详细打卡点 (如果以后录入了经纬度) */}
        {spots.map((spot: any) => {
          if (spot.latitude && spot.longitude) {
            return (
              <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={icon}>
                <Popup>
                  <b>{spot.location}</b><br />
                  <span className="text-xs text-gray-500">{spot.notes}</span>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </>
  );
}