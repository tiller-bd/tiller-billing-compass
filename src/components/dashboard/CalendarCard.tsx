"use client";

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, getDay, addMonths, subMonths, parse } from 'date-fns';

interface CalendarEvent {
  date: Date;
  type: 'tentative_payment' | 'received_payment' | 'project_signed' | 'pg_cleared';
  title: string;
  projectName?: string;
  amount?: number;
}

interface CalendarCardProps {
  events?: CalendarEvent[];
  loading?: boolean;
  isExpanded?: boolean;
}

export function CalendarCard({ events = [], loading = false, isExpanded = false }: CalendarCardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday)
  const firstDayOfWeek = getDay(monthStart);

  // Create array of day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  // Check if date is Friday or Saturday
  const isHoliday = (date: Date) => {
    const day = getDay(date);
    return day === 5 || day === 6; // Friday = 5, Saturday = 6
  };

  // Get event color
  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'tentative_payment':
        return 'bg-amber-500';
      case 'received_payment':
        return 'bg-success';
      case 'project_signed':
        return 'bg-blue-500';
      case 'pg_cleared':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(null);
  };

  const handleDateJump = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentMonth(parsedDate);
        setSelectedDate(null);
      }
    }
  };

  const handleDateClick = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null); // Deselect if clicking the same date
    } else {
      setSelectedDate(date);
    }
  };

  return (
    <Card className={cn(
      "glass-card rounded-3xl border-border/50 shadow-sm",
      isExpanded ? "h-full flex flex-col" : "h-auto"
    )}>
      <div className={cn("p-6 md:p-8", isExpanded && "flex-1 overflow-hidden flex flex-col")}>
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl">
                <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-muted-foreground">
                  Project Calendar
                </h3>
                <p className="text-lg md:text-xl font-bold">
                  {format(currentMonth, 'MMMM yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="text-xs font-bold"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* Date Picker and Show All/Hide All */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-bold">Jump to:</span>
              <Input
                type="date"
                onChange={handleDateJump}
                className="h-8 text-xs max-w-[150px]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="gap-2 text-xs font-bold"
            >
              {showAllEvents ? <EyeOff size={14} /> : <Eye size={14} />}
              {showAllEvents ? 'Hide All' : 'Show All'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className={cn("space-y-4", isExpanded && "flex-1 overflow-y-auto")}>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] md:text-xs font-bold text-muted-foreground uppercase py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days of the month */}
              {daysInMonth.map((date) => {
                const dayEvents = getEventsForDate(date);
                const isToday = isSameDay(date, new Date());
                const holiday = isHoliday(date);
                const isSelected = selectedDate && isSameDay(selectedDate, date);
                const shouldShowTooltip = dayEvents.length > 0 && (showAllEvents || isSelected);

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => dayEvents.length > 0 && handleDateClick(date)}
                    className={cn(
                      "aspect-square border rounded-lg md:rounded-xl p-1 md:p-2 relative group transition-all",
                      dayEvents.length > 0 ? "cursor-pointer hover:shadow-md" : "cursor-default",
                      isToday && "border-primary border-2",
                      isSelected && "ring-2 ring-primary ring-offset-2",
                      holiday && "bg-red-50 dark:bg-red-950/20"
                    )}
                  >
                    <div className={cn(
                      "text-xs md:text-sm font-bold",
                      holiday && "text-red-600 dark:text-red-400",
                      isToday && "text-primary"
                    )}>
                      {format(date, 'd')}
                    </div>

                    {/* Event indicators */}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full",
                              getEventColor(event.type)
                            )}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[8px] md:text-[10px] text-muted-foreground font-bold">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tooltip - only show if showAllEvents is true or date is selected */}
                    {shouldShowTooltip && (
                      <div className={cn(
                        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 md:w-64 bg-popover border rounded-lg shadow-lg p-3 z-20 transition-opacity",
                        showAllEvents ? "opacity-0 group-hover:opacity-100 pointer-events-none" : "opacity-100"
                      )}>
                        <p className="text-xs font-bold mb-2">{format(date, 'MMM dd, yyyy')}</p>
                        <div className="space-y-1.5">
                          {dayEvents.map((event, idx) => (
                            <div key={idx} className="text-[10px] md:text-xs">
                              <div className="flex items-start gap-2">
                                <div className={cn("w-2 h-2 rounded-full mt-0.5 shrink-0", getEventColor(event.type))} />
                                <div className="flex-1">
                                  <p className="font-bold">{event.title}</p>
                                  {event.projectName && (
                                    <p className="text-muted-foreground">{event.projectName}</p>
                                  )}
                                  {event.amount && (
                                    <p className="text-success font-bold">{formatCurrency(event.amount)}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase mb-3">Legend</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-[10px] md:text-xs">Tentative</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-[10px] md:text-xs">Received</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-[10px] md:text-xs">Signed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-[10px] md:text-xs">PG Cleared</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
