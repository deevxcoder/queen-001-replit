import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/auth';

interface LineChartProps {
  data: any[];
  title: string;
  description?: string;
  xAxisDataKey: string;
  lines: {
    dataKey: string;
    name: string;
    color: string;
    formatter?: (value: number) => string;
    strokeWidth?: number;
    type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter' | 'natural' | 'basis';
  }[];
  height?: number;
  tooltip?: boolean;
  legend?: boolean;
  grid?: boolean;
}

const CustomTooltip = ({ active, payload, label, lines }: TooltipProps<number, string> & { lines: LineChartProps['lines'] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 p-2 border rounded-md shadow-md backdrop-blur-sm">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry, index) => {
          const line = lines.find(l => l.dataKey === entry.dataKey);
          const value = line?.formatter ? line.formatter(entry.value as number) : entry.value;
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

const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  title,
  description,
  xAxisDataKey,
  lines,
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
            <LineChart
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
              {tooltip && <Tooltip content={<CustomTooltip lines={lines} />} />}
              {legend && <Legend />}
              {lines.map((line, index) => (
                <Line
                  key={index}
                  type={line.type || 'monotone'}
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth || 2}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default LineChartComponent;