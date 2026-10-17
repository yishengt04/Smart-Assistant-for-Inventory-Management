import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import { Item } from '../types';

interface InventoryPieChartProps {
  items: Item[];
}

const InventoryPieChart: React.FC<InventoryPieChartProps> = ({ items }) => {
  const lowStockCount = items.filter(i => i.current_stock <= i.reorder_point).length;
  const highStockCount = items.length - lowStockCount;

  const data = [
    { name: 'High Stock', value: highStockCount, color: '#6366f1' }, // Indigo-500
    { name: 'Low Stock', value: lowStockCount, color: '#ef4444' }     // Red-500
  ];

  const total = items.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl">
          <p className="text-xs font-bold text-slate-400 mb-1 uppercase">{item.name}</p>
          <p className="text-xl font-black" style={{ color: item.color }}>{item.value} Items</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={data[index].color} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[10px] font-bold uppercase tracking-widest"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="h-72 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={8}
            dataKey="value"
            label={renderCustomizedLabel}
            labelLine={{ stroke: '#475569', strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
            <Label
              value={total.toString()}
              position="center"
              fill="#f8fafc"
              style={{ fontSize: '24px', fontWeight: '900' }}
            />
            <Label
              value="TOTAL"
              position="center"
              dy={20}
              fill="#94a3b8"
              style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em' }}
            />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            formatter={(value, entry: any) => (
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tight ml-1">
                {value}: <span style={{ color: entry.color }}>{entry.payload.value}</span>
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InventoryPieChart;