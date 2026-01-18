import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Download, 
  Trash2, 
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const Piani = () => {
  const { plans, users, recipes, foods, deletePlan } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlans = plans.filter(plan => {
    const user = users.find(u => u.id === plan.userId);
    return plan.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           user?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const exportToPDF = (plan) => {
    const doc = new jsPDF();
    const user = users.find(u => u.id === plan.userId);

    doc.setFontSize(20);
    doc.text(`Piano Alimentare: ${plan.name}`, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Utente: ${user?.name || 'N/D'}`, 14, 32);
    doc.text(`Periodo: ${plan.startDate} - ${plan.endDate}`, 14, 38);

    const tableData = [];
    Object.entries(plan.days).forEach(([day, meals]) => {
      Object.entries(meals).forEach(([mealType, content]) => {
        let name = '';
        if (content.recipeId) {
          name = recipes.find(r => r.id === content.recipeId)?.name || 'Ricetta';
        } else if (content.foodId) {
          name = foods.find(f => f.id === content.foodId)?.name || 'Alimento';
        }
        tableData.push([day, mealType.toUpperCase(), name, content.servings || `${content.amount}g`]);
      });
    });

    doc.autoTable({
      startY: 45,
      head: [['Giorno', 'Pasto', 'Descrizione', 'Quantità']],
      body: tableData,
    });

    doc.save(`Piano_${plan.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Piani Dietetici</h1>
          <p className="text-slate-500">Gestisci i piani alimentari settimanali e mensili per i tuoi utenti</p>
        </div>
        <button 
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nuovo Piano</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cerca piano o utente..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredPlans.map((plan) => {
            const user = users.find(u => u.id === plan.userId);
            return (
              <div key={plan.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                    <CalendarIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{plan.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <span>{user?.name}</span>
                      <span>•</span>
                      <span>{plan.startDate} al {plan.endDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => exportToPDF(plan)}
                    className="flex items-center space-x-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                  >
                    <Download size={18} />
                    <span className="text-sm font-medium">Esporta PDF</span>
                  </button>
                  <button 
                    onClick={() => deletePlan(plan.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
