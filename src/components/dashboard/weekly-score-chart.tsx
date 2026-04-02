"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { WeeklyScoreEntry } from "@/lib/types";

interface WeeklyScoreChartProps {
  entries: WeeklyScoreEntry[];
}

const BAR_COLORS = {
  GOOD: "#34d399",
  AVERAGE: "#fbbf24",
  BAD: "#fb7185",
  FUTURE: "rgba(255,255,255,0.12)",
  TODAY: "#f59e0b",
} as const;

export function WeeklyScoreChart({ entries }: WeeklyScoreChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={entries} margin={{ top: 8, right: 0, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis
            dataKey="dayLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(7, 10, 14, 0.96)",
              borderRadius: "18px",
              color: "#fff",
            }}
            formatter={(value) => [
              value == null ? "Upcoming" : `${value}/100`,
              "Score",
            ]}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as WeeklyScoreEntry | undefined;
              return point ? `${point.dayLabel} • ${point.shortDateLabel}` : "";
            }}
          />
          <Bar dataKey="score" radius={[16, 16, 0, 0]}>
            {entries.map((entry) => {
              const fill = entry.isFuture
                ? BAR_COLORS.FUTURE
                : entry.isToday
                  ? BAR_COLORS.TODAY
                  : BAR_COLORS[entry.dayRating ?? "BAD"];

              return <Cell key={entry.date} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
