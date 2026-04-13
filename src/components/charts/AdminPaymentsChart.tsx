"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface TrendData {
  date: string;
  revenue: number;
  commission: number;
}

interface TopClinic {
  name: string;
  revenue: number;
}

export default function AdminPaymentsChart({ chartData }: { chartData: { trends: TrendData[], topClinics: TopClinic[] } }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Revenue & Commission Trends</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.trends}>
                       <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCom" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val: string | number) => `₹${val}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#818cf8" fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="commission" name="Platform Fee" stroke="#fb7185" fillOpacity={1} fill="url(#colorCom)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Top Performing Clinics</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData.topClinics} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} cursor={{fill: '#1e293b'}} />
                        <Bar dataKey="revenue" name="Gross Revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                     </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
}
