import React from 'react';
import { useData } from '../context/DataContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
  User, 
  Scale, 
  Ruler, 
  Activity, 
  Target, 
  Calendar,
  Flame,
  Info,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const ProfileSchema = Yup.object().shape({
  gender: Yup.string().oneOf(['male', 'female', 'other']).required('Richiesto'),
  height: Yup.number().min(100, 'Minimo 100cm').max(250, 'Massimo 250cm').required('Richiesto'),
  weight: Yup.number().min(30, 'Minimo 30kg').max(300, 'Massimo 300kg').required('Richiesto'),
  targetWeight: Yup.number().min(30, 'Minimo 30kg').max(300, 'Massimo 300kg').required('Richiesto'),
  activityLevel: Yup.string().oneOf(['sedentary', 'light', 'moderate', 'active', 'very_active']).required('Richiesto'),
  weeksToGoal: Yup.number().min(1, 'Minimo 1 settimana').max(52, 'Massimo 52 settimane').required('Richiesto'),
  age: Yup.number().min(1, 'Minimo 1 anno').max(120, 'Massimo 120 anni').required('Richiesto'),
});

export const Profilo = () => {
  const { currentUser, updateUser, calculateUserStats } = useData();

  if (!currentUser) return <div>Caricamento...</div>;

  const stats = calculateUserStats(currentUser);

  const handleSubmit = (values) => {
    updateUser(currentUser.id, values);
  };

  // Mock data per il grafico di progressione basato sul target
  const generateProgressionData = () => {
    const data = [];
    const weightDiff = currentUser.weight - currentUser.targetWeight;
    const weeklyLoss = weightDiff / currentUser.weeksToGoal;
    
    for (let i = 0; i <= currentUser.weeksToGoal; i++) {
      data.push({
        settimana: `Sett ${i}`,
        peso: Math.round((currentUser.weight - (weeklyLoss * i)) * 10) / 10
      });
    }
    return data;
  };

  const progressionData = generateProgressionData();

  const getNutritionalAdvice = (target) => {
    if (target < 1500) {
      return "Il tuo target calorico è basso. Assicurati di consumare cibi ad alta densità di nutrienti e considera di aumentare l'attività fisica per permetterti un apporto calorico maggiore.";
    } else if (target > 2500) {
      return "Hai un fabbisogno elevato. Focalizzati su carboidrati complessi e grassi sani per sostenere i tuoi livelli di energia.";
    }
    return "Il tuo target è bilanciato. Mantieni un apporto costante di proteine in ogni pasto e varia le fonti di frutta e verdura.";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Il Tuo Profilo</h1>
        <p className="text-slate-500">Gestisci i tuoi parametri antropometrici e i tuoi obiettivi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form di Modifica */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
            <User className="mr-2 text-primary-500" size={20} /> Parametri Personali
          </h2>
          
          <Formik
            initialValues={{
              gender: currentUser.gender || 'male',
              height: currentUser.height || 170,
              weight: currentUser.weight || 70,
              targetWeight: currentUser.targetWeight || 70,
              activityLevel: currentUser.activityLevel || 'moderate',
              weeksToGoal: currentUser.weeksToGoal || 12,
              age: currentUser.age || 30,
            }}
            validationSchema={ProfileSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, setFieldValue, submitForm }) => {
              // Auto-submit on change to reflect stats in real-time
              const handleChange = (field, val) => {
                setFieldValue(field, val);
                // Utilizziamo un piccolo timeout per assicurarci che Formik abbia aggiornato lo stato
                setTimeout(() => submitForm(), 0);
              };

              return (
                <Form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sesso</label>
                    <Field
                      as="select"
                      name="gender"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      onChange={(e) => handleChange('gender', e.target.value)}
                    >
                      <option value="male">Maschio</option>
                      <option value="female">Femmina</option>
                      <option value="other">Altro</option>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Età</label>
                      <Field
                        name="age"
                        type="number"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        onChange={(e) => handleChange('age', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Altezza (cm)</label>
                      <Field
                        name="height"
                        type="number"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        onChange={(e) => handleChange('height', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                      <Field
                        name="weight"
                        type="number"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        onChange={(e) => handleChange('weight', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Target (kg)</label>
                      <Field
                        name="targetWeight"
                        type="number"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        onChange={(e) => handleChange('targetWeight', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Attività Fisica</label>
                    <Field
                      as="select"
                      name="activityLevel"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      onChange={(e) => handleChange('activityLevel', e.target.value)}
                    >
                      <option value="sedentary">Sedentario (1.2)</option>
                      <option value="light">Leggero (1.375)</option>
                      <option value="moderate">Moderato (1.55)</option>
                      <option value="active">Attivo (1.725)</option>
                      <option value="very_active">Molto Attivo (1.9)</option>
                    </Field>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Settimane Obiettivo</label>
                    <Field
                      name="weeksToGoal"
                      type="number"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      onChange={(e) => handleChange('weeksToGoal', Number(e.target.value))}
                    />
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>

        {/* Risultati e Statistiche */}
        <div className="lg:col-span-2 space-y-8">
          {/* Calcoli */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">BMR</span>
                <Info size={16} className="text-slate-300" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{stats?.bmr} <span className="text-sm font-normal text-slate-400">kcal</span></div>
              <p className="text-xs text-slate-400 mt-1">Metabolismo basale</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Mantenimento</span>
                <Activity size={16} className="text-slate-300" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{stats?.maintenance} <span className="text-sm font-normal text-slate-400">kcal</span></div>
              <p className="text-xs text-slate-400 mt-1">Fabbisogno quotidiano</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-primary-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Target Dieta</span>
                <Flame size={16} className="text-slate-300" />
              </div>
              <div className="text-2xl font-bold text-primary-600">{stats?.target} <span className="text-sm font-normal text-slate-400">kcal</span></div>
              <p className="text-xs text-slate-400 mt-1">Obiettivo giornaliero</p>
            </div>
          </div>

          {/* Grafico Progressione */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
              <Target className="mr-2 text-primary-500" size={20} /> Progressione Peso Prevista
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressionData}>
                  <defs>
                    <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="settimana" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    domain={['dataMin - 5', 'dataMax + 5']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#0ea5e9" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPeso)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consigli Nutrizionali */}
          <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
            <h3 className="text-lg font-bold text-primary-900 mb-2 flex items-center">
              <Info className="mr-2" size={20} /> Consigli per il tuo Target
            </h3>
            <p className="text-primary-800 leading-relaxed">
              {getNutritionalAdvice(stats?.target)}
            </p>
            <div className="mt-4 flex space-x-4">
              <div className="flex-1 bg-white/50 p-3 rounded-lg">
                <div className="text-xs text-primary-600 font-bold uppercase tracking-wider">Deficit Giornaliero</div>
                <div className="text-xl font-bold text-primary-900">-{stats?.deficit} kcal</div>
              </div>
              <div className="flex-1 bg-white/50 p-3 rounded-lg">
                <div className="text-xs text-primary-600 font-bold uppercase tracking-wider">Perdita Settimanale</div>
                <div className="text-xl font-bold text-primary-900">
                  {Math.round(((currentUser.weight - currentUser.targetWeight) / currentUser.weeksToGoal) * 10) / 10} kg
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
