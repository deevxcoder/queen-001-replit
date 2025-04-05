import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  change?: number;
  changeText?: string;
  changePeriod?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
  formatter?: (value: number) => string;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  description,
  icon,
  change,
  changeText,
  changePeriod = 'from previous period',
  trendDirection,
  className,
  formatter
}) => {
  const formattedValue = typeof value === 'number' && formatter ? formatter(value) : value;
  const formattedChange = change !== undefined && formatter && typeof change === 'number' ? formatter(change) : change;
  
  const getTrendColor = () => {
    if (trendDirection === 'up') return 'text-emerald-500';
    if (trendDirection === 'down') return 'text-rose-500';
    return 'text-slate-500';
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return <ArrowUpIcon className="h-4 w-4" />;
    if (trendDirection === 'down') return <ArrowDownIcon className="h-4 w-4" />;
    return null;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        
        {(change !== undefined || changeText) && (
          <div className="flex items-center space-x-1 text-xs mt-2">
            {trendDirection && getTrendIcon()}
            <span className={cn("font-medium", getTrendColor())}>
              {changeText || `${change !== undefined ? (change > 0 ? '+' : '') + formattedChange : ''}`}
            </span>
            <span className="text-muted-foreground">{changePeriod}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataCard;