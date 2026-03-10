"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { PieChartIcon, Network } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProjectData {
  name: string; value: number; fill: string;
  received: number; remaining: number;
  percentReceived: number; billCount: number; clientName: string;
}
interface ClientData {
  name: string; value: number; fill: string;
  received: number; remaining: number;
  projectCount: number; children: ProjectData[];
}
interface ProjectDistributionChartProps {
  data: ClientData[]; loading?: boolean; isExpanded?: boolean;
}

const COLOR_PALETTE = [
  { hue: 210 }, { hue: 160 }, { hue: 280 }, { hue: 30  },
  { hue: 340 }, { hue: 120 }, { hue: 50  }, { hue: 0   },
  { hue: 190 }, { hue: 260 },
];

// Smooth ease-in-out curve
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export function ProjectDistributionChart({ data, loading, isExpanded }: ProjectDistributionChartProps) {
  const [isSunburst,      setIsSunburst]      = useState(false);
  const [isAnimating,     setIsAnimating]      = useState(false);
  const [showOuter,       setShowOuter]        = useState(false);
  const [hovering,        setHovering]         = useState(false);
  const [activeClientIdx, setActiveClientIdx]  = useState<number | undefined>(undefined);
  const [activeProjectIdx,setActiveProjectIdx] = useState<number | undefined>(undefined);
  const [tooltipData,     setTooltipData]      = useState<any>(null);
  const [tooltipPinned,   setTooltipPinned]    = useState(false);
  const [tooltipPos,      setTooltipPos]       = useState<{ x: number; y: number } | null>(null);

  // Animated radius values driven by rAF
  const [innerR, setInnerR] = useState(0);
  const [outerR, setOuterR] = useState(0);
  const animRef     = useRef<number | null>(null);
  const initialized = useRef(false);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  // Controls outer ring animation — only true for the brief window after it appears
  const [outerAnimActive, setOuterAnimActive] = useState(false);
  const outerAnimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Radius config (responsive) ───────────────────────────────────────────
  const PIE_OUT = isExpanded ? 158 : 132;
  const SB_CI   = isExpanded ? 70  : 52;
  const SB_CO   = isExpanded ? 125 : 92;
  const SB_PI   = isExpanded ? 130 : 97;
  const SB_PO   = isExpanded ? 190 : 143;
  const MARGINS = isExpanded
    ? { top: 55, right: 70, bottom: 88, left: 70 }
    : { top: 42, right: 52, bottom: 80, left: 52 };

  // Set initial radii after first render
  useEffect(() => {
    if (!initialized.current) {
      setOuterR(PIE_OUT);
      setInnerR(0);
      initialized.current = true;
    }
  }, []);

  // Recalculate instantly when expanded/collapsed (no animation)
  useEffect(() => {
    if (!initialized.current) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (isSunburst) { setInnerR(SB_CI); setOuterR(SB_CO); }
    else             { setInnerR(0);     setOuterR(PIE_OUT); }
  }, [isExpanded]); // eslint-disable-line

  useEffect(() => () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (outerAnimTimer.current) clearTimeout(outerAnimTimer.current);
  }, []);

  // Fire outer ring animation ONLY when it first appears; kill flag after duration
  useEffect(() => {
    if (showOuter) {
      setOuterAnimActive(true);
      outerAnimTimer.current = setTimeout(() => setOuterAnimActive(false), 520);
    } else {
      if (outerAnimTimer.current) clearTimeout(outerAnimTimer.current);
      setOuterAnimActive(false);
    }
  }, [showOuter]);

  // ── Morph: pie → sunburst ─────────────────────────────────────────────────
  const switchToSunburst = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsSunburst(true);
    const startInner = innerR, startOuter = outerR;
    const t0 = performance.now();
    const DURATION = 540;

    const frame = (now: number) => {
      const t = easeInOut(Math.min((now - t0) / DURATION, 1));
      setInnerR(startInner + (SB_CI - startInner) * t);
      setOuterR(startOuter + (SB_CO - startOuter) * t);
      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        setInnerR(SB_CI); setOuterR(SB_CO);
        setShowOuter(true);
        setIsAnimating(false);
      }
    };
    animRef.current = requestAnimationFrame(frame);
  };

  // ── Morph: sunburst → pie ─────────────────────────────────────────────────
  const switchToPie = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowOuter(false);
    setTooltipData(null); setTooltipPinned(false); setTooltipPos(null);

    // Wait for outer ring exit animation (250 ms), then morph inner ring
    setTimeout(() => {
      const startInner = SB_CI, startOuter = SB_CO;
      const t0 = performance.now();
      const DURATION = 540;

      const frame = (now: number) => {
        const t = easeInOut(Math.min((now - t0) / DURATION, 1));
        setInnerR(startInner * (1 - t));
        setOuterR(startOuter + (PIE_OUT - startOuter) * t);
        if (t < 1) {
          animRef.current = requestAnimationFrame(frame);
        } else {
          setInnerR(0); setOuterR(PIE_OUT);
          setIsSunburst(false);
          setIsAnimating(false);
        }
      };
      animRef.current = requestAnimationFrame(frame);
    }, 250);
  };

  // ── Color processing ──────────────────────────────────────────────────────
  const clientsWithColors = data.map((client, idx) => {
    const { hue } = COLOR_PALETTE[idx % COLOR_PALETTE.length];
    return {
      ...client,
      fill: `hsl(${hue}, 70%, 45%)`,
      hue,
      children: client.children.map((project, pIdx) => {
        const step = client.children.length > 1 ? 20 / (client.children.length - 1) : 0;
        return { ...project, fill: `hsl(${hue}, 60%, ${Math.min(55 + pIdx * step, 75)}%)` };
      }),
    };
  });

  const projectsData = clientsWithColors.flatMap(c =>
    c.children.map(p => ({ ...p, clientName: c.name }))
  );

  const totalValue = clientsWithColors.reduce((s, c) => s + c.value, 0);
  const fmt = (v: number) =>
    `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(v))}`;


  // ── Active shape: segment lifts outward + brightens (no tooltip rect) ─────
  const makeActiveShape = (liftPx = 8, growPx = 7) => (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    const mid = ((startAngle + endAngle) / 2) * (Math.PI / 180);
    return (
      <Sector
        cx={cx + liftPx * Math.cos(-mid)}
        cy={cy + liftPx * Math.sin(-mid)}
        innerRadius={innerRadius}
        outerRadius={outerRadius + growPx}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'brightness(1.22) drop-shadow(0 2px 10px rgba(0,0,0,0.28))' }}
      />
    );
  };
  const clientActiveShape  = makeActiveShape(8, 7);
  const projectActiveShape = makeActiveShape(5, 5);

  // ── Pie labels (always visible, hidden while animating) ───────────────────
  const renderPieLabel = ({ cx, cy, midAngle, outerRadius, name, percent, fill }: any) => {
    if (isAnimating || isSunburst || percent < 0.03) return null;
    const RAD = Math.PI / 180;
    const r   = outerRadius + (isExpanded ? 52 : 38);
    const x   = cx + r * Math.cos(-midAngle * RAD);
    const y   = cy + r * Math.sin(-midAngle * RAD);
    const lx  = cx + (outerRadius + 6) * Math.cos(-midAngle * RAD);
    const ly  = cy + (outerRadius + 6) * Math.sin(-midAngle * RAD);
    const pct = (percent * 100).toFixed(1);
    const lbl = `${name}  ${pct}%`;
    const w   = lbl.length * 6.1, pad = 6;
    return (
      <g>
        <line x1={lx} y1={ly} x2={x} y2={y} stroke={fill} strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="3 2" />
        <rect x={x - w / 2 - pad} y={y - 10} width={w + pad * 2} height={20}
              fill="white" stroke={fill} strokeWidth={1.2} rx={5} opacity={0.96} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={10}>
          <tspan fill="hsl(var(--foreground))" fontWeight={600}>{name}  </tspan>
          <tspan fill={fill} fontWeight={700}>{pct}%</tspan>
        </text>
      </g>
    );
  };

  // ── Sunburst outer-ring label (only when outer ring fully visible) ─────────
  const renderSunburstLabel = ({ cx, cy, midAngle, outerRadius, name, percent }: any) => {
    if (!showOuter || percent < 0.05) return null;
    const RAD   = Math.PI / 180;
    const r     = outerRadius + (isExpanded ? 48 : 34);
    const x     = cx + r * Math.cos(-midAngle * RAD);
    const y     = cy + r * Math.sin(-midAngle * RAD);
    const short = name.length > 14 ? name.slice(0, 13) + '…' : name;
    const w     = short.length * 5.9, pad = 5;
    return (
      <g>
        <rect x={x - w / 2 - pad} y={y - 9} width={w + pad * 2} height={18}
              fill="white" stroke="hsl(var(--border))" strokeWidth={1} rx={4} opacity={0.94} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fill="hsl(var(--foreground))" fontSize={9.5} fontWeight={600}>{short}</text>
      </g>
    );
  };

  // ── Hover info overlay in sunburst donut center ───────────────────────────
  const CenterInfo = () => {
    if (!isSunburst || isAnimating) return null;
    const ci = activeClientIdx;
    const pi = activeProjectIdx;
    const d  = pi !== undefined ? projectsData[pi]
             : ci !== undefined ? clientsWithColors[ci]
             : null;
    if (!d) return null;
    const pct  = totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : '0';
    const isP  = 'billCount' in d;
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center max-w-[90px]">
          <p className="text-[10px] font-bold text-foreground leading-tight truncate">{d.name}</p>
          <p className="text-[11px] font-black" style={{ color: d.fill }}>{pct}%</p>
          <p className="text-[9px] text-muted-foreground">{fmt(d.value)}</p>
          {isP && <p className="text-[9px] text-muted-foreground">{(d as any).billCount} bills</p>}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'glass-card rounded-xl p-6 flex flex-col',
        isExpanded ? 'h-full w-full' : 'h-[490px]'
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <PieChartIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          {isSunburst ? 'Project Breakdown' : 'Client Distribution'}
        </h3>
        <div className="ml-auto hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
          {isSunburst ? (
            <>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-500" /> Clients</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-300 border border-slate-400" /> Projects</span>
            </>
          ) : (
            <span className="italic text-[11px]">% of total bill amount</span>
          )}
        </div>
      </div>

      {/* ── Toggle button — always reserves height, fades on hover ── */}
      <motion.div
        animate={{ opacity: hovering ? 1 : 0 }}
        transition={{ duration: 0.18 }}
        className="mt-2 mb-1 flex-shrink-0 h-7 flex items-center"
      >
        <button
          onClick={isSunburst ? switchToPie : switchToSunburst}
          disabled={isAnimating}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium select-none',
            'bg-muted/60 backdrop-blur-sm border border-border/50',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            'transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          {isSunburst
            ? <><PieChartIcon className="w-3 h-3" /> Back to Client Pie</>
            : <><Network className="w-3 h-3" /> View Project Breakdown</>
          }
        </button>
      </motion.div>

      {/* ── Body ── */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Skeleton className="h-64 w-64 rounded-full" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      ) : (
        <div className={cn('flex gap-6 flex-1 min-h-0 mt-1', isExpanded ? '' : 'justify-center')}>

          {/* ── Chart area ── */}
          <div ref={chartAreaRef} className={cn('min-h-0 relative', isExpanded ? 'w-[65%]' : 'w-full')}>

            {/* Center info overlay (sunburst hover) */}
            <CenterInfo />

            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={MARGINS}>

                {/* ── Main ring (morphs from full pie → inner donut ring) ── */}
                <Pie
                  data={clientsWithColors}
                  dataKey="value"
                  cx="50%" cy="50%"
                  innerRadius={innerR}
                  outerRadius={outerR}
                  paddingAngle={2}
                  isAnimationActive={false}
                  activeIndex={activeClientIdx}
                  activeShape={clientActiveShape}
                  onMouseEnter={(d: any, idx: number) => {
                    setActiveClientIdx(idx);
                    if (!tooltipPinned && !isSunburst) setTooltipData({ ...d, _type: 'client' });
                  }}
                  onMouseLeave={() => {
                    setActiveClientIdx(undefined);
                    if (!tooltipPinned && !isSunburst) setTooltipData(null);
                  }}
                  onClick={(d: any, _idx: number, e: React.MouseEvent) => {
                    if (!chartAreaRef.current) return;
                    const rect = chartAreaRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setTooltipData({ ...d, _type: 'client' });
                    setTooltipPos(isSunburst ? { x, y } : null);
                    setTooltipPinned(true);
                  }}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {clientsWithColors.map((c, i) => (
                    <Cell key={`c-${i}`} fill={c.fill} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>

                {/* ── Outer projects ring (sunburst only, animated in by recharts) ── */}
                {showOuter && (
                  <Pie
                    data={projectsData}
                    dataKey="value"
                    cx="50%" cy="50%"
                    innerRadius={SB_PI}
                    outerRadius={SB_PO}
                    paddingAngle={1}
                    isAnimationActive={outerAnimActive}
                    animationBegin={0}
                    animationDuration={480}
                    activeIndex={activeProjectIdx}
                    activeShape={projectActiveShape}
                    onMouseEnter={(_: any, idx: number) => {
                      setActiveProjectIdx(idx);
                    }}
                    onMouseLeave={() => {
                      setActiveProjectIdx(undefined);
                    }}
                    onClick={(d: any, _idx: number, e: React.MouseEvent) => {
                      if (!chartAreaRef.current) return;
                      const rect = chartAreaRef.current.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      setTooltipData({ ...d, _type: 'project' });
                      setTooltipPos({ x, y });
                      setTooltipPinned(true);
                    }}
                    style={{ cursor: 'pointer' }}
                    label={renderSunburstLabel}
                    labelLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }}
                  >
                    {projectsData.map((p, i) => (
                      <Cell key={`p-${i}`} fill={p.fill} stroke="hsl(var(--background))" strokeWidth={1} />
                    ))}
                  </Pie>
                )}

              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* ── Expanded legend (sunburst mode) ── */}
          {isExpanded && isSunburst && !isAnimating && (
            <div className="w-[35%] flex flex-col min-h-0 border-l border-border/50 pl-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex-shrink-0">Distribution by Client</h4>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {clientsWithColors.map((client, ci) => (
                  <div key={ci} className="space-y-1">
                    <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded-md border border-border/50">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: client.fill }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{client.name}</p>
                        <p className="text-[10px] text-muted-foreground">{client.projectCount} project{client.projectCount !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-xs font-medium text-primary">{fmt(client.value)}</span>
                    </div>
                    <div className="pl-4 space-y-1.5 border-l-2 border-dashed border-border ml-2.5 mt-1 pt-1">
                      {client.children.map((proj, pi) => (
                        <div key={pi} className="flex items-center gap-2 p-1.5 hover:bg-secondary/40 rounded-sm transition-colors group">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: proj.fill }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium truncate block group-hover:text-primary transition-colors">{proj.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="text-emerald-600">{proj.percentReceived}% received</span>
                              <span>·</span>
                              <span>{proj.billCount} bills</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">{fmt(proj.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tooltip panel — bottom-right for client pie, click-position for sunburst projects ── */}
      <motion.div
        className="absolute z-30 pointer-events-auto"
        style={
          tooltipPos
            ? { left: tooltipPos.x + 8, top: tooltipPos.y + 8, bottom: 'auto', right: 'auto' }
            : { bottom: 16, right: 16 }
        }
        animate={{ opacity: tooltipData ? 1 : 0, scale: tooltipData ? 1 : 0.95 }}
        transition={{ duration: 0.15 }}
      >
        {tooltipData && (() => {
          const d      = tooltipData;
          const isProj = d._type === 'project';
          const recv   = d.value > 0 ? Math.round((d.received / d.value) * 100) : 0;
          const share  = totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : '0';
          return (
            <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl min-w-[200px] text-xs">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: d.fill }} />
                  <p className="font-semibold text-foreground text-[13px] leading-tight truncate">{d.name}</p>
                </div>
                {tooltipPinned && (
                  <button
                    onClick={() => { setTooltipData(null); setTooltipPinned(false); setTooltipPos(null); }}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0 leading-none"
                  >✕</button>
                )}
              </div>
              {isProj && (
                <p className="text-[10px] text-muted-foreground mb-2 pl-4">Client: {d.clientName}</p>
              )}
              <div className="space-y-1 border-t border-border/60 pt-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Total Bill</span>
                  <span className="font-semibold text-primary">{fmt(d.value)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Share</span>
                  <span className="font-medium">{share}%</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Received</span>
                  <span className="font-medium text-emerald-600">
                    {fmt(d.received)}&nbsp;<span className="text-[10px]">({isProj ? d.percentReceived : recv}%)</span>
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium text-amber-600">{fmt(d.remaining)}</span>
                </div>
                <div className="flex justify-between gap-3 pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">{isProj ? 'Bills' : 'Projects'}</span>
                  <span className="font-medium">{isProj ? d.billCount : d.projectCount}</span>
                </div>
              </div>
              {!tooltipPinned && (
                <p className="text-[9px] text-muted-foreground/60 mt-2 text-right">click to pin</p>
              )}
            </div>
          );
        })()}
      </motion.div>
    </motion.div>
  );
}
