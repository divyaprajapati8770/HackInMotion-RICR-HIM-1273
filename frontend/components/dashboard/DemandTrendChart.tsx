"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import type { DemandTrendPoint } from "@/lib/types";

const DEFAULT_DATA: DemandTrendPoint[] = [
  { label: "Jul 1",  actualUnits: 420,  forecastUnits: null },
  { label: "Jul 3",  actualUnits: 390,  forecastUnits: null },
  { label: "Jul 5",  actualUnits: 460,  forecastUnits: null },
  { label: "Jul 7",  actualUnits: 510,  forecastUnits: null },
  { label: "Jul 9",  actualUnits: 480,  forecastUnits: null },
  { label: "Jul 11", actualUnits: 530,  forecastUnits: null },
  { label: "Jul 13", actualUnits: 560,  forecastUnits: null },
  { label: "Jul 15", actualUnits: 490,  forecastUnits: 490  },
  { label: "Jul 17", actualUnits: null, forecastUnits: 520  },
  { label: "Jul 19", actualUnits: null, forecastUnits: 545  },
  { label: "Jul 21", actualUnits: null, forecastUnits: 580  },
];

export function DemandTrendChart({ data = DEFAULT_DATA }: { data?: DemandTrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demand trend</CardTitle>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Forecast
          </span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3D4FD1" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#3D4FD1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F2A93B" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F2A93B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9EAF0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#7A8194" }}
                axisLine={{ stroke: "#E9EAF0" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: "#7A8194" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E9EAF0", fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="actualUnits"
                name="Actual units"
                stroke="#3D4FD1"
                strokeWidth={2}
                fill="url(#actualFill)"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="forecastUnits"
                name="Forecast units"
                stroke="#E6961E"
                strokeWidth={2}
                strokeDasharray="4 3"
                fill="url(#forecastFill)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
