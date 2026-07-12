import { useEffect, useMemo, useRef, useState } from 'react'
import { cityById } from '../data/cities'
import { annualDaylight, dayOfYear, daysInYear } from '../science/solar'
import { useSimulation } from '../store/useSimulation'

const HEIGHT = 330
const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function DaylightChart() {
  const dateIso = useSimulation((state) => state.dateIso)
  const selectedIds = useSimulation((state) => state.selectedCityIds)
  const focusedId = useSimulation((state) => state.focusedCityId)
  const tilt = useSimulation((state) => state.tilt)
  const setProgress = useSimulation((state) => state.setProgress)
  const [hoverDay, setHoverDay] = useState<number | null>(null)
  const [chartWidth, setChartWidth] = useState(820)
  const chartWrap = useRef<HTMLDivElement>(null)
  const date = new Date(dateIso)
  const year = date.getUTCFullYear()
  const totalDays = daysInYear(year)
  const currentDay = dayOfYear(date) - 1
  const compact = chartWidth < 560
  const pad = { top: 28, right: compact ? 10 : 24, bottom: 48, left: compact ? 38 : 52 }
  const x = (day: number) => pad.left + (day / (totalDays - 1)) * (chartWidth - pad.left - pad.right)
  const y = (hours: number) => pad.top + ((24 - hours) / 24) * (HEIGHT - pad.top - pad.bottom)

  useEffect(() => {
    if (!chartWrap.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setChartWidth(Math.max(320, Math.round(entry.contentRect.width))))
    observer.observe(chartWrap.current)
    return () => observer.disconnect()
  }, [])

  const series = useMemo(() => selectedIds.map((id) => {
    const city = cityById(id)
    return { city, values: annualDaylight(city.latitude, year, tilt) }
  }), [selectedIds, tilt, year])

  const pathFor = (values: number[]) => values.map((value, index) => `${index ? 'L' : 'M'}${x(index).toFixed(2)},${y(value).toFixed(2)}`).join(' ')
  const pointerDay = hoverDay ?? currentDay

  return (
    <section className="chart-card" aria-labelledby="chart-title">
      <div className="chart-heading">
        <div><span className="eyebrow">DAYLIGHT ACROSS {year}</span><h2 id="chart-title">Follow the light</h2></div>
        <div className="chart-legend" aria-label="Compared cities">
          {series.map(({ city }) => <span key={city.id} className={city.id === focusedId ? 'is-focused' : ''}><i style={{ background: city.color }} />{city.name}</span>)}
        </div>
      </div>
      <div className="chart-scroll" ref={chartWrap}>
        <svg className="daylight-chart" width={chartWidth} height={HEIGHT} viewBox={`0 0 ${chartWidth} ${HEIGHT}`} role="img" aria-label={`Daylight hours through ${year} for ${series.map(({ city }) => city.name).join(', ')}`} onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect()
          const svgX = ((event.clientX - box.left) / box.width) * chartWidth
          setHoverDay(Math.max(0, Math.min(totalDays - 1, Math.round(((svgX - pad.left) / (chartWidth - pad.left - pad.right)) * (totalDays - 1)))))
        }} onPointerLeave={() => setHoverDay(null)} onPointerDown={() => setProgress(pointerDay / (totalDays - 1))}>
          <defs>
            <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#74d9ff" stopOpacity=".13" /><stop offset="1" stopColor="#74d9ff" stopOpacity="0" /></linearGradient>
            <filter id="line-glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {[0, 6, 12, 18, 24].map((hour) => <g key={hour}><line x1={pad.left} x2={chartWidth - pad.right} y1={y(hour)} y2={y(hour)} className={hour === 12 ? 'grid-line grid-line--mid' : 'grid-line'} /><text x={pad.left - 9} y={y(hour) + 4} textAnchor="end" className="axis-label">{hour}h</text></g>)}
          {monthStarts.map((day, index) => <g key={monthLabels[index]}><line x1={x(day)} x2={x(day)} y1={pad.top} y2={HEIGHT - pad.bottom} className="month-line" />{(!compact || index % 2 === 0) && <text x={x(day)} y={HEIGHT - 18} textAnchor="middle" className="axis-label axis-label--month">{monthLabels[index]}</text>}</g>)}
          {[79, 171, 265, 355].map((day, index) => <g key={day}><line x1={x(day)} x2={x(day)} y1={pad.top} y2={HEIGHT - pad.bottom} className={index % 2 === 0 ? 'event-line event-line--equinox' : 'event-line'} />{!compact && <text x={x(day) + (day > 330 ? -5 : 5)} y={pad.top + 12} textAnchor={day > 330 ? 'end' : 'start'} className="event-label">{index % 2 === 0 ? 'EQUINOX' : 'SOLSTICE'}</text>}</g>)}
          {series.map(({ city, values }) => <g key={city.id}>
            <path d={pathFor(values)} fill="none" stroke={city.color} strokeWidth={1.2} strokeOpacity={0.2} vectorEffect="non-scaling-stroke" />
            <path d={pathFor(values.slice(0, currentDay + 1))} fill="none" stroke={city.color} strokeWidth={city.id === focusedId ? 3.2 : 2} strokeOpacity={city.id === focusedId ? 1 : 0.72} filter={city.id === focusedId ? 'url(#line-glow)' : undefined} vectorEffect="non-scaling-stroke" />
          </g>)}
          <line x1={x(currentDay)} x2={x(currentDay)} y1={pad.top} y2={HEIGHT - pad.bottom} className="today-line" />
          {series.map(({ city, values }) => <circle key={city.id} cx={x(currentDay)} cy={y(values[currentDay] ?? 12)} r={city.id === focusedId ? 5.5 : 3.5} fill={city.color} stroke="#07111d" strokeWidth="2" />)}
          {hoverDay !== null && <><line x1={x(hoverDay)} x2={x(hoverDay)} y1={pad.top} y2={HEIGHT - pad.bottom} className="hover-line" /><g transform={`translate(${Math.max(4, Math.min(x(hoverDay) + 10, chartWidth - 164))},${pad.top + 20})`}><rect width="156" height={34 + series.length * 24} rx="8" className="chart-tooltip-bg" /><text x="11" y="21" className="chart-tooltip-date">{new Date(Date.UTC(year, 0, hoverDay + 1)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</text>{series.map(({ city, values }, index) => <text key={city.id} x="11" y={47 + index * 24} className="chart-tooltip-value" fill={city.color}>{city.name}: {values[hoverDay].toFixed(1)}h</text>)}</g></>}
        </svg>
      </div>
      <p className="chart-footnote"><span>Why not exactly 12 hours?</span> Refraction bends sunlight over the horizon, and sunrise starts at the Sun’s upper edge. Equinox days are therefore a little longer than 12 hours.</p>
    </section>
  )
}
