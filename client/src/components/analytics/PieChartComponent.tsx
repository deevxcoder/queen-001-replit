import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
  description?: string;
  colors?: string[];
  height?: number;
  dataKey?: string;
  nameKey?: string;
  tooltip?: boolean;
  legend?: boolean;
  percentage?: boolean;
  formatter?: (value: number) => string;
}

// Default colors for the chart
const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#f43f5e'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, formatter }: TooltipProps<number, string> & { formatter?: (value: number) => string }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background/95 p-2 border rounded-md shadow-md backdrop-blur-sm">
        <p className="font-medium text-xs" style={{ color: data.color }}>
          {data.name}
        </p>
        <p className="text-xs">
          <span className="font-medium">Value: </span>
          {formatter ? formatter(data.value as number) : data.value}
        </p>
        <p className="text-xs">
          <span className="font-medium">Percentage: </span>
          {`${((data.value as number) / payload.reduce((sum, entry) => sum + (entry.value as number), 0) * 100).toFixed(1)}%`}
        </p>
      </div>
    );
  }
  return null;
};

const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  title,
  description,
  colors = DEFAULT_COLORS,
  height = 300,
  dataKey = 'value',
  nameKey = 'name',
  tooltip = true,
  legend = true,
  percentage = true,
  formatter
}) => {
  // Filter out entries with value of 0
  const validData = data.filter(item => item.value > 0);
  
  // Get colors for each segment
  const getColor = (index: number) => colors[index % colors.length];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          {validData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={validData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={percentage ? renderCustomizedLabel : undefined}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey={dataKey}
                  nameKey={nameKey}
                >
                  {validData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Pie>
                {tooltip && <Tooltip content={<CustomTooltip formatter={formatter} />} />}
                {legend && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">No data to display</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PieChartComponent;