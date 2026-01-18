import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, Edit2, Trash2, X, ChevronRight } from 'lucide-react';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';

const RecipeSchema = Yup.object().shape({
  name: Yup.string().required('Nome richiesto'),
  instructions: Yup.string().required('Istruzioni richieste'),
  ingredients: Yup.array().of(
    Yup.object().shape({
      foodId: Yup.string().required('Seleziona alimento'),
      amount: Yup.number().required('Quantità richiesta').min(1),
    })
  ).min(1, 'Almeno un ingrediente richiesto'),
});

export const Ricette = () => {
  const { recipes, foods, addRecipe, updateRecipe, deleteRecipe, calculateRecipeNutrition } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (values, { resetForm }) => {
    if (editingRecipe) {
      updateRecipe(editingRecipe.id, values);
    } else {
      addRecipe(values);
    }
    handleCloseModal(resetForm);
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = (resetForm) => {
    setIsModalOpen(false);
    setEditingRecipe(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ricettario</h1>
          <p className="text-slate-500">Crea e gestisci le tue ricette con calcolo nutrizionale automatico</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nuova Ricetta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => {
          const nutrition = calculateRecipeNutrition(recipe);
          return (
            <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-800">{recipe.name}</h3>
                  <div className="flex space-x-1">
                    <button onClick={() => handleEdit(recipe)} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteRecipe(recipe.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium">Kcal</div>
                    <div className="text-sm font-bold text-blue-800">{Math.round(nutrition.calories)}</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-600 font-medium">Prot</div>
                    <div className="text-sm font-bold text-green-800">{Math.round(nutrition.protein)}g</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <div className="text-xs text-orange-600 font-medium">Carb</div>
                    <div className="text-sm font-bold text-orange-800">{Math.round(nutrition.carbs)}g</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <div className="text-xs text-red-600 font-medium">Grass</div>
                    <div className="text-sm font-bold text-red-800">{Math.round(nutrition.fat)}g</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingredienti</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {recipe.ingredients.slice(0, 3).map((ing, idx) => {
                      const food = foods.find(f => f.id === ing.foodId);
                      return (
                        <li key={idx} className="flex justify-between">
                          <span>{food?.name}</span>
                          <span className="text-slate-400">{ing.amount}g</span>
                        </li>
                      );
                    })}
                    {recipe.ingredients.length > 3 && (
                      <li className="text-xs text-primary-600 font-medium">+ altri {recipe.ingredients.length - 3} ingredienti</li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">{recipe.ingredients.length} ingredienti</span>
                <button className="text-primary-600 text-sm font-semibold flex items-center hover:text-primary-700 transition-colors">
                  Dettagli <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRecipe ? 'Modifica Ricetta' : 'Nuova Ricetta'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <Formik
                initialValues={editingRecipe || { name: '', instructions: '', ingredients: [{ foodId: '', amount: '' }] }}
                validationSchema={RecipeSchema}
                onSubmit={handleSubmit}
              >
                {({ values, errors, touched, resetForm }) => (
                  <Form className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nome Ricetta</label>
                      <Field
                        name="name"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      {errors.name && touched.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Ingredienti</label>
                      <FieldArray name="ingredients">
                        {({ push, remove }) => (
                          <div className="space-y-3">
                            {values.ingredients.map((ing, index) => (
                              <div key={index} className="flex space-x-3 items-start">
                                <div className="flex-1">
                                  <Field
                                    as="select"
                                    name={`ingredients.${index}.foodId`}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                  >
                                    <option value="">Seleziona alimento</option>
                                    {foods.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                  </Field>
                                </div>
                                <div className="w-32">
                                  <Field
                                    name={`ingredients.${index}.amount`}
                                    type="number"
                                    placeholder="Grammi"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="p-2 text-slate-400 hover:text-red-600 mt-0.5"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => push({ foodId: '', amount: '' })}
                              className="text-primary-600 text-sm font-bold flex items-center hover:text-primary-700"
                            >
                              <Plus size={16} className="mr-1" /> Aggiungi Ingrediente
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Istruzioni</label>
                      <Field
                        as="textarea"
                        name="instructions"
                        rows="4"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      {errors.instructions && touched.instructions && <div className="text-red-500 text-xs mt-1">{errors.instructions}</div>}
                    </div>

                    <div className="flex space-x-3 pt-4 shrink-0">
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
                        Salva Ricetta
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
