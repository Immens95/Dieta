import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const FoodSchema = Yup.object().shape({
  name: Yup.string().required('Nome richiesto'),
  calories: Yup.number().required('Richiesto').min(0),
  protein: Yup.number().required('Richiesto').min(0),
  fat: Yup.number().required('Richiesto').min(0),
  carbs: Yup.number().required('Richiesto').min(0),
});

export const Alimenti = () => {
  const { foods, addFood, updateFood, deleteFood } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  const filteredFoods = foods.filter(food => 
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (values, { resetForm }) => {
    if (editingFood) {
      updateFood(editingFood.id, values);
    } else {
      addFood(values);
    }
    handleCloseModal(resetForm);
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setIsModalOpen(true);
  };

  const handleCloseModal = (resetForm) => {
    setIsModalOpen(false);
    setEditingFood(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alimenti</h1>
          <p className="text-slate-500">Gestisci il database degli alimenti e i loro valori nutrizionali</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Aggiungi Alimento</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cerca alimento..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nome</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Kcal (100g)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Prot (g)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Grass (g)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Carb (g)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFoods.map((food) => (
                <tr key={food.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{food.name}</td>
                  <td className="px-6 py-4 text-slate-600">{food.calories}</td>
                  <td className="px-6 py-4 text-slate-600">{food.protein}</td>
                  <td className="px-6 py-4 text-slate-600">{food.fat}</td>
                  <td className="px-6 py-4 text-slate-600">{food.carbs}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEdit(food)}
                        className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteFood(food.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingFood ? 'Modifica Alimento' : 'Nuovo Alimento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <Formik
              initialValues={editingFood || { name: '', calories: '', protein: '', fat: '', carbs: '' }}
              validationSchema={FoodSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, resetForm }) => (
                <Form className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Alimento</label>
                    <Field
                      name="name"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.name && touched.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Calorie (100g)</label>
                      <Field
                        name="calories"
                        type="number"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Proteine (g)</label>
                      <Field
                        name="protein"
                        type="number"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Grassi (g)</label>
                      <Field
                        name="fat"
                        type="number"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Carboidrati (g)</label>
                      <Field
                        name="carbs"
                        type="number"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => handleCloseModal(resetForm)}
                      className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Salva
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};
