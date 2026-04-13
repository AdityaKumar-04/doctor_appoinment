"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface ChartDataPoint {
  date: string;
  revenue: number;
}

export default function ClinicDashboardChart({ chartData }: { chartData: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(20, 184, 166)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="rgb(20, 184, 166)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
              fontFamily="inherit"
              fontWeight="700"
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `₹${val}`}
              fontFamily="inherit"
              fontWeight="700"
            />
            <Tooltip 
               contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '700',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
               }} 
               itemStyle={{ color: '#2dd4bf' }}
               cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              name="Revenue" 
              stroke="#14b8a6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRev)" 
              animationDuration={1500}
            />
        </AreaChart>
    </ResponsiveContainer>
  );
}
