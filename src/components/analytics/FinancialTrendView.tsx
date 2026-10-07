import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Transaction } from '../../types/transaction';
import { Pocket } from '../../types/pocket';
import { formatSatang } from '../../lib/money';
import { formatThaiFullDate } from '../../lib/calendar';
import { calculateMonthTrend, getSmoothBezierPath, DayTrendPoint } from '../../lib/trend';
import {
  TrendingDown,
  Activity,
  Award,
  Calendar,
  ChevronRight,
  Scale,
  Sparkles,
} from 'lucide-react';

interface FinancialTrendViewProps {
  transactions: Transaction[];
  yearMonth: string; // YYYY-MM
  isMasked?: boolean;
  pockets?: Pocket[];
  onSelectTx?: (tx: Transaction) => void;
}

/**
 * Format numeric value for Y-Axis labels (compact & legible for mobile charts)
 */
function formatYAxisLabel(satang: number, isMasked: boolean = false): string {
  if (isMasked) return '•••';
  const baht = Math.round(satang / 100);
  const abs = Math.abs(baht);
  if (abs === 0) return '0';
  if (abs >= 1_000_000) {
    const formatted = (baht / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (abs >= 100_000) {
    const formatted = (baht / 1_000).toFixed(0);
    return `${formatted}k`;
  }
  if (abs >= 10_000) {
    const formatted = (baht / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
  }
  return baht.toLocaleString('en-US');
}

/**
 * Calculates a nice ceiling value for Y-Axis so peak points don't touch the top edge
 * and grid intervals divide evenly into clean, readable numbers.
 */
function getNiceYAxisMax(highestSatang: number): number {
  if (highestSatang <= 10000) return 10000; // Minimum scale: 100 Baht

  const highestBaht = highestSatang / 100;
  // Target ceiling with at least 15% headroom so line has breathing room
  const minTargetBaht = highestBaht * 1.15;

  // Nice step candidates per order of magnitude for 4 intervals (gridlines)
  const exponent = Math.floor(Math.log10(minTargetBaht / 4));
  const magnitude = Math.pow(10, Math.max(0, exponent));

  const niceSteps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  let chosenStep = 10 * magnitude;

  for (const stepMultiplier of niceSteps) {
    const candidateStep = stepMultiplier * magnitude;
    const candidateMax = candidateStep * 4;
    if (candidateMax >= minTargetBaht) {
      chosenStep = candidateStep;
      break;
    }
  }

  const niceMaxBaht = chosenStep * 4;
  return Math.round(niceMaxBaht * 100);
}

export const FinancialTrendView: React.FC<FinancialTrendViewProps> = ({
  transactions,
  yearMonth,
  isMasked = false,
  pockets = [],
  onSelectTx,
}) => {
  // Chart Display Mode: 'dual' (Income vs Expense) | 'net' (Net Cumulative Balance)
  const [chartMode, setChartMode] = useState<'dual' | 'net'>('dual');
  // Calculation Mode: 'cumulative' (Running Total) | 'daily' (Daily Spikes)
  const [calcMode, setCalcMode] = useState<'cumulative' | 'daily'>('cumulative');

  // Interactive scrubber state (day index hovered/touched)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Expanded day in the breakdown list below
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Today string for calculations
  const todayStr = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Pocket map for name lookup
  const pocketMap = useMemo(() => {
    const map = new Map<string, string>();
    pockets.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [pockets]);

  // Compute trend data
  const trend = useMemo(() => {
    return calculateMonthTrend(transactions, yearMonth, todayStr);
  }, [transactions, yearMonth, todayStr]);

  // SVG Chart Dimensions (Expanded padLeft to 42px for clean Y-axis scale numbers)
  const svgWidth = 350;
  const svgHeight = 175;
  const padLeft = 42;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 26;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Maximum value for scaling (with nice headroom buffer so peaks don't hug the top border)
  const { maxVal, pointsCoords } = useMemo(() => {
    const pts = trend.points;
    if (pts.length === 0) return { maxVal: 10000, pointsCoords: [] };

    let highest = 0;

    if (chartMode === 'dual') {
      if (calcMode === 'cumulative') {
        pts.forEach((p) => {
          highest = Math.max(highest, p.cumulativeIncome, p.cumulativeExpense);
        });
      } else {
        pts.forEach((p) => {
          highest = Math.max(highest, p.income, p.expense);
        });
      }
    } else {
      // Net mode
      pts.forEach((p) => {
        highest = Math.max(highest, Math.abs(calcMode === 'cumulative' ? p.cumulativeNet : p.net));
      });
    }

    if (highest <= 0) highest = 10000; // Fallback scale: 100 Baht

    // Add headroom and round to nice intervals for 4-segment grid
    const scaleMax = getNiceYAxisMax(highest);

    // Map each day to (x, y) coordinates
    const stepX = chartW / Math.max(1, pts.length - 1);

    const coords = pts.map((p, idx) => {
      const x = padLeft + idx * stepX;
      let yIn = padTop + chartH;
      let yOut = padTop + chartH;
      let yNet = padTop + chartH / 2;

      if (chartMode === 'dual') {
        const valIn = calcMode === 'cumulative' ? p.cumulativeIncome : p.income;
        const valOut = calcMode === 'cumulative' ? p.cumulativeExpense : p.expense;
        yIn = padTop + chartH - (valIn / scaleMax) * chartH;
        yOut = padTop + chartH - (valOut / scaleMax) * chartH;
      } else {
        const valNet = calcMode === 'cumulative' ? p.cumulativeNet : p.net;
        // Midpoint is 0 net
        yNet = padTop + chartH / 2 - (valNet / scaleMax) * (chartH / 2);
      }

      return {
        x,
        yIn,
        yOut,
        yNet,
        point: p,
      };
    });

    return { maxVal: scaleMax, pointsCoords: coords };
  }, [trend.points, chartMode, calcMode, chartW, chartH, padLeft, padTop]);

  // Generate SVG curve paths
  const { incomeLinePath, incomeAreaPath, expenseLinePath, expenseAreaPath, netLinePath, netAreaPath } = useMemo(() => {
    if (pointsCoords.length === 0) {
      return {
        incomeLinePath: '',
        incomeAreaPath: '',
        expenseLinePath: '',
        expenseAreaPath: '',
        netLinePath: '',
        netAreaPath: '',
      };
    }

    const baselineY = padTop + chartH;

    // Income
    const inPts = pointsCoords.map((c) => ({ x: c.x, y: c.yIn }));
    const inLine = getSmoothBezierPath(inPts);
    const inArea = `${inLine} L ${inPts[inPts.length - 1].x} ${baselineY} L ${inPts[0].x} ${baselineY} Z`;

    // Expense
    const outPts = pointsCoords.map((c) => ({ x: c.x, y: c.yOut }));
    const outLine = getSmoothBezierPath(outPts);
    const outArea = `${outLine} L ${outPts[outPts.length - 1].x} ${baselineY} L ${outPts[0].x} ${baselineY} Z`;

    // Net
    const netPts = pointsCoords.map((c) => ({ x: c.x, y: c.yNet }));
    const netLine = getSmoothBezierPath(netPts);
    const netBaselineY = padTop + chartH / 2;
    const netArea = `${netLine} L ${netPts[netPts.length - 1].x} ${netBaselineY} L ${netPts[0].x} ${netBaselineY} Z`;

    return {
      incomeLinePath: inLine,
      incomeAreaPath: inArea,
      expenseLinePath: outLine,
      expenseAreaPath: outArea,
      netLinePath: netLine,
      netAreaPath: netArea,
    };
  }, [pointsCoords, padTop, chartH]);

  // Touch & Mouse Scrubber handlers for interactive timeline
  const handleTouchScrubber = useCallback(
    (clientX: number) => {
      if (!svgRef.current || pointsCoords.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeChartX = (relativeX / rect.width) * svgWidth - padLeft;
      const pct = Math.max(0, Math.min(1, relativeChartX / chartW));
      const targetIdx = Math.round(pct * (pointsCoords.length - 1));
      setHoveredIndex(targetIdx);
    },
    [pointsCoords, chartW, padLeft, svgWidth]
  );

  const activeHoveredCoord = hoveredIndex !== null && pointsCoords[hoveredIndex] ? pointsCoords[hoveredIndex] : null;
  const activeDayPoint: DayTrendPoint | null = activeHoveredCoord ? activeHoveredCoord.point : null;

  // Active day transactions lookup
  const activeDayTransactions = useMemo(() => {
    if (!expandedDate) return [];
    return transactions.filter(
      (tx) => tx.date === expandedDate && (tx.type === 'in' || tx.type === 'out' || tx.type === 'lend' || tx.type === 'back')
    );
  }, [transactions, expandedDate]);

  // Days with actual activity for the table below
  const activeDaysList = useMemo(() => {
    return trend.points.filter((p) => p.hasActivity).reverse();
  }, [trend.points]);

  return (
    <div className="space-y-4">
      {/* 1. Main Interactive Trend Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Top Header: Mode Toggles & Scrubber Inspection Info */}
        <div className="space-y-3">
          {/* Dual vs Net Curve Mode Toggle */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="relative flex items-center p-0.5 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border border-border-light dark:border-border-dark text-xs">
              <button
                type="button"
                onClick={() => setChartMode('dual')}
                className={`py-1 px-2.5 rounded-lg font-medium transition-colors select-none ${
                  chartMode === 'dual'
                    ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                รายรับ-รายจ่าย
              </button>
              <button
                type="button"
                onClick={() => setChartMode('net')}
                className={`py-1 px-2.5 rounded-lg font-medium transition-colors select-none ${
                  chartMode === 'net'
                    ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                สุทธิสะสม
              </button>
            </div>

            {/* Cumulative vs Daily Toggle */}
            <div className="relative flex items-center p-0.5 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border border-border-light dark:border-border-dark text-xs">
              <button
                type="button"
                onClick={() => setCalcMode('cumulative')}
                className={`py-1 px-2 rounded-lg font-medium transition-colors select-none text-[11px] ${
                  calcMode === 'cumulative'
                    ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                ยอดสะสม
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('daily')}
                className={`py-1 px-2 rounded-lg font-medium transition-colors select-none text-[11px] ${
                  calcMode === 'daily'
                    ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                รายวัน
              </button>
            </div>
          </div>

          {/* Dynamic Inspection Header (Updates in real-time when dragging finger on chart) */}
          <div className="p-3 rounded-2xl bg-surfaceElevated-light/70 dark:bg-surfaceElevated-dark/70 border border-border-light/60 dark:border-border-dark/60 transition-all">
            {activeDayPoint ? (
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block">วันที่ตรวจสอบ</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                    {formatThaiFullDate(activeDayPoint.dateStr)}
                  </span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">
                      {calcMode === 'cumulative' ? 'รับสะสม' : 'รายรับ'}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {isMasked
                        ? '••••'
                        : `+${formatSatang(calcMode === 'cumulative' ? activeDayPoint.cumulativeIncome : activeDayPoint.income)} ฿`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">
                      {calcMode === 'cumulative' ? 'จ่ายสะสม' : 'รายจ่าย'}
                    </span>
                    <span className="font-semibold text-red-600 dark:text-red-400 tabular-nums">
                      {isMasked
                        ? '••••'
                        : `-${formatSatang(calcMode === 'cumulative' ? activeDayPoint.cumulativeExpense : activeDayPoint.expense)} ฿`}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block">ภาพรวมทั้งเดือน</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    สุทธิ: {isMasked ? '••••' : `${trend.netTotal >= 0 ? '+' : ''}${formatSatang(trend.netTotal)} ฿`}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">เข้า</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {isMasked ? '••••' : `+${formatSatang(trend.totalIncome)} ฿`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">ออก</span>
                    <span className="font-semibold text-red-600 dark:text-red-400 tabular-nums">
                      {isMasked ? '••••' : `-${formatSatang(trend.totalExpense)} ฿`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Interactive SVG Smooth Curved Chart (Optimized for Mobile Touch) */}
        <div className="relative select-none touch-none">
          {/* Subtle Instruction Prompt */}
          <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1 px-1">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-emerald-500" />
              <span>แตะหรือลากนิ้วบนกราฟเพื่อดูรายวัน</span>
            </span>
            <span className="font-medium text-neutral-400 dark:text-neutral-500">หน่วย: บาท (฿)</span>
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto cursor-crosshair overflow-visible"
            onMouseMove={(e) => handleTouchScrubber(e.clientX)}
            onMouseLeave={() => setHoveredIndex(null)}
            onTouchMove={(e) => {
              if (e.touches[0]) handleTouchScrubber(e.touches[0].clientX);
            }}
            onTouchEnd={() => setHoveredIndex(null)}
          >
            <defs>
              {/* Income Emerald Gradient */}
              <linearGradient id="incomeTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>

              {/* Expense Rose/Red Gradient */}
              <linearGradient id="expenseTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
              </linearGradient>

              {/* Net Balance Violet/Cyan Gradient */}
              <linearGradient id="netTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* 1. Vertical Gridlines (Aligned with date milestones across the month) */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const idx = Math.min(trend.points.length - 1, Math.round(pct * (trend.points.length - 1)));
              const x = padLeft + idx * (chartW / Math.max(1, trend.points.length - 1));
              const isAxisSpine = pct === 0;

              return (
                <line
                  key={`v-grid-${pct}`}
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartH}
                  stroke="currentColor"
                  strokeDasharray={isAxisSpine ? 'none' : '2 3'}
                  strokeOpacity={isAxisSpine ? 0.75 : 0.45}
                  className={
                    isAxisSpine
                      ? 'text-neutral-400 dark:text-neutral-500'
                      : 'text-neutral-300 dark:text-neutral-700'
                  }
                  strokeWidth="1"
                />
              );
            })}

            {/* 2. Horizontal Gridlines & Y-Axis Numeric Scale Labels (25% landmark intervals) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padTop + chartH * ratio;

              let labelText = '';
              if (chartMode === 'dual') {
                const valSatang = Math.round(maxVal * (1 - ratio));
                labelText = formatYAxisLabel(valSatang, isMasked);
              } else {
                const valSatang = Math.round(maxVal * (1 - ratio * 2));
                const formatted = formatYAxisLabel(Math.abs(valSatang), isMasked);
                if (valSatang > 0) {
                  labelText = `+${formatted}`;
                } else if (valSatang < 0) {
                  labelText = `-${formatted}`;
                } else {
                  labelText = '0';
                }
              }

              const isZeroLine = chartMode === 'net' ? ratio === 0.5 : ratio === 1;

              return (
                <g key={`h-grid-${ratio}`} className="select-none pointer-events-none">
                  {/* Y-Axis Value Label */}
                  <text
                    x={padLeft - 6}
                    y={y}
                    dominantBaseline="central"
                    textAnchor="end"
                    className={`text-[9px] tabular-nums font-medium ${
                      isZeroLine
                        ? 'fill-neutral-600 dark:fill-neutral-300 font-semibold'
                        : 'fill-neutral-400 dark:fill-neutral-500'
                    }`}
                  >
                    {labelText}
                  </text>

                  {/* Horizontal Grid Line */}
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray={isZeroLine ? 'none' : '3 3'}
                    strokeOpacity={isZeroLine ? 0.8 : 0.5}
                    className={
                      isZeroLine
                        ? 'text-neutral-400 dark:text-neutral-500'
                        : 'text-neutral-300 dark:text-neutral-700'
                    }
                    strokeWidth={isZeroLine ? '1.25' : '1'}
                  />
                </g>
              );
            })}

            {chartMode === 'dual' ? (
              <>
                {/* Income Curved Area & Line */}
                <path d={incomeAreaPath} fill="url(#incomeTrendGrad)" />
                <path
                  d={incomeLinePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />

                {/* Expense Curved Area & Line */}
                <path d={expenseAreaPath} fill="url(#expenseTrendGrad)" />
                <path
                  d={expenseLinePath}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </>
            ) : (
              <>
                {/* Net Balance Curve */}
                <path d={netAreaPath} fill="url(#netTrendGrad)" />
                <path
                  d={netLinePath}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </>
            )}

            {/* Interactive Touch Scrubber Line & Tracking Dots */}
            {activeHoveredCoord && (
              <g className="pointer-events-none transition-all">
                {/* Vertical Hairline */}
                <line
                  x1={activeHoveredCoord.x}
                  y1={padTop - 4}
                  x2={activeHoveredCoord.x}
                  y2={padTop + chartH + 4}
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  className="text-neutral-400 dark:text-neutral-500"
                  strokeWidth="1.5"
                />

                {chartMode === 'dual' ? (
                  <>
                    {/* Income Point */}
                    <circle
                      cx={activeHoveredCoord.x}
                      cy={activeHoveredCoord.yIn}
                      r="4.5"
                      fill="#10B981"
                      stroke="white"
                      strokeWidth="2"
                    />
                    {/* Expense Point */}
                    <circle
                      cx={activeHoveredCoord.x}
                      cy={activeHoveredCoord.yOut}
                      r="4.5"
                      fill="#EF4444"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </>
                ) : (
                  <circle
                    cx={activeHoveredCoord.x}
                    cy={activeHoveredCoord.yNet}
                    r="5"
                    fill="#8B5CF6"
                    stroke="white"
                    strokeWidth="2"
                  />
                )}
              </g>
            )}

            {/* X-Axis Date Milestone Labels (5 clean intervals, zero mobile overlap) */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const idx = Math.min(trend.points.length - 1, Math.round(pct * (trend.points.length - 1)));
              const point = trend.points[idx];
              if (!point) return null;
              const x = padLeft + idx * (chartW / Math.max(1, trend.points.length - 1));
              return (
                <text
                  key={point.dayNumber}
                  x={x}
                  y={padTop + chartH + 16}
                  textAnchor="middle"
                  className="text-[9.5px] fill-neutral-400 font-medium select-none"
                >
                  {point.dayLabel}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-1 text-xs">
          {chartMode === 'dual' ? (
            <>
              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                <span className="w-3 h-1 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium">เงินเข้า (Income)</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                <span className="w-3 h-1 rounded-full bg-red-500" />
                <span className="text-[11px] font-medium">จ่ายออก (Expense)</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
              <span className="w-3 h-1 rounded-full bg-purple-500" />
              <span className="text-[11px] font-medium">คงเหลือสะสม (Net Worth)</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Four Smart Financial Insights Cards (Mobile-friendly Grid) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Peak Expense Day */}
        <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-1">
          <div className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Award size={13} className="text-amber-500" />
            <span>วันจ่ายสูงสุด</span>
          </div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {trend.peakExpenseDay ? `${trend.peakExpenseDay.dayNumber} ${yearMonth.slice(5)}` : '-'}
          </div>
          <div className="text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums">
            {trend.peakExpenseDay
              ? isMasked
                ? '••••'
                : `-${formatSatang(trend.peakExpenseDay.amount)} ฿`
              : '0 ฿'}
          </div>
        </div>

        {/* Daily Average Expense */}
        <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-1">
          <div className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Activity size={13} className="text-sky-500" />
            <span>เฉลี่ยจ่ายต่อวัน</span>
          </div>
          <div className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
            {isMasked ? '••••' : `~${formatSatang(trend.dailyAvgExpense)} ฿`}
          </div>
          <div className="text-[10px] text-neutral-400">คำนวณตามจำนวนวันในเดือน</div>
        </div>

        {/* Savings Rate */}
        <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-1">
          <div className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Scale size={13} className="text-emerald-500" />
            <span>อัตราการออม</span>
          </div>
          <div
            className={`text-sm font-semibold tabular-nums ${
              trend.savingsRate >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isMasked ? '•••' : `${trend.savingsRate >= 0 ? '+' : ''}${trend.savingsRate}%`}
          </div>
          <div className="text-[10px] text-neutral-400">สัดส่วนเงินเก็บเทียบรายรับ</div>
        </div>

        {/* Previous Month Expense Comparison */}
        <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-1">
          <div className="flex items-center gap-1 text-[11px] text-neutral-500">
            <TrendingDown size={13} className="text-purple-500" />
            <span>เทียบเดือนก่อน</span>
          </div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {trend.prevMonthExpenseChangePct !== null ? (
              <span
                className={
                  trend.prevMonthExpenseChangePct <= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }
              >
                {trend.prevMonthExpenseChangePct <= 0 ? 'ประหยัด ' : 'เพิ่มขึ้น '}
                {Math.abs(trend.prevMonthExpenseChangePct)}%
              </span>
            ) : (
              <span className="text-neutral-400 text-xs">ยังไม่มีข้อมูลก่อนหน้า</span>
            )}
          </div>
          <div className="text-[10px] text-neutral-400">เทียบยอดจ่ายสุทธิ</div>
        </div>
      </div>

      {/* 3. Daily Breakdown Table (Matching User's Reference Screenshots) */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border-light/60 dark:border-border-dark/60">
          <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            บันทึกการเคลื่อนไหวรายวัน ({activeDaysList.length} วันที่มีรายการ)
          </h4>
          <span className="text-[11px] text-neutral-400">แตะเพื่อดูรายการย่อย</span>
        </div>

        {activeDaysList.length === 0 ? (
          <div className="py-6 text-center text-neutral-400 text-xs">
            <p>ยังไม่มีรายการเคลื่อนไหวในเดือนนี้</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light/40 dark:divide-border-dark/40">
            {activeDaysList.map((day) => {
              const isExpanded = expandedDate === day.dateStr;
              return (
                <div key={day.dateStr} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => setExpandedDate(isExpanded ? null : day.dateStr)}
                    className="w-full py-2.5 px-1 flex items-center justify-between text-xs hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 rounded-xl cursor-pointer"
                  >
                    {/* Left: Date */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                        <Calendar size={13} />
                      </div>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {formatThaiFullDate(day.dateStr)}
                      </span>
                    </div>

                    {/* Right: Income / Expense / Net */}
                    <div className="flex items-center gap-3 text-right">
                      {day.income > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                          {isMasked ? '•••' : `+${formatSatang(day.income)}`}
                        </span>
                      )}
                      {day.expense > 0 && (
                        <span className="text-red-600 dark:text-red-400 font-medium tabular-nums">
                          {isMasked ? '•••' : `-${formatSatang(day.expense)}`}
                        </span>
                      )}
                      <ChevronRight
                        size={14}
                        className={`text-neutral-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-neutral-800 dark:text-white' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Transactions on this Day */}
                  {isExpanded && (
                    <div className="pl-9 pr-1 pb-2 space-y-1 animate-fade-in">
                      {activeDayTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          onClick={() => onSelectTx?.(tx)}
                          className="flex items-center justify-between p-2 rounded-xl text-xs bg-surfaceElevated-light dark:bg-surfaceElevated-dark hover:border-neutral-400 cursor-pointer"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {tx.note || tx.category || tx.who}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {tx.who}
                              {tx.pocketId && pocketMap.has(tx.pocketId) ? ` • ${pocketMap.get(tx.pocketId)}` : ''}
                            </div>
                          </div>
                          <div
                            className={`font-semibold tabular-nums shrink-0 ${
                              tx.type === 'in' || tx.type === 'back'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {isMasked
                              ? '••••'
                              : `${tx.type === 'in' || tx.type === 'back' ? '+' : '-'}${formatSatang(tx.amount)} ฿`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
