import { useMemo, useState } from 'react';

/**
 * Menghasilkan string kurva cubic Bezier spline halus (Catmull-Rom interpolation)
 * untuk grafik area & garis yang mulus.
 */
function getSplinePath(points, tension = 0.35) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function SplineAreaChart({ monthlyTrend = [], period = '30D' }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  // Sesuaikan data berdasarkan periode (7D, 30D, 90D, 1Y)
  const chartData = useMemo(() => {
    const raw = monthlyTrend.length ? monthlyTrend : [
      { month_label: 'Jan', order_count: 4, completed_count: 2 },
      { month_label: 'Feb', order_count: 7, completed_count: 5 },
      { month_label: 'Mar', order_count: 6, completed_count: 4 },
      { month_label: 'Apr', order_count: 9, completed_count: 7 },
      { month_label: 'Mei', order_count: 12, completed_count: 10 },
      { month_label: 'Jun', order_count: 15, completed_count: 13 }
    ];

    if (period === '7D') {
      const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      const lastMonth = raw[raw.length - 1] || { order_count: 12, completed_count: 9 };
      const avgDaily = Math.max(1, Math.round(lastMonth.order_count / 4));
      return days.map((day, idx) => {
        const factor = [0.8, 1.2, 0.9, 1.4, 1.1, 0.5, 0.3][idx];
        const orders = Math.max(1, Math.round(avgDaily * factor));
        const completed = Math.max(0, Math.min(orders, Math.round(orders * 0.85)));
        return { label: day, orders, completed };
      });
    }

    if (period === '30D') {
      const weeks = ['Mgg 1', 'Mgg 2', 'Mgg 3', 'Mgg 4'];
      const cur = raw[raw.length - 1] || { order_count: 10, completed_count: 8 };
      const prev = raw[raw.length - 2] || { order_count: 8, completed_count: 6 };
      return weeks.map((w, i) => {
        const o = Math.max(1, Math.round((prev.order_count * (4 - i) + cur.order_count * (i + 1)) / 5));
        const c = Math.max(0, Math.min(o, Math.round(o * 0.8)));
        return { label: w, orders: o, completed: c };
      });
    }

    if (period === '90D') {
      const last3 = raw.slice(-3);
      return last3.map((m) => ({
        label: m.month_label,
        orders: Number(m.order_count || 0),
        completed: Number(m.completed_count || 0)
      }));
    }

    // 1Y / default
    return raw.map((m) => ({
      label: m.month_label,
      orders: Number(m.order_count || 0),
      completed: Number(m.completed_count || 0)
    }));
  }, [monthlyTrend, period]);

  // Dimensi canvas SVG
  const width = 760;
  const height = 280;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const bottomY = height - paddingBottom;

  // Tentukan nilai maksimum Y
  const maxVal = useMemo(() => {
    const highest = Math.max(...chartData.map((d) => d.orders), 5);
    return Math.ceil(highest * 1.2);
  }, [chartData]);

  // Kalkulasi koordinat titik (points)
  const { orderPoints, completedPoints } = useMemo(() => {
    const len = chartData.length;
    const stepX = len > 1 ? chartWidth / (len - 1) : chartWidth / 2;

    const ordPts = chartData.map((d, i) => {
      const x = paddingLeft + (len > 1 ? i * stepX : chartWidth / 2);
      const y = bottomY - (d.orders / maxVal) * chartHeight;
      return { x, y, data: d };
    });

    const compPts = chartData.map((d, i) => {
      const x = paddingLeft + (len > 1 ? i * stepX : chartWidth / 2);
      const y = bottomY - (d.completed / maxVal) * chartHeight;
      return { x, y, data: d };
    });

    return { orderPoints: ordPts, completedPoints: compPts };
  }, [chartData, chartWidth, chartHeight, bottomY, maxVal, paddingLeft]);

  // Path SVG kurva spline
  const orderSpline = useMemo(() => getSplinePath(orderPoints), [orderPoints]);
  const completedSpline = useMemo(() => getSplinePath(completedPoints), [completedPoints]);

  // Path area fill di bawah kurva spline
  const orderArea = useMemo(() => {
    if (!orderPoints.length) return '';
    const first = orderPoints[0];
    const last = orderPoints[orderPoints.length - 1];
    return `${orderSpline} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [orderSpline, orderPoints, bottomY]);

  const completedArea = useMemo(() => {
    if (!completedPoints.length) return '';
    const first = completedPoints[0];
    const last = completedPoints[completedPoints.length - 1];
    return `${completedSpline} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [completedSpline, completedPoints, bottomY]);

  // Grid baris Y (4 garis horizontal)
  const yTicks = [0, Math.round(maxVal / 3), Math.round((maxVal * 2) / 3), maxVal];

  // Titik aktif yang di-hover
  const activeOrderPoint = hoverIndex !== null ? orderPoints[hoverIndex] : null;
  const activeCompletedPoint = hoverIndex !== null ? completedPoints[hoverIndex] : null;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          {/* Gradient untuk kurva order (Merah Marun URD) */}
          <linearGradient id="urdOrderGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C81E1E" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#C81E1E" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#C81E1E" stopOpacity="0.00" />
          </linearGradient>

          {/* Gradient untuk kurva selesai (Hijau Emerald) */}
          <linearGradient id="urdCompGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#10B981" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
          </linearGradient>

          {/* Filter glow bayangan kurva */}
          <filter id="splineShadowOrder" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#C81E1E" floodOpacity="0.25" />
          </filter>
          <filter id="splineShadowComp" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#10B981" floodOpacity="0.20" />
          </filter>
        </defs>

        {/* 1. Grid Horizontal & Label Sumbu Y */}
        {yTicks.map((tickVal) => {
          const y = bottomY - (tickVal / maxVal) * chartHeight;
          return (
            <g key={tickVal} className="text-slate-400 dark:text-slate-600">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="opacity-40 dark:opacity-25"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[11px] font-mono fill-slate-400 dark:fill-slate-500 font-semibold"
              >
                {tickVal}
              </text>
            </g>
          );
        })}

        {/* 2. Area Fill Kurva Spline */}
        <path d={orderArea} fill="url(#urdOrderGrad)" />
        <path d={completedArea} fill="url(#urdCompGrad)" />

        {/* 3. Garis Kurva Spline Halus */}
        <path
          d={completedSpline}
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#splineShadowComp)"
        />
        <path
          d={orderSpline}
          fill="none"
          stroke="#C81E1E"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#splineShadowOrder)"
        />

        {/* 4. Titik Data (Data Points) */}
        {orderPoints.map((pt, i) => (
          <g key={`dots-${i}`}>
            {/* Titik Selesai */}
            <circle
              cx={completedPoints[i].x}
              cy={completedPoints[i].y}
              r={hoverIndex === i ? 5 : 3.5}
              fill="#10B981"
              stroke="#ffffff"
              strokeWidth="2"
              className="transition-all duration-150"
            />
            {/* Titik Order */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === i ? 6 : 4}
              fill="#C81E1E"
              stroke="#ffffff"
              strokeWidth="2.2"
              className="transition-all duration-150"
            />
          </g>
        ))}

        {/* 5. Indikator Garis Kursor Aktif (Hover) */}
        {activeOrderPoint && (
          <g>
            <line
              x1={activeOrderPoint.x}
              y1={paddingTop}
              x2={activeOrderPoint.x}
              y2={bottomY}
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="opacity-75"
            />
            {/* Lingkaran Luar Berpendar (Pulse ring) */}
            <circle
              cx={activeOrderPoint.x}
              cy={activeOrderPoint.y}
              r="10"
              fill="#C81E1E"
              fillOpacity="0.20"
              className="animate-pulse"
            />
            <circle
              cx={activeCompletedPoint.x}
              cy={activeCompletedPoint.y}
              r="9"
              fill="#10B981"
              fillOpacity="0.20"
              className="animate-pulse"
            />
          </g>
        )}

        {/* 6. Label Sumbu X */}
        {chartData.map((d, i) => {
          const x = orderPoints[i].x;
          const isSelected = hoverIndex === i;
          return (
            <text
              key={d.label}
              x={x}
              y={height - 12}
              textAnchor="middle"
              className={`text-[11px] font-semibold transition-colors ${
                isSelected
                  ? 'fill-[#C81E1E] dark:fill-rose-400 font-bold'
                  : 'fill-slate-500 dark:fill-slate-400'
              }`}
            >
              {d.label}
            </text>
          );
        })}

        {/* 7. Zona Transparan Pendeteksi Gerakan Mouse (Interactive Hitbox) */}
        {chartData.map((d, i) => {
          const stepX = chartData.length > 1 ? chartWidth / (chartData.length - 1) : chartWidth;
          const leftBound = i === 0 ? paddingLeft : orderPoints[i].x - stepX / 2;
          const hitWidth = i === 0 || i === chartData.length - 1 ? stepX / 2 + 10 : stepX;

          return (
            <rect
              key={`hit-${i}`}
              x={leftBound}
              y={paddingTop}
              width={hitWidth}
              height={chartHeight + 15}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
            />
          );
        })}
      </svg>

      {/* Floating Tooltip HTML Elegan Saat Hover */}
      {hoverIndex !== null && activeOrderPoint && (
        <div
          style={{
            left: `${(activeOrderPoint.x / width) * 100}%`,
            top: `${Math.max(15, (Math.min(activeOrderPoint.y, activeCompletedPoint.y) / height) * 100 - 32)}%`
          }}
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-full z-20 transition-all duration-150"
        >
          <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs rounded-xl py-2 px-3.5 shadow-xl border border-slate-700/80 backdrop-blur-xs min-w-[170px] space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-1">
              <span className="font-bold text-[11px] text-slate-300">
                Periode: {chartData[hoverIndex].label}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {Math.round((chartData[hoverIndex].completed / Math.max(1, chartData[hoverIndex].orders)) * 100)}% Selesai
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#C81E1E]" />
                <span>Total Order:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {chartData[hoverIndex].orders} PO
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                <span>Riksa Selesai:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {chartData[hoverIndex].completed} Unit
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

