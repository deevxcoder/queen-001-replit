import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BarChartProps {
  data: any[];
  title: string;
  description?: string;
  xAxisDataKey: string;
  bars: {
    dataKey: string;
    name: string;
    color: string;
    formatter?: (value: number) => string;
  }[];
  height?: number;
  tooltip?: boolean;
  legend?: boolean;
  grid?: boolean;
}

const CustomTooltip = ({ active, payload, label, bars }: TooltipProps<number, string> & { bars: BarChartProps['bars'] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 p-2 border rounded-md shadow-md backdrop-blur-sm">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry, index) => {
          const bar = bars.find(b => b.dataKey === entry.dataKey);
          const value = bar?.formatter ? bar.formatter(entry.value as number) : entry.value;
          return (
            <div key={`item-${index}`} className="flex justify-between text-xs gap-4">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              <span className="font-medium">{value}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  title,
  description,
  xAxisDataKey,
  bars,
  height = 300,
  tooltip = true,
  legend = true,
  grid = true
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              {grid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxisDataKey} />
              <YAxis />
              {tooltip && <Tooltip content={<CustomTooltip bars={bars} />} />}
              {legend && <Legend />}
              {bars.map((bar, index) => (
                <Bar
                  key={index}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarChartComponent;