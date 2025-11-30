import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  BarChart2, 
  AlertCircle,
  Trash2,
  Briefcase,
  Wallet,
  Coffee,
  Moon,
  Sun,
  Code,
  Terminal,
  Settings,
  X
} from 'lucide-react';

// --- YARDIMCI FONKSİYONLAR ---

const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDuration = (totalMinutes) => {
  if (!totalMinutes && totalMinutes !== 0) return "0s 0d";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}s ${minutes}d`;
};

// Para birimi EURO olarak güncellendi
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(amount);
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const getDayName = (date) => {
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(date);
};

const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const getWeekRange = (date) => {
  const current = new Date(date);
  const day = current.getDay(); 
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); 
  
  const startOfWeek = new Date(current.setDate(diff));
  const endOfWeek = new Date(current.setDate(current.getDate() + 6));
  
  return { start: startOfWeek, end: endOfWeek };
};

// --- ANA COMPONENT ---

export default function WorkTimeTracker() {
  // State: Koyu Mod (Varsayılan false, localStorage'dan oku)
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('tracker_darkMode');
    return savedMode === 'true';
  });

  // State: Seçili Tarih
  const [currentDate, setCurrentDate] = useState(() => {
    const savedDate = localStorage.getItem('tracker_lastDate');
    return savedDate ? new Date(savedDate) : new Date();
  });
  
  // State: Seçili Gün
  const [selectedDay, setSelectedDay] = useState(new Date(currentDate));

  // Ref: Seçili günü ortalamak için
  const activeDayRef = useRef(null);

  // State: Veriler 
  const [workData, setWorkData] = useState(() => {
    const savedData = localStorage.getItem('workTimeData');
    return savedData ? JSON.parse(savedData) : {};
  });

  // State: Ayarlar
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tracker_settings');
    return saved ? JSON.parse(saved) : {
      defaultStartTime: '08:00',
      defaultEndTime: '17:00',
      hourlyRate: '',
      holidayDays: [] // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    };
  });

  // State: Ayarlar Modalı Açık/Kapalı
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // State: Ayarlar Formu (Modal için)
  const [settingsForm, setSettingsForm] = useState(settings);

  const [formData, setFormData] = useState({ 
    start: '08:00', 
    end: '', 
    isOff: false,
    isCustom: false
  });
  
  const [error, setError] = useState('');
  // Toast mesajı için state
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }
  const toastTimeoutRef = useRef(null);

  const showToast = (type, message, duration = 3000) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, duration);
  };

  const clearToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast(null);
  };

  useEffect(() => {
    return () => {
      clearToast();
    };
  }, []);

  // --- EFFECTS ---

  // Tailwind Config Ayarı (Manuel Dark Mode için 'class' stratejisine zorla)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.tailwind) {
       window.tailwind.config = {
          ...window.tailwind.config,
          darkMode: 'class'
       };
    }
  }, []);

  // Koyu mod değişince HTML root elementine class ekle/çıkar
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tracker_darkMode', darkMode);
  }, [darkMode]);

  // Scroll effect
  useEffect(() => {
    if (activeDayRef.current) {
      activeDayRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [selectedDay]);

  // Formu doldur
  useEffect(() => {
    const key = formatDateKey(selectedDay);
    const data = workData[key];
    
    if (data) {
      setFormData({
        start: data.start || settings.defaultStartTime,
        end: data.end || '',
        isOff: data.isOff || false,
        isCustom: data.isCustom || false
      });
    } else {
      setFormData({
        start: settings.defaultStartTime,
        end: '',
        isOff: false,
        isCustom: false
      });
    }
    setError('');
  }, [selectedDay, workData, settings]);

  // Veri kaydet
  useEffect(() => {
    localStorage.setItem('workTimeData', JSON.stringify(workData));
  }, [workData]);

  // Ay kaydet
  useEffect(() => {
    localStorage.setItem('tracker_lastDate', currentDate.toISOString());
  }, [currentDate]);

  // --- HESAPLAMALAR ---

  const daysInMonth = useMemo(() => {
    return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const monthlyStats = useMemo(() => {
    let totalMinutes = 0;
    let totalEarnings = 0;
    let daysWorked = 0;

    daysInMonth.forEach(day => {
      const key = formatDateKey(day);
      const entry = workData[key];
      
      if (entry && entry.isOff) return;

      if (entry && entry.start && entry.end) {
        const start = timeToMinutes(entry.start);
        const end = timeToMinutes(entry.end);
        const duration = end - start; 
        const rate = settings.hourlyRate ? parseFloat(settings.hourlyRate) : 0;
        
        if (duration > 0) {
          totalMinutes += duration;
          if (rate > 0) totalEarnings += (duration / 60) * rate;
          daysWorked++;
        }
      }
    });

    return {
      totalMinutes,
      totalEarnings,
      averageMinutes: daysWorked > 0 ? Math.round(totalMinutes / daysWorked) : 0,
      daysWorked
    };
  }, [daysInMonth, workData, settings]);

  const weeklyStats = useMemo(() => {
    const { start, end } = getWeekRange(selectedDay);
    let totalMinutes = 0;
    let totalEarnings = 0;
    let current = new Date(start);

    while (current <= end) {
      const key = formatDateKey(current);
      const entry = workData[key];
      
      if (entry && !entry.isOff && entry.start && entry.end) {
        const s = timeToMinutes(entry.start);
        const e = timeToMinutes(entry.end);
        const duration = e - s;
        const rate = settings.hourlyRate ? parseFloat(settings.hourlyRate) : 0;
        
        if (duration > 0) {
          totalMinutes += duration;
          if (rate > 0) totalEarnings += (duration / 60) * rate;
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return { totalMinutes, totalEarnings };
  }, [selectedDay, workData, settings]);

  const currentDayCalculation = useMemo(() => {
    if (formData.isOff) return { duration: 0, earnings: 0, isOff: true };
    if (!formData.start || !formData.end) return null;
    
    const s = timeToMinutes(formData.start);
    const e = timeToMinutes(formData.end);
    const duration = Math.max(0, e - s);
    const rate = settings.hourlyRate ? parseFloat(settings.hourlyRate) : 0;
    const earnings = (duration / 60) * rate;
    
    return { duration, earnings, isOff: false };
  }, [formData, settings]);

  // --- HANDLERS ---

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val, isCustom: true }));
    setError('');
  };

  const handleSave = () => {
    try {
      // Eğer izin değilse, giriş ve çıkış saatlerinin dolu olması gerekli
      if (!formData.isOff && (!formData.start || !formData.end)) {
        const msg = 'Giriş ve çıkış saatleri boş olamaz.';
        setError(msg);
        showToast('error', msg);
        return;
      }

      if (!formData.isOff && formData.start && formData.end) {
        const startMins = timeToMinutes(formData.start);
        const endMins = timeToMinutes(formData.end);
        if (startMins >= endMins) {
          setError('Çıkış saati giriş saatinden sonra olmalıdır.');
          return;
        }
      }

      const key = formatDateKey(selectedDay);
      if (!formData.isOff && !formData.start && !formData.end) {
        const newData = { ...workData };
        delete newData[key];
        setWorkData(newData);
      } else {
        setWorkData(prev => ({ ...prev, [key]: formData }));
      }

      // Başarılı toast
      showToast('success', formData.isOff ? 'İzin bilgisi kaydedildi.' : 'Saatler başarıyla kaydedildi.');
      setError('');
    } catch (err) {
      const msg = err?.message || 'Kaydetme sırasında bir hata oluştu.';
      setError(msg);
      showToast('error', msg);
    }
  };

  const handleClearDay = () => {
    const key = formatDateKey(selectedDay);
    const newData = { ...workData };
    delete newData[key];
    setWorkData(newData);
    setFormData({ 
      start: settings.defaultStartTime, 
      end: '', 
      isOff: false,
      isCustom: false
    });
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
    const today = new Date();
    if (newDate.getMonth() === today.getMonth() && newDate.getFullYear() === today.getFullYear()) {
        setSelectedDay(today);
    } else {
        setSelectedDay(newDate);
    }
  };

  const handleOpenSettings = () => {
    console.log('Ayarlar butonuna tıklandı. settings:', settings);
    setSettingsForm(settings);
    setShowSettingsModal(true);
    showToast('success', 'Ayarlar penceresi açılıyor', 1200);
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'holidayDays') {
      const dayNum = parseInt(value);
      setSettingsForm(prev => ({
        ...prev,
        holidayDays: checked
          ? [...prev.holidayDays, dayNum]
          : prev.holidayDays.filter(d => d !== dayNum)
      }));
    } else {
      setSettingsForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveSettings = () => {
    console.log('handleSaveSettings çalıştı. settingsForm:', settingsForm);
    // Yeni ayarları kaydet
    setSettings(settingsForm);
    localStorage.setItem('tracker_settings', JSON.stringify(settingsForm));
    
    // Varsayılan tatil günlerini ay içinde otomatik olarak işaretle
    const newWorkData = { ...workData };
    
    daysInMonth.forEach(day => {
      const dayOfWeek = day.getDay();
      const key = formatDateKey(day);
      
      if (settingsForm.holidayDays.includes(dayOfWeek)) {
        // Eğer bu gün custom değilse veya zaten kayıtlı değilse, izinli olarak işaretle
        if (!newWorkData[key]?.isCustom) {
          newWorkData[key] = {
            ...newWorkData[key],
            isOff: true,
            isCustom: false
          };
        }
      }
    });
    
    // Varsayılan saatleri custom olmayan günlere uygula
    daysInMonth.forEach(day => {
      const key = formatDateKey(day);
      const entry = newWorkData[key];
      
      if (entry && !entry.isCustom && !entry.isOff) {
        entry.start = settingsForm.defaultStartTime;
        entry.end = settingsForm.defaultEndTime;
      } else if (!entry) {
        // Boş gün olsa ve tatil günü değilse, varsayılan saatleri koy
        const dayOfWeek = day.getDay();
        if (!settingsForm.holidayDays.includes(dayOfWeek)) {
          newWorkData[key] = {
            start: settingsForm.defaultStartTime,
            end: settingsForm.defaultEndTime,
            isOff: false,
            isCustom: false
          };
        }
      }
    });
    
    setWorkData(newWorkData);
    console.log('Ayarlar kaydedildi, modal kapatılıyor.');
    setShowSettingsModal(false);
    showToast('success', 'Ayarlar kaydedildi.');
  };

  useEffect(() => {
    console.log('showSettingsModal değişti:', showSettingsModal);
  }, [showSettingsModal]);

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Clock size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block">Şerifoğlu Saat Takip</h1>
          </div>
          
          <div className="flex items-center gap-3">
              {/* Ay Navigasyonu */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full p-1 transition-colors duration-300">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-full transition-all shadow-sm dark:text-slate-200">
                  <ChevronLeft size={20} />
                  </button>
                  <span className="font-semibold min-w-[130px] text-center text-sm sm:text-base dark:text-slate-200">
                  {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-full transition-all shadow-sm dark:text-slate-200">
                  <ChevronRight size={20} />
                  </button>
              </div>

              {/* Koyu Mod Toggle */}
              <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                  title={darkMode ? "Aydınlık Mod" : "Koyu Mod"}
              >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Ayarlar Butonu */}
              <button 
                  onClick={handleOpenSettings}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
                  title="Ayarlar"
              >
                  <Settings size={20} />
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow w-full">
        
        {/* SOL PANEL: GÜN LİSTESİ */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 h-[calc(100vh-500px)] lg:h-[calc(100vh-200px)] overflow-hidden">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden transition-colors duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Calendar size={18} />
                Günler
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar scroll-smooth">
              {daysInMonth.map((day) => {
                const key = formatDateKey(day);
                const entry = workData[key];
                const isSelected = formatDateKey(selectedDay) === key;
                
                const isTuesday = day.getDay() === 2; 
                
                const isOff = entry?.isOff;
                const hasData = entry && entry.start && entry.end && !isOff;
                
                let listDuration = "";
                if (hasData) {
                    const s = timeToMinutes(entry.start);
                    const e = timeToMinutes(entry.end);
                    listDuration = formatDuration(Math.max(0, e - s));
                }

                return (
                  <button
                    key={key}
                    ref={isSelected ? activeDayRef : null}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full text-left p-3 rounded-lg transition-all border ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-700' 
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className={`font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {day.getDate()} {day.toLocaleDateString('tr-TR', { month: 'short' })}
                        </div>
                        <div className={`text-xs 'text-slate-400 dark:text-slate-500'}`}>
                          {getDayName(day)}
                        </div>
                      </div>
                      
                      {isOff ? (
                          <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                            <Coffee size={12} /> İzinli
                          </span>
                      ) : hasData ? (
                        <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {listDuration}
                        </span>
                      ) : (
                        isTuesday ? null : <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SAĞ PANEL: EDİTÖR VE İSTATİSTİKLER */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          
          {/* Giriş Formu */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {selectedDay.getDate()} {selectedDay.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">{getDayName(selectedDay)}</p>
              </div>
              
              {currentDayCalculation && (
                <div className="text-right">
                   <div className="text-sm text-slate-500 dark:text-slate-400">Durum</div>
                   {currentDayCalculation.isOff ? (
                      <div className="text-amber-600 dark:text-amber-500 font-bold flex items-center justify-end gap-1 mt-1">
                        <Coffee size={20} /> İZİNLİ
                      </div>
                   ) : (
                     <div className="flex flex-col items-end">
                       <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                         {formatDuration(currentDayCalculation.duration)}
                       </span>
                       <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50">
                         {formatCurrency(currentDayCalculation.earnings)}
                       </span>
                     </div>
                   )}
                </div>
              )}
            </div>

            {/* İzinli Switch */}
            <div className="mb-6 bg-slate-50 dark:bg-slate-750 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-between transition-colors duration-300">
                <div className="flex items-center gap-2">
                    <Coffee className="text-amber-600 dark:text-amber-500" size={20} />
                    <span className="font-medium text-slate-700 dark:text-slate-200">Bugün İzinliyim / Tatil</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        name="isOff"
                        checked={formData.isOff}
                        onChange={handleInputChange}
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${formData.isOff ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Giriş Saati</label>
                <input
                  type="time"
                  name="start"
                  value={formData.start}
                  onChange={handleInputChange}
                  disabled={formData.isOff}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Çıkış Saati</label>
                <input
                  type="time"
                  name="end"
                  value={formData.end}
                  onChange={handleInputChange}
                  disabled={formData.isOff}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3 rounded-lg text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <Save size={20} />
                {formData.isOff ? 'İzin Olarak Kaydet' : 'Kaydet'}
              </button>
              <button
                onClick={handleClearDay}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 py-3 px-4 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                title="Günü Temizle"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Haftalık */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-start gap-4 transition-colors duration-300">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400 mt-1">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Bu Haftaki Toplam</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{formatDuration(weeklyStats.totalMinutes)}</p>
                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Wallet size={14} />
                  {formatCurrency(weeklyStats.totalEarnings)}
                </div>
              </div>
            </div>

            {/* Aylık Toplam */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-start gap-4 transition-colors duration-300">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg text-emerald-600 dark:text-emerald-400 mt-1">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Bu Ayki Toplam</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{formatDuration(monthlyStats.totalMinutes)}</p>
                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Wallet size={14} />
                  {formatCurrency(monthlyStats.totalEarnings)}
                </div>
              </div>
            </div>

            {/* Aylık Ortalama */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-start gap-4 transition-colors duration-300">
              <div className="bg-violet-100 dark:bg-violet-900/30 p-3 rounded-lg text-violet-600 dark:text-violet-400 mt-1">
                <BarChart2 size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Günlük Ortalama</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{formatDuration(monthlyStats.averageMinutes)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{monthlyStats.daysWorked} iş günü üzerinden</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <div className={`max-w-xs w-full px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
            <div className="flex-1 text-sm leading-tight">
              {toast.message}
            </div>
            <button onClick={clearToast} className="opacity-90 hover:opacity-100 text-white pl-2">
              ✕
            </button>

            
          </div>
        </div>
      )}

      {/* Ayarlar Modalı (root) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Settings size={24} className="text-indigo-600 dark:text-indigo-400" />
                Ayarlar
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Saatlik Ücret */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Wallet size={18} className="text-emerald-600 dark:text-emerald-400" />
                  Saatlik Ücret (€)
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  placeholder="Örn: 12.50"
                  value={settingsForm.hourlyRate}
                  onChange={handleSettingsChange}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Boş bırakırsa ücret hesaplaması yapılmaz</p>
              </div>

              {/* Varsayılan Giriş Saati */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Sun size={18} className="text-amber-600 dark:text-amber-400" />
                  Varsayılan Giriş Saati
                </label>
                <input
                  type="time"
                  name="defaultStartTime"
                  value={settingsForm.defaultStartTime}
                  onChange={handleSettingsChange}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]"
                />
              </div>

              {/* Varsayılan Çıkış Saati */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Moon size={18} className="text-indigo-600 dark:text-indigo-400" />
                  Varsayılan Çıkış Saati
                </label>
                <input
                  type="time"
                  name="defaultEndTime"
                  value={settingsForm.defaultEndTime}
                  onChange={handleSettingsChange}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]"
                />
              </div>

              {/* Varsayılan Tatil Günleri */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Coffee size={18} className="text-amber-600 dark:text-amber-500" />
                  Varsayılan Tatil Günleri
                </label>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                  {dayNames.map((day, index) => (
                    <label key={index} className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded transition-colors">
                      <input 
                        type="checkbox" 
                        name="holidayDays"
                        value={index}
                        checked={settingsForm.holidayDays.includes(index)}
                        onChange={handleSettingsChange}
                        className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 cursor-pointer accent-amber-500 dark:accent-amber-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 p-6 flex gap-3">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                İptal
              </button>
              <button 
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Geliştirici İmzası */}
      <footer className="mt-auto py-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-4 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 opacity-50">
                  <Terminal size={16} />
                  <div className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-600"></div>
                  <Code size={16} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2 tracking-wide">
                 Geliştirici <a target='blank' href='https://www.instagram.com/farukksavur/' className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md shadow-sm border border-indigo-100 dark:border-indigo-800/50">Faruk Savur</a>
              </p>
          </div>
      </footer>

    </div>
  );
}