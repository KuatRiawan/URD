import { useMemo, useState } from 'react';
import { MapPin, Buildings, Compass, Wrench, FileText, Crosshair } from '@phosphor-icons/react';
import { INDONESIA_PROVINCES, CITY_COORDS } from './indonesiaMapData';

function resolveCoords(regionName, idx = 0) {
  const clean = (regionName || '').toLowerCase().trim();
  for (const [key, val] of Object.entries(CITY_COORDS)) {
    if (clean.includes(key)) {
      // Offset terukur jika beberapa titik berada pada wilayah berdekatan
      const offsetX = ((idx % 3) - 1) * 2.2;
      const offsetY = idx % 2 === 0 ? -1.6 : 1.8;
      return {
        x: Number((val.x + offsetX).toFixed(2)),
        y: Number((val.y + offsetY).toFixed(2)),
        name: val.name
      };
    }
  }

  // Fallback Jabodetabek
  return {
    x: Number((183.0 + ((idx % 3) - 1) * 2.5).toFixed(2)),
    y: Number((175.0 + (idx % 2 === 0 ? -1.5 : 2.0)).toFixed(2)),
    name: regionName || 'Pusat / Jabodetabek'
  };
}

export function IndonesiaMapWidget({ regions = [] }) {
  const [activePin, setActivePin] = useState(null);
  const [hoveredProv, setHoveredProv] = useState(null);

  // Total unit alat seluruh lokasi
  const totalUnits = useMemo(() => {
    return regions.reduce((acc, r) => acc + Number(r.unit_count || 0), 0);
  }, [regions]);

  // Siapkan data titik koordinat
  const mappedRegions = useMemo(() => {
    return regions.map((reg, idx) => {
      const coords = resolveCoords(reg.region_name, idx);
      const units = Number(reg.unit_count || 0);
      const orders = Number(reg.order_count || 0);
      const clients = Number(reg.client_count || 0);
      const isMajor = units >= 5;

      return {
        ...reg,
        ...coords,
        units,
        orders,
        clients,
        isMajor,
        idx
      };
    });
  }, [regions]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
      {/* Header Kartu */}
      <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-lg bg-brand-500/10 dark:bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 border border-brand-500/20 flex items-center justify-center shrink-0">
            <MapPin size={18} weight="bold" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Sebaran Wilayah Lokasi Pengujian
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Peta geospasial sebaran site klien, unit alat, dan inspeksi K3 di Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            <Buildings size={14} weight="bold" />
            <span>{regions.length} Wilayah Site</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/10 dark:bg-rose-500/10 border border-brand-500/20 text-[#C81E1E] dark:text-rose-400 font-bold">
            <Wrench size={14} weight="bold" />
            <span>{totalUnits} Unit Alat</span>
          </span>
        </div>
      </div>

      {/* Area Peta Vektor SVG Indonesia (Natural Earth 34 Provinsi) */}
      <div className="relative p-3 sm:p-5 bg-gradient-to-b from-slate-50/50 via-slate-100/30 to-slate-50/50 dark:from-slate-950/50 dark:via-slate-900/30 dark:to-slate-950/50 overflow-hidden">
        {/* Overlay Informasi Wilayah Hover & Kompas */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          {hoveredProv && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all">
              <Crosshair size={13} className="text-[#C81E1E]" weight="bold" />
              <span>Provinsi {hoveredProv}</span>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <Compass size={14} weight="bold" className="text-[#C81E1E]" />
          <span>U (Utara)</span>
        </div>

        <div className="relative w-full aspect-[2.8/1] select-none">
          <svg
            viewBox="-10 -10 720 255"
            className="w-full h-full filter drop-shadow-xs"
            onMouseLeave={() => {
              setActivePin(null);
              setHoveredProv(null);
            }}
          >
            <defs>
              {/* Garis Grid Koordinat Kelautan */}
              <pattern id="marineGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-slate-200/70 dark:text-slate-800/60" />
              </pattern>

              {/* Bayangan Pin Peta */}
              <filter id="urdPinShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#C81E1E" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* Background Grid */}
            <rect x="-10" y="-10" width="720" height="255" fill="url(#marineGrid)" />

            {/* Garis Khatulistiwa (Ekuator 0°) */}
            <line
              x1="0"
              y1="78"
              x2="700"
              y2="78"
              stroke="currentColor"
              strokeWidth="0.6"
              strokeDasharray="3 3"
              className="text-slate-300 dark:text-slate-700"
            />
            <text x="2" y="75" className="text-[7.5px] font-mono fill-slate-400 dark:fill-slate-500 font-semibold">
              Khatulistiwa (0°)
            </text>

            {/* Garis Lintang Referensi */}
            <text x="660" y="16" className="text-[7px] font-mono fill-slate-300 dark:fill-slate-600">6° LU</text>
            <text x="660" y="232" className="text-[7px] font-mono fill-slate-300 dark:fill-slate-600">11° LS</text>

            {/* ========================================================================= */}
            {/* 34 PROVINSI INDONESIA (VEKTOR GEOGRAFIS ASLI NATURAL EARTH)               */}
            {/* ========================================================================= */}
            <g className="fill-slate-200/90 dark:fill-slate-800/90 stroke-slate-300 dark:stroke-slate-700/80 stroke-[0.4] transition-colors">
              {INDONESIA_PROVINCES.map((prov) => (
                <path
                  key={prov.id}
                  id={prov.id}
                  d={prov.d}
                  className="transition-colors duration-150 hover:fill-slate-300 dark:hover:fill-slate-700/80 cursor-default"
                  onMouseEnter={() => setHoveredProv(prov.name)}
                >
                  <title>{prov.name}</title>
                </path>
              ))}
            </g>

            {/* ========================================================================= */}
            {/* TITIK RADAR LOKASI INSPEKSI & SITE KLIEN PT UPAYA RIKSA DAYA             */}
            {/* ========================================================================= */}
            {mappedRegions.map((r) => {
              const isActive = activePin?.region_name === r.region_name;

              return (
                <g
                  key={`${r.region_name}-${r.idx}`}
                  className="cursor-pointer group"
                  onClick={() => setActivePin(isActive ? null : r)}
                  onMouseEnter={() => setActivePin(r)}
                >
                  {/* Cincin Lingkar Luar */}
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r={r.isMajor ? 5.5 : 4}
                    fill="#C81E1E"
                    fillOpacity={isActive ? 0.4 : 0.2}
                    stroke="#C81E1E"
                    strokeWidth="0.8"
                    className="transition-all duration-150 group-hover:scale-125"
                  />

                  {/* Titik Inti Pin Beraksen URD */}
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r={r.isMajor ? 2.8 : 2.2}
                    fill="#C81E1E"
                    stroke="#ffffff"
                    strokeWidth="0.7"
                    filter="url(#urdPinShadow)"
                    className="transition-transform duration-200 group-hover:scale-150"
                  />

                  {/* Label Nama Kota Singkat */}
                  <text
                    x={r.x}
                    y={r.y - (r.isMajor ? 7 : 5)}
                    textAnchor="middle"
                    className={`text-[6.5px] font-bold pointer-events-none transition-all ${
                      isActive
                        ? 'fill-rose-700 dark:fill-rose-300 font-extrabold text-[7.5px]'
                        : 'fill-slate-700 dark:fill-slate-300'
                    }`}
                  >
                    {r.region_name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip Interaktif untuk Pin yang Aktif */}
          {activePin && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-150 -translate-x-1/2 -translate-y-full"
              style={{
                left: `${((activePin.x + 10) / 720) * 100}%`,
                top: `${((activePin.y + 10) / 255) * 100}%`,
                marginBottom: '10px'
              }}
            >
              <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-xs text-xs min-w-[150px]">
                <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-slate-800">
                  <MapPin size={13} weight="fill" className="text-rose-400" />
                  <span className="font-bold text-slate-100">{activePin.region_name}</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Total Unit Alat:</span>
                    <span className="font-bold text-white">{activePin.units} Unit</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Jumlah Order:</span>
                    <span className="font-medium text-slate-200">{activePin.orders} PO</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Jumlah Klien:</span>
                    <span className="font-medium text-slate-200">{activePin.clients} Klien</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daftar Site Wilayah Aktif di Bawah Peta */}
      <div className="border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {mappedRegions.map((reg) => {
            const isSelected = activePin?.region_name === reg.region_name;
            return (
              <button
                key={reg.region_name}
                type="button"
                onClick={() => setActivePin(isSelected ? null : reg)}
                className={`text-left p-2.5 rounded-lg border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/40 dark:bg-rose-950/20 ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    <span className="h-2 w-2 rounded-full bg-[#C81E1E] shrink-0" />
                    <span className="truncate">{reg.region_name}</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#C81E1E] dark:text-rose-400 shrink-0">
                    {reg.units} Unit
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                  <span>{reg.clients} Klien</span>
                  <span>{reg.orders} Order</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
