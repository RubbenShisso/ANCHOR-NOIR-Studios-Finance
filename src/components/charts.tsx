"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatZAR, formatZARCompact } from "@/lib/format";

const INK_2 = "#c3c2b7";
const MUTED = "#898781";
const GRID = "#2c2c2a";
const BASELINE = "#383835";
const SURFACE = "#1a1a19";
// Validated dark-mode categorical slots 1 and 2.
const SERIES = ["#3987e5", "#d95926"];

const tooltipStyle = {
  contentStyle: {
    background: SURFACE,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "#f0efec", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: INK_2, padding: 0 },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

const axisTick = { fill: MUTED, fontSize: 11 };

// Monthly grouped bars, e.g. client payments vs savings transferred.
export function MonthlyChart({
  data,
  series,
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={2} barCategoryGap="25%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="month" tick={axisTick} tickLine={false} axisLine={{ stroke: BASELINE }} />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v: number) => formatZARCompact(v)}
        />
        <Tooltip {...tooltipStyle} formatter={(v) => formatZAR(Number(v))} />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: 12, color: INK_2, paddingBottom: 8 }}
        />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={SERIES[i]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Single-series horizontal bars, e.g. income by service category.
export function RankedBarChart({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34 + 24)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis
          type="number"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatZARCompact(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: INK_2, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: BASELINE }}
          width={130}
        />
        <Tooltip {...tooltipStyle} formatter={(v) => formatZAR(Number(v))} />
        <Bar dataKey="value" name={label} fill={SERIES[0]} radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
