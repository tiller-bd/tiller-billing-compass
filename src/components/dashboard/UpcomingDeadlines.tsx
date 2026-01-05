import { motion } from 'framer-motion';
import { Calendar, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Deadline {
  projectName: string;
  amount: number;
  dueDate: Date;
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
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
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Upcoming Deadlines</h3>
      </div>
      
      <div className="space-y-3">
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
        ) : (
          deadlines.map((deadline, index) => {
            const daysUntil = differenceInDays(new Date(deadline.dueDate), new Date());
            const isUrgent = daysUntil <= 7;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  isUrgent 
                    ? "border-warning/50 bg-warning/5" 
                    : "border-border bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  {isUrgent && (
                    <AlertCircle className="w-4 h-4 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{deadline.projectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(deadline.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(deadline.amount)}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isUrgent ? "text-warning" : "text-muted-foreground"
                  )}>
                    {daysUntil} days
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
