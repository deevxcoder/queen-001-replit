import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
  showPresets?: boolean;
}

type DateRangePreset = {
  name: string;
  range: () => DateRange;
};

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  align = 'start',
  showPresets = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presets: DateRangePreset[] = [
    {
      name: 'Today',
      range: () => ({
        from: new Date(),
        to: new Date(),
      }),
    },
    {
      name: 'Yesterday',
      range: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: yesterday,
          to: yesterday,
        };
      },
    },
    {
      name: 'Last 7 days',
      range: () => {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 6);
        return {
          from: lastWeek,
          to: today,
        };
      },
    },
    {
      name: 'Last 14 days',
      range: () => {
        const today = new Date();
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(today.getDate() - 13);
        return {
          from: twoWeeksAgo,
          to: today,
        };
      },
    },
    {
      name: 'Last 30 days',
      range: () => {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(today.getDate() - 29);
        return {
          from: oneMonthAgo,
          to: today,
        };
      },
    },
    {
      name: 'This month',
      range: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          from: startOfMonth,
          to: today,
        };
      },
    },
    {
      name: 'Last month',
      range: () => {
        const today = new Date();
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          from: startOfLastMonth,
          to: endOfLastMonth,
        };
      },
    },
  ];

  const handlePresetChange = (value: string) => {
    const preset = presets.find((preset) => preset.name === value);
    if (preset) {
      const range = preset.range();
      onDateRangeChange(range);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size="sm"
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto flex flex-col space-y-2 p-2" align={align}>
          {showPresets && (
            <Select
              onValueChange={handlePresetChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent position="popper">
                {presets.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="border rounded-md p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}