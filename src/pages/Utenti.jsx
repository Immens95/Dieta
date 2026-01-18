import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, Edit2, Trash2, X, Shield, ShieldCheck, Mail, User } from 'lucide-react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const UserSchema = Yup.object().shape({
  name: Yup.string().required('Nome richiesto'),
  email: Yup.string().email('Email non valida').required('Email richiesta'),
  role: Yup.string().oneOf(['admin', 'user']).required('Ruolo richiesto'),
  goal: Yup.string().required('Obiettivo richiesto'),
});

export const Utenti = () => {
  const { users, addUser, updateUser, deleteUser } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (values, { resetForm }) => {
    if (editingUser) {
      updateUser(editingUser.id, values);
    } else {
      addUser(values);
    }
    handleCloseModal(resetForm);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = (resetForm) => {
    setIsModalOpen(false);
    setEditingUser(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestione Utenti</h1>
          <p className="text-slate-500">Gestisci i profili utente, i ruoli e i permessi di accesso</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nuovo Utente</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cerca utente per nome o email..."
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
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Utente</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Ruolo</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Obiettivo</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? <ShieldCheck size={12} className="mr-1" /> : <Shield size={12} className="mr-1" />}
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {user.goal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)}
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
                {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <Formik
              initialValues={editingUser || { name: '', email: '', role: 'user', goal: 'weight_loss' }}
              validationSchema={UserSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, resetForm }) => (
                <Form className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <Field
                        name="name"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    {errors.name && touched.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <Field
                        name="email"
                        type="email"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    {errors.email && touched.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ruolo</label>
                      <Field
                        as="select"
                        name="role"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </Field>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Obiettivo</label>
                      <Field
                        as="select"
                        name="goal"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="weight_loss">Perdita peso</option>
                        <option value="muscle_gain">Guadagno muscolare</option>
                        <option value="maintenance">Mantenimento</option>
                      </Field>
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
                      Salva Utente
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
