import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface BudgetComparisonChartProps {
  data: { name: string; received: number; remaining: number }[];
}

export function BudgetComparisonChart({ data }: BudgetComparisonChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Budget vs Received</h3>
        </div>
        <span className="text-xs text-muted-foreground">Amount in millions (BDT)</span>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" horizontal={false} />
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
              tickFormatter={(value) => `${value}M`}
            />
            <YAxis 
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 11 }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(214, 20%, 88%)',
                borderRadius: '8px',
                color: 'hsl(222, 47%, 11%)',
              }}
              formatter={(value: number) => [`৳${value.toFixed(1)}M`, '']}
            />
            <Legend
              verticalAlign="top"
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: 'hsl(215, 16%, 47%)', fontSize: '12px' }}>
                  {value === 'received' ? 'Received' : 'Remaining'}
                </span>
              )}
            />
            <Bar dataKey="received" stackId="a" fill="hsl(173, 80%, 36%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="remaining" stackId="a" fill="hsl(214, 20%, 85%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
