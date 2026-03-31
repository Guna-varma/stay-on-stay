import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp,
  Target,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { 
  getOwnerMonthlyRevenue,
  type MonthlyRevenue 
} from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from "recharts";

interface ForecastTabProps {
  hotelId: string;
}

interface ForecastPoint {
  month: string;
  actual?: number;
  predicted?: number;
  upper?: number;
  lower?: number;
}

function linearRegression(data: MonthlyRevenue[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const sumX = data.reduce((s, _, i) => s + i, 0);
  const sumY = data.reduce((s, d) => s + d.revenue, 0);
  const sumXY = data.reduce((s, d, i) => s + i * d.revenue, 0);
  const sumX2 = data.reduce((s, _, i) => s + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function forecastRevenue(historicalData: MonthlyRevenue[], monthsAhead: number): ForecastPoint[] {
  const { slope, intercept } = linearRegression(historicalData);
  const n = historicalData.length;
  const forecast: ForecastPoint[] = [];

  for (let i = 0; i < monthsAhead; i++) {
    const index = n + i;
    const predicted = Math.max(0, slope * index + intercept);
    const upper = Math.max(0, predicted * 1.15); // +15% confidence band
    const lower = Math.max(0, predicted * 0.85); // -15% confidence band

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + i + 1);

    forecast.push({
      month: getMonthName(futureDate),
      predicted,
      upper,
      lower,
    });
  }

  return forecast;
}

export default function OwnerForecast({ hotelId }: ForecastTabProps) {
  const [historicalData, setHistoricalData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) { setLoading(false); return; }
    
    const fetchData = async () => {
      setLoading(true);
      const today = new Date();
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await getOwnerMonthlyRevenue(
        hotelId,
        sixMonthsAgo.toISOString().split("T")[0],
        today.toISOString().split("T")[0]
      );

      if (!error) setHistoricalData(data);
      setLoading(false);
    };

    fetchData();
  }, [hotelId]);

  const forecastData = useMemo(() => {
    if (historicalData.length < 2) return [];
    return forecastRevenue(historicalData, 3);
  }, [historicalData]);

  const combinedData: ForecastPoint[] = useMemo(() => {
    const historical = historicalData.map((d) => ({
      month: d.month,
      actual: d.revenue,
    }));
    return [...historical, ...forecastData];
  }, [historicalData, forecastData]);

  const totalHistoricalRevenue = historicalData.reduce((s, d) => s + d.revenue, 0);
  const avgMonthlyRevenue = historicalData.length > 0 ? totalHistoricalRevenue / historicalData.length : 0;
  const forecastedTotal = forecastData.reduce((s, f) => s + (f.predicted || 0), 0);
  const growthRate = historicalData.length >= 2
    ? ((historicalData[historicalData.length - 1].revenue - historicalData[0].revenue) / historicalData[0].revenue) * 100
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!hotelId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Please select a hotel to view revenue forecast.
        </CardContent>
      </Card>
    );
  }

  if (historicalData.length < 2) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
          <p className="text-sm font-medium">Insufficient Data for Forecast</p>
          <p className="text-xs text-muted-foreground mt-2">
            At least 2 months of revenue data is required to generate a forecast.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Avg Monthly Revenue</p>
              </div>
              <p className="text-2xl font-heading font-bold">₹{avgMonthlyRevenue.toFixed(0)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-green-100 text-green-700">
                  <Target className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Next 3 Months (Est.)</p>
              </div>
              <p className="text-2xl font-heading font-bold">₹{forecastedTotal.toFixed(0)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Growth Rate</p>
              </div>
              <p className={`text-2xl font-heading font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">Next Month (Est.)</p>
              </div>
              <p className="text-2xl font-heading font-bold">
                ₹{forecastData.length > 0 ? forecastData[0].predicted?.toFixed(0) : '0'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Forecast Chart with Confidence Bands */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Forecast (Next 3 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 rounded-lg bg-muted/50 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                This forecast is based on linear regression of the past 6 months. Actual results may vary based on seasonality, market conditions, and business decisions.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [`₹${value.toFixed(0)}`, '']}
                />
                <Legend />
                
                {/* Confidence band */}
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="hsl(174, 100%, 24%)"
                  fillOpacity={0.1}
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="hsl(174, 100%, 24%)"
                  fillOpacity={0.1}
                  name="Lower Bound"
                />
                
                {/* Actual revenue */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  name="Actual Revenue"
                />
                
                {/* Predicted revenue */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(174, 100%, 24%)"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 5 }}
                  name="Forecasted Revenue"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Forecast Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detailed Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Month</th>
                    <th className="text-right p-3 font-medium">Predicted Revenue</th>
                    <th className="text-right p-3 font-medium">Optimistic (+15%)</th>
                    <th className="text-right p-3 font-medium">Conservative (-15%)</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.map((f) => (
                    <tr key={f.month} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 font-medium">{f.month}</td>
                      <td className="p-3 text-right">₹{f.predicted?.toFixed(0)}</td>
                      <td className="p-3 text-right text-green-600">₹{f.upper?.toFixed(0)}</td>
                      <td className="p-3 text-right text-red-600">₹{f.lower?.toFixed(0)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-semibold">
                    <td className="p-3">Total (Next 3 Months)</td>
                    <td className="p-3 text-right">₹{forecastedTotal.toFixed(0)}</td>
                    <td className="p-3 text-right text-green-600">₹{(forecastedTotal * 1.15).toFixed(0)}</td>
                    <td className="p-3 text-right text-red-600">₹{(forecastedTotal * 0.85).toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
