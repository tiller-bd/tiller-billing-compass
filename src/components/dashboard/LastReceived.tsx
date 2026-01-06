"use client";

import { motion } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  projectName: string;
  amount: number;
  date: string | Date;
}

interface LastReceivedProps {
  data: Payment[];
}

export function LastReceived({ data }: LastReceivedProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <ArrowDownRight className="w-5 h-5 text-success" />
        <h3 className="font-semibold text-foreground">Last Received</h3>
      </div>
      
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments received yet</p>
        ) : (
          data.map((payment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-3 rounded-lg bg-success/5 border border-success/20 flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{payment.projectName}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(payment.date), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-success">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}