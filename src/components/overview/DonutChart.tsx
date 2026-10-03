import React, { useState } from 'react';
import { DonutSegment } from '../../lib/donut';
import { formatSatang } from '../../lib/money';

interface DonutChartProps {
  segments: DonutSegment[];
  totalSatang: number;
  centerSubtitle?: string;
  isEmpty: boolean;
  isMasked?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  totalSatang,
  centerSubtitle = 'รวมทั้งหมด',
  isEmpty,
  isMasked = false,
}) => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const radius = 52;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~326.726
  const gap = segments.length > 1 ? 4 : 0;

  // Calculate segment offsets
  let cumulativeOffset = 0;
  const renderedSegments = segments.map((seg) => {
    const arcLength = (seg.percentage / 100) * circumference;
    const dashLength = Math.max(0, arcLength - gap);
    const dashOffset = -cumulativeOffset;
    cumulativeOffset += arcLength;

    return {
      ...seg,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
      {/* SVG Donut */}
      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 140 140"
          className="w-full h-full transform -rotate-90 select-none"
        >
          {/* Background / Empty Ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-neutral-200 dark:text-neutral-800"
          />

          {/* Render Active Segments */}
          {!isEmpty &&
            renderedSegments.map((seg) => {
              const isHighlight = highlightedId === seg.id;
              const hasAnyHighlight = highlightedId !== null;
              const opacity = hasAnyHighlight ? (isHighlight ? 1 : 0.35) : 1;
              const currentStrokeWidth = isHighlight ? strokeWidth + 3 : strokeWidth;

              return (
                <circle
                  key={seg.id}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={currentStrokeWidth}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  strokeLinecap="round"
                  style={{
                    opacity,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHighlightedId(seg.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                  onClick={() =>
                    setHighlightedId((prev) => (prev === seg.id ? null : seg.id))
                  }
                />
              );
            })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {isEmpty ? (
            <span className="text-[11px] text-neutral-400 font-medium leading-tight">
              ยังไม่มีข้อมูล
            </span>
          ) : (
            <>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                {centerSubtitle}
              </span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                {isMasked ? '••••' : formatSatang(totalSatang)}
              </span>
              <span className="text-[9px] text-neutral-400">บาท</span>
            </>
          )}
        </div>
      </div>

      {/* Legend on the right */}
      <div className="flex-1 w-full space-y-1.5 min-w-0">
        {isEmpty ? (
          <div className="text-xs text-neutral-400 text-center sm:text-left py-2">
            บันทึกรายการเพื่อดูสัดส่วน
          </div>
        ) : (
          segments.map((seg) => {
            const isHighlight = highlightedId === seg.id;
            return (
              <div
                key={seg.id}
                onClick={() =>
                  setHighlightedId((prev) => (prev === seg.id ? null : seg.id))
                }
                className={`flex items-center justify-between text-xs py-1 px-2 rounded-xl cursor-pointer transition-all ${
                  isHighlight
                    ? 'bg-neutral-100 dark:bg-neutral-800/80 font-medium'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="truncate text-[12px]">{seg.label}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 tabular-nums">
                  <span className="text-neutral-400 text-[11px]">
                    {isMasked ? '••••' : `${formatSatang(seg.valueSatang)} ฿`}
                  </span>
                  <span
                    className={`text-[12px] font-semibold w-12 text-right ${
                      isHighlight
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {seg.percentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
