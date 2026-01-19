"use client";

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';


// --- Types ---
interface BillData {
  name: string;
  value: number;
  fill: string;
  received: number;
  remaining: number;
  percentReceived: number;
  // flattening helpers
  projectName?: string;
  departmentName?: string;
}

interface ProjectData {
  name: string;
  value: number;
  fill: string;
  children: BillData[];
  // flattening helpers
  departmentName?: string;
}

interface DepartmentData {
  name: string;
  value: number;
  fill: string;
  children: ProjectData[];
}

interface ProjectDistributionChartProps {
  data: DepartmentData[];
  loading?: boolean;
  isExpanded?: boolean;
}

// Fixed color palette for Departments
const COLOR_PALETTE = [
  { hue: 210, name: 'Blue' },      // Blue
  { hue: 160, name: 'Teal' },      // Teal
  { hue: 280, name: 'Purple' },    // Purple
  { hue: 30, name: 'Orange' },     // Orange
  { hue: 340, name: 'Pink' },      // Pink
  { hue: 120, name: 'Green' },     // Green
  { hue: 50, name: 'Yellow' },     // Yellow
  { hue: 0, name: 'Red' },         // Red
];

export function ProjectDistributionChart({ data, loading, isExpanded }: ProjectDistributionChartProps) {

  // 1. Assign Colors to Departments
  const departmentsWithColors = data.map((dept, idx) => {
    const colorIndex = idx % COLOR_PALETTE.length;
    const { hue } = COLOR_PALETTE[colorIndex];

    // Dept Color (Inner Ring)
    const deptFill = `hsl(${hue}, 70%, 45%)`;

    return {
      ...dept,
      fill: deptFill,
      children: dept.children.map((project, projIdx) => {
        // Project Color (Middle Ring)
        const projFill = `hsl(${hue}, 65%, ${projIdx % 2 === 0 ? 55 : 60}%)`;

        return {
          ...project,
          fill: projFill,
          children: project.children.map((bill, billIdx) => {
            // Bill Color (Outer Ring)
            const totalBills = project.children.length;
            const lightnessStep = 15 / Math.max(totalBills, 1);
            const lightness = 65 + (billIdx * lightnessStep);

            return {
              ...bill,
              fill: `hsl(${hue}, 60%, ${Math.min(lightness, 85)}%)`,
            };
          }),
        };
      }),
    };
  });

  // 2. Flatten for Render Layers

  // Layer 2: Projects (needs ref to Dept)
  const projectsData = departmentsWithColors.flatMap(dept =>
    dept.children.map(project => ({
      ...project,
      departmentName: dept.name,
    }))
  );

  // Layer 3: Bills (needs ref to Project & Dept)
  const billsData = projectsData.flatMap(project =>
    project.children.map(bill => ({
      ...bill,
      projectName: project.name,
      departmentName: project.departmentName,
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

      const isBill = !!d.projectName;
      const isProject = !!d.departmentName && !d.projectName;
      // Default to Dept if not Bill or Project
      const isDept = !d.departmentName && !d.projectName;

      if (isBill) {
        // --- Bill Tooltip ---
        return (
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
            <p className="font-semibold text-foreground text-sm mb-1">{d.name}</p>
            <div className="flex flex-col gap-0.5 mb-2">
              <span className="text-xs text-muted-foreground">Dept: {d.departmentName}</span>
              <span className="text-xs text-muted-foreground">Proj: {d.projectName}</span>
            </div>
            <div className="space-y-1 text-xs border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium text-foreground">{formatCurrency(d.value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Received:</span>
                <span className="font-medium text-success">{formatCurrency(d.received)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-warning">{formatCurrency(d.remaining)}</span>
              </div>
            </div>
          </div>
        );
      } else if (isProject) {
        // --- Project Tooltip ---
        const totalBills = d.children?.length || 0;
        const totalValue = d.value || 0;

        // Calculate sums from children bills
        const receivedAmount = d.children?.reduce((sum: number, b: any) => sum + (b.received || 0), 0) || 0;
        const remainingAmount = d.children?.reduce((sum: number, b: any) => sum + (b.remaining || 0), 0) || 0;

        const receivedPct = totalValue > 0 ? Math.round((receivedAmount / totalValue) * 100) : 0;
        const remainingPct = totalValue > 0 ? Math.round((remainingAmount / totalValue) * 100) : 0;

        return (
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[220px]">
            <p className="font-semibold text-foreground text-sm mb-1">{d.name}</p>
            <p className="text-xs text-muted-foreground mb-2">Dept: {d.departmentName}</p>
            <div className="space-y-1 text-xs border-t border-border pt-2">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium text-primary">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Received:</span>
                <span className="font-medium text-success">
                  {formatCurrency(receivedAmount)} ({receivedPct}%)
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-warning">
                  {formatCurrency(remainingAmount)} ({remainingPct}%)
                </span>
              </div>
              <div className="pt-1 border-t border-border/50 mt-1">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Bills:</span>
                  <span className="font-medium text-foreground">{totalBills}</span>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        // --- Department Tooltip ---
        const totalProjects = d.children?.length || 0;
        const totalValue = d.value || 0;

        // Calculate deep sums (Dept -> Projects -> Bills)
        const totalReceived = d.children?.reduce((acc: number, proj: any) => {
          return acc + (proj.children?.reduce((pAcc: number, bill: any) => pAcc + (bill.received || 0), 0) || 0);
        }, 0) || 0;

        const totalRemaining = d.children?.reduce((acc: number, proj: any) => {
          return acc + (proj.children?.reduce((pAcc: number, bill: any) => pAcc + (bill.remaining || 0), 0) || 0);
        }, 0) || 0;

        const receivedPct = totalValue > 0 ? Math.round((totalReceived / totalValue) * 100) : 0;
        const remainingPct = totalValue > 0 ? Math.round((totalRemaining / totalValue) * 100) : 0;

        return (
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[220px]">
            <p className="font-semibold text-foreground text-sm mb-2">{d.name}</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium text-primary">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Received:</span>
                <span className="font-medium text-success">
                  {formatCurrency(totalReceived)} ({receivedPct}%)
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-warning">
                  {formatCurrency(totalRemaining)} ({remainingPct}%)
                </span>
              </div>
              <div className="pt-1 border-t border-border/50 mt-1">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Projects:</span>
                  <span className="font-medium text-foreground">{totalProjects}</span>
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
    const extraDistance = isExpanded ? 70 : 50;
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
  const R_DEPT_IN = 40, R_DEPT_OUT = 70;
  const R_PROJ_IN = 75, R_PROJ_OUT = 105;
  const R_BILL_IN = 110, R_BILL_OUT = 140;

  const E_R_DEPT_IN = 60, E_R_DEPT_OUT = 100;
  const E_R_PROJ_IN = 105, E_R_PROJ_OUT = 155;
  const E_R_BILL_IN = 160, E_R_BILL_OUT = 210;

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
            <span>Depts</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-primary" />
            <span>Projects</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary/30" />
            <span>Bills</span>
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
          <div className={cn("min-h-0", isExpanded ? "w-[70%]" : "w-full")}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 60, right: 100, bottom: 60, left: 100 }}>
                {/* 1. Inner Ring: Departments */}
                <Pie
                  data={departmentsWithColors}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={isExpanded ? E_R_DEPT_IN : R_DEPT_IN}
                  outerRadius={isExpanded ? E_R_DEPT_OUT : R_DEPT_OUT}
                  paddingAngle={2}
                >
                  {departmentsWithColors.map((entry, index) => (
                    <Cell key={`dept-${index}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>

                {/* 2. Middle Ring: Projects */}
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

                {/* 3. Outer Ring: Bills */}
                {billsData.length > 0 && (
                  <Pie
                    data={billsData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={isExpanded ? E_R_BILL_IN : R_BILL_IN}
                    outerRadius={isExpanded ? E_R_BILL_OUT : R_BILL_OUT}
                    paddingAngle={1}
                  >
                    {billsData.map((entry, index) => (
                      <Cell key={`bill-${index}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={1} />
                    ))}
                  </Pie>
                )}

                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Nested Legend Section */}
          {isExpanded && (
            <div className="w-[30%] flex flex-col min-h-0 border-l border-border/50 pl-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex-shrink-0">Distribution Detail</h4>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {departmentsWithColors.map((dept, deptIdx) => (
                  <div key={`legend-dept-${deptIdx}`} className="space-y-1">
                    {/* Level 1: Department */}
                    <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded-md border border-border/50">
                      
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dept.fill }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" title={dept.name}>{dept.name}</p>
                      </div>
                      <span className="text-xs font-medium text-primary">{formatCurrency(dept.value)}</span>
                    </div>

                    {/* Level 2: Projects */}
                    <div className="pl-4 space-y-2 border-l-2 border-dashed border-border ml-2.5 mt-1 pt-1">
                      {dept.children.map((proj, projIdx) => (
                        <div key={`legend-proj-${deptIdx}-${projIdx}`} className="space-y-1">
                          <div className="flex items-center gap-2 p-1.5 hover:bg-secondary/40 rounded-sm transition-colors group">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: proj.fill }} />
                            <span className="text-xs font-medium truncate flex-1 group-hover:text-primary transition-colors">{proj.name}</span>
                            <span className="text-[10px] text-muted-foreground">{formatCurrency(proj.value)}</span>
                          </div>

                          {/* Level 3: Bills */}
                          <div className="pl-3 space-y-0.5 border-l border-border/40 ml-1">
                            {proj.children.map((bill, billIdx) => (
                              <div key={`legend-bill-${deptIdx}-${projIdx}-${billIdx}`} className="flex items-center gap-2 p-1 hover:bg-secondary/20 rounded-sm">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-70" style={{ backgroundColor: bill.fill }} />
                                <span className="text-[10px] text-muted-foreground truncate flex-1" title={bill.name}>{bill.name}</span>
                                <span className="text-[10px] text-muted-foreground/70">{formatCurrency(bill.value)}</span>
                              </div>
                            ))}
                          </div>
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