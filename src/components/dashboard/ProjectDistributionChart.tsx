"use client";

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';


// --- Types ---
interface ProjectData {
  name: string;
  value: number;
  fill: string;
  received: number;
  remaining: number;
  percentReceived: number;
  billCount: number;
  clientName: string;
}

interface ClientData {
  name: string;
  value: number;
  fill: string;
  received: number;
  remaining: number;
  projectCount: number;
  children: ProjectData[];
}

interface ProjectDistributionChartProps {
  data: ClientData[];
  loading?: boolean;
  isExpanded?: boolean;
}

// Fixed color palette for Clients - vibrant, distinct colors
const COLOR_PALETTE = [
  { hue: 210, name: 'Blue' },      // Blue
  { hue: 160, name: 'Teal' },      // Teal
  { hue: 280, name: 'Purple' },    // Purple
  { hue: 30, name: 'Orange' },     // Orange
  { hue: 340, name: 'Pink' },      // Pink
  { hue: 120, name: 'Green' },     // Green
  { hue: 50, name: 'Yellow' },     // Yellow
  { hue: 0, name: 'Red' },         // Red
  { hue: 190, name: 'Cyan' },      // Cyan
  { hue: 260, name: 'Violet' },    // Violet
];

export function ProjectDistributionChart({ data, loading, isExpanded }: ProjectDistributionChartProps) {

  // 1. Assign Colors to Clients and their Projects
  const clientsWithColors = data.map((client, idx) => {
    const colorIndex = idx % COLOR_PALETTE.length;
    const { hue } = COLOR_PALETTE[colorIndex];

    // Client Color (Inner Ring) - darker, more saturated
    const clientFill = `hsl(${hue}, 70%, 45%)`;

    return {
      ...client,
      fill: clientFill,
      hue, // Store hue for project coloring
      children: client.children.map((project, projIdx) => {
        // Project Color (Outer Ring) - lighter shades of parent client color
        const projectCount = client.children.length;
        const lightnessStep = projectCount > 1 ? 20 / (projectCount - 1) : 0;
        const lightness = 55 + (projIdx * lightnessStep);
        const projFill = `hsl(${hue}, 60%, ${Math.min(lightness, 75)}%)`;

        return {
          ...project,
          fill: projFill,
        };
      }),
    };
  });

  // 2. Flatten Projects for Outer Ring
  const projectsData = clientsWithColors.flatMap(client =>
    client.children.map(project => ({
      ...project,
      clientName: client.name,
    }))
  );

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
    return `৳${formatted}`;
  };

  // --- Tooltip Logic ---
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;

      const isProject = !!d.clientName && !!d.billCount;
      const isClient = !d.billCount && d.projectCount !== undefined;

      if (isProject) {
        // --- Project Tooltip (Outer Ring) ---
        return (
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[220px]">
            <p className="font-semibold text-foreground text-sm mb-1">{d.name}</p>
            <p className="text-xs text-muted-foreground mb-2">Client: {d.clientName}</p>
            <div className="space-y-1 text-xs border-t border-border pt-2">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium text-primary">{formatCurrency(d.value)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Received:</span>
                <span className="font-medium text-success">
                  {formatCurrency(d.received)} ({d.percentReceived}%)
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-warning">
                  {formatCurrency(d.remaining)}
                </span>
              </div>
              <div className="pt-1 border-t border-border/50 mt-1">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Bills:</span>
                  <span className="font-medium text-foreground">{d.billCount}</span>
                </div>
              </div>
            </div>
          </div>
        );
      } else if (isClient) {
        // --- Client Tooltip (Inner Ring) ---
        const receivedPct = d.value > 0 ? Math.round((d.received / d.value) * 100) : 0;

        return (
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[220px]">
            <p className="font-semibold text-foreground text-sm mb-2">{d.name}</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total Budget:</span>
                <span className="font-medium text-primary">{formatCurrency(d.value)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Received:</span>
                <span className="font-medium text-success">
                  {formatCurrency(d.received)} ({receivedPct}%)
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-warning">
                  {formatCurrency(d.remaining)}
                </span>
              </div>
              <div className="pt-1 border-t border-border/50 mt-1">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Projects:</span>
                  <span className="font-medium text-foreground">{d.projectCount}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, percent } = props;
    if (percent <= 0.05) return null;

    const RADIAN = Math.PI / 180;
    const extraDistance = isExpanded ? 60 : 45;
    const radius = outerRadius + extraDistance;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const displayName = name.length > 15 ? name.substring(0, 15) + '...' : name;
    const textWidth = displayName.length * 6.5;
    const padding = 6;

    return (
      <g>
        <rect
          x={x - textWidth / 2 - padding}
          y={y - 9}
          width={textWidth + padding * 2}
          height={18}
          fill="white"
          stroke="hsl(var(--border))"
          strokeWidth={1}
          rx={4}
          opacity={0.95}
        />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="hsl(var(--foreground))"
          fontSize={10}
          fontWeight={600}
        >
          {displayName}
        </text>
      </g>
    );
  };

  // --- Radius Configuration ---
  // Normal view
  const R_CLIENT_IN = 50, R_CLIENT_OUT = 90;
  const R_PROJ_IN = 95, R_PROJ_OUT = 140;

  // Expanded view
  const E_R_CLIENT_IN = 70, E_R_CLIENT_OUT = 130;
  const E_R_PROJ_IN = 135, E_R_PROJ_OUT = 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass-card rounded-xl p-6 flex flex-col",
        isExpanded ? "h-full w-full" : "h-[450px]"
      )}
    >
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <PieChartIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Project Distribution</h3>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground hidden sm:flex">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <span>Clients</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400" />
            <span>Projects</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Skeleton className="h-64 w-64 rounded-full" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      ) : (
        <div className={cn("flex gap-6 flex-1 min-h-0", isExpanded ? "" : "justify-center")}>
          {/* Chart Section */}
          <div className={cn("min-h-0", isExpanded ? "w-[65%]" : "w-full")}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 50, right: 80, bottom: 50, left: 80 }}>
                {/* Inner Ring: Clients */}
                <Pie
                  data={clientsWithColors}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={isExpanded ? E_R_CLIENT_IN : R_CLIENT_IN}
                  outerRadius={isExpanded ? E_R_CLIENT_OUT : R_CLIENT_OUT}
                  paddingAngle={2}
                >
                  {clientsWithColors.map((entry, index) => (
                    <Cell key={`client-${index}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>

                {/* Outer Ring: Projects */}
                {projectsData.length > 0 && (
                  <Pie
                    data={projectsData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={isExpanded ? E_R_PROJ_IN : R_PROJ_IN}
                    outerRadius={isExpanded ? E_R_PROJ_OUT : R_PROJ_OUT}
                    paddingAngle={1}
                    label={renderCustomLabel}
                    labelLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }}
                  >
                    {projectsData.map((entry, index) => (
                      <Cell key={`proj-${index}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={1} />
                    ))}
                  </Pie>
                )}

                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Section - Only in Expanded View */}
          {isExpanded && (
            <div className="w-[35%] flex flex-col min-h-0 border-l border-border/50 pl-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex-shrink-0">Distribution by Client</h4>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {clientsWithColors.map((client, clientIdx) => (
                  <div key={`legend-client-${clientIdx}`} className="space-y-1">
                    {/* Level 1: Client */}
                    <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded-md border border-border/50">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: client.fill }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" title={client.name}>{client.name}</p>
                        <p className="text-[10px] text-muted-foreground">{client.projectCount} project{client.projectCount !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-xs font-medium text-primary">{formatCurrency(client.value)}</span>
                    </div>

                    {/* Level 2: Projects */}
                    <div className="pl-4 space-y-1.5 border-l-2 border-dashed border-border ml-2.5 mt-1 pt-1">
                      {client.children.map((proj, projIdx) => (
                        <div key={`legend-proj-${clientIdx}-${projIdx}`} className="flex items-center gap-2 p-1.5 hover:bg-secondary/40 rounded-sm transition-colors group">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: proj.fill }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium truncate block group-hover:text-primary transition-colors">{proj.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="text-success">{proj.percentReceived}% received</span>
                              <span>|</span>
                              <span>{proj.billCount} bills</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">{formatCurrency(proj.value)}</span>
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
    </motion.div>
  );
}
