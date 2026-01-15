"use client";

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import IndexCounter from './IndexCounter';

interface BillData {
  name: string;
  value: number;
  fill: string;
  received: number;
  remaining: number;
  percentReceived: number;
}

interface ProjectData {
  name: string;
  value: number;
  fill: string;
  children: BillData[];
}

interface ProjectDistributionChartProps {
  data: ProjectData[];
  loading?: boolean;
  isExpanded?: boolean;
}

// Define a fixed color palette with 8 distinct colors
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
  // Assign colors from palette to projects
  const projectsWithColors = data.map((project, idx) => {
    const colorIndex = idx % COLOR_PALETTE.length;
    const { hue } = COLOR_PALETTE[colorIndex];
    
    return {
      ...project,
      fill: `hsl(${hue}, 70%, 50%)`,
      children: project.children.map((bill, billIdx) => {
        // Create shades for bills: lighter shades for more bills
        const totalBills = project.children.length;
        const lightnessStep = 15 / Math.max(totalBills, 1);
        const lightness = 55 + (billIdx * lightnessStep);
        
        return {
          ...bill,
          fill: `hsl(${hue}, 65%, ${Math.min(lightness, 75)}%)`,
        };
      }),
    };
  });

  // Flatten bills for outer ring with project reference
  const billsData = projectsWithColors.flatMap(project => 
    project.children.map(bill => ({
      ...bill,
      projectName: project.name,
    }))
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Check if it's a bill (has projectName) or project
      if (data.projectName) {
        // Bill tooltip
        return (
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
            <p className="font-semibold text-foreground text-sm mb-1">
              {data.name}
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Project: {data.projectName}
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bill Amount:</span>
                <span className="font-medium text-foreground">{formatCurrency(data.value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Received:</span>
                <span className="font-medium text-success">{formatCurrency(data.received)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-warning">{formatCurrency(data.remaining)}</span>
              </div>
              <div className="pt-1 border-t border-border mt-1">
                <span className="font-semibold text-primary">{data.percentReceived}% Paid</span>
              </div>
            </div>
          </div>
        );
      } else {
        // Project tooltip
        const totalBills = data.children?.length || 0;
        const receivedBills = data.children?.filter((bill: BillData) => bill.percentReceived === 100).length || 0;
        const totalAmount = data.value || 0;
        const receivedAmount = data.children?.reduce((sum: number, bill: BillData) => sum + bill.received, 0) || 0;
        const remainingAmount = data.children?.reduce((sum: number, bill: BillData) => sum + bill.remaining, 0) || 0;
        const receivedPercentage = totalAmount > 0 ? Math.round((receivedAmount / totalAmount) * 100) : 0;
        const remainingPercentage = totalAmount > 0 ? Math.round((remainingAmount / totalAmount) * 100) : 0;
        
        return (
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[220px]">
            <p className="font-semibold text-foreground text-sm mb-2">
              {data.name}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium text-primary">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Received:</span>
                <span className="font-medium text-success">
                  {formatCurrency(receivedAmount)} ({receivedPercentage}%)
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-warning">
                  {formatCurrency(remainingAmount)} ({remainingPercentage}%)
                </span>
              </div>
              <div className="pt-1.5 border-t border-border mt-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Bills:</span>
                  <span className="font-medium text-foreground">
                    {receivedBills}/{totalBills} ({receivedPercentage}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  // Custom label component with white background
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, percent } = props;
    
    if (percent <= 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    // Position labels FAR outside the chart - beyond both rings
    // Add extra distance to clear the outer ring completely
    const extraDistance = isExpanded ? 80 : 60;
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
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">No project data available</p>
        </div>
      ) : (
        <div className={cn("flex gap-6 flex-1 min-h-0", isExpanded ? "" : "justify-center")}>
          {/* Chart Section - Full width in normal, 70% in expanded */}
          <div className={cn("min-h-0", isExpanded ? "w-[70%]" : "w-full")}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 60, right: 100, bottom: 60, left: 100 }}>
                {/* Inner Ring - Projects */}
                <Pie
                  data={projectsWithColors}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={isExpanded ? 100 : 60}
                  outerRadius={isExpanded ? 160 : 100}
                  paddingAngle={2}
                  label={renderCustomLabel}
                  labelLine={{
                    stroke: 'hsl(var(--border))',
                    strokeWidth: 1,
                    strokeDasharray: '3 3'
                  }}
                >
                  {projectsWithColors.map((entry, index) => (
                    <Cell 
                      key={`project-${index}`} 
                      fill={entry.fill}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>

                {/* Outer Ring - Bills */}
                {billsData.length > 0 && (
                  <Pie
                    data={billsData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={isExpanded ? 165 : 105}
                    outerRadius={isExpanded ? 220 : 140}
                    paddingAngle={1}
                  >
                    {billsData.map((entry, index) => (
                      <Cell 
                        key={`bill-${index}`} 
                        fill={entry.fill}
                        stroke="hsl(var(--background))"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                )}

                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Section - 30% width, ONLY in expanded mode */}
          {isExpanded && (
            <div className="w-[30%] flex flex-col min-h-0">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex-shrink-0">Projects</h4>
              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {projectsWithColors.map((project, idx) => (
                  <div key={idx} className="relative flex items-start gap-2 group hover:bg-secondary/50 p-3 rounded-md transition-colors border border-transparent hover:border-border">
                    <IndexCounter index={idx} position='end'/>
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2" 
                      style={{ 
                        backgroundColor: project.fill,
                        borderColor: project.fill
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-medium truncate" title={project.name}>
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {project.children.length} {project.children.length === 1 ? 'bill' : 'bills'}
                        </span>
                      </div>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        {formatCurrency(project.value)}
                      </p>
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