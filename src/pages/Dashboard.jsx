import React from 'react';
import { useData } from '../context/DataContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users as UsersIcon,
  Apple,
  Utensils
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon size={24} className="text-white" />
      </div>
      <span className="text-slate-400 text-sm font-medium">{title}</span>
    </div>
    <div className="text-2xl font-bold text-slate-800">{value}</div>
  </div>
);

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export const Dashboard = () => {
  const { foods, recipes, users, plans, currentUser } = useData();

  const pieData = [
    { name: 'Proteine', value: 30, color: '#0ea5e9' },
    { name: 'Carboidrati', value: 50, color: '#f59e0b' },
    { name: 'Grassi', value: 20, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Benvenuto, {currentUser?.name || 'Utente'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Totale Alimenti" 
          value={foods.length} 
          icon={Apple} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Ricette Salvate" 
          value={recipes.length} 
          icon={Utensils} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Utenti Attivi" 
          value={users.length} 
          icon={UsersIcon} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Piani Generati" 
          value={plans.length} 
          icon={Target} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribuzione Macronutrienti (Target)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Attività Settimanale</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { day: 'Lun', kcal: 2100 },
                { day: 'Mar', kcal: 1950 },
                { day: 'Mer', kcal: 2200 },
                { day: 'Gio', kcal: 1800 },
                { day: 'Ven', kcal: 2050 },
                { day: 'Sab', kcal: 2400 },
                { day: 'Dom', kcal: 2150 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="kcal" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
