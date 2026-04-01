import { ResponsiveContainer, CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Spinner } from '@/components/ui/spinner';

type StatusTrendChartProps = {
  trendData: Array<{
    date: string;
    [status: string]: string | number;
  }>;
  isLoading?: boolean;
};

const chartColors: Record<string, string> = {
  received: '#3b82f6', // blue-500
  stored: '#10b981', // green-500
  reserved: '#eab308', // yellow-500
  writtenOff: '#f87171', // red-400
  shipped: '#8b5cf6', // violet-500
};

export function StatusTrendChart({ trendData, isLoading }: StatusTrendChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!trendData || trendData.length === 0) {
    return <p className="text-muted-foreground w-full text-center">No trend data available</p>;
  }

  // Dynamically generate chart config based on the keys in the first trendData object
  const chartConfig: ChartConfig = Object.keys(trendData[0])
    .filter((key) => key !== 'date')
    .reduce((acc, key) => {
      acc[key] = {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        color: chartColors[key] ?? '#6b7280', // fallback gray-500
      };
      return acc;
    }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          {Object.keys(chartConfig).map((key) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={chartConfig[key].color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
