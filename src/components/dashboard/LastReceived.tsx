import { motion } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';

interface LastReceivedProps {
  data: {
    projectName: string;
    amount: number;
    date: Date;
  } | null;
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

  if (!data) {
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
        <p className="text-sm text-muted-foreground">No payments received yet</p>
      </motion.div>
    );
  }

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
        <div className="p-4 rounded-lg bg-success/5 border border-success/20">
          <p className="text-2xl font-bold text-success">
            {formatCurrency(data.amount)}
          </p>
          <p className="text-sm font-medium text-foreground mt-1">
            {data.projectName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(data.date), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
