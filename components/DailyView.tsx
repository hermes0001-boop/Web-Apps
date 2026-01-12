
import React, { useState, useMemo } from 'react';
import { Task, ParaCategory } from '../types';
import { categorizeTask, summarizeLink, generateShortSlug } from '../services/geminiService';

interface DailyViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onAddTask: (title: string, category: ParaCategory, date: string, metadata?: Task['linkMetadata']) => void;
}

const DailyView: React.FC<DailyViewProps> = ({ tasks, setTasks, onAddTask }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [manualCategory, setManualCategory] = useState<ParaCategory | 'Auto'>('Auto');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => task.date === selectedDate);
  }, [tasks, selectedDate]);

  const isUrl = (text: string) => text.startsWith('http');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let finalCategory: ParaCategory;
    let linkMeta: Task['linkMetadata'] | undefined = undefined;

    setIsAiLoading(true);

    if (isUrl(newTaskTitle)) {
      try {
        const urlObj = new URL(newTaskTitle);
        const domain = urlObj.hostname.replace('www.', '');
        const [displayTitle, slug] = await Promise.all([
          summarizeLink(newTaskTitle),
          generateShortSlug(newTaskTitle)
        ]);
        
        linkMeta = {
          displayTitle,
          domain,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          slug,
          isPinned: false
        };
        finalCategory = manualCategory === 'Auto' ? 'Resources' : manualCategory;
      } catch (e) {
        finalCategory = manualCategory === 'Auto' ? await categorizeTask(newTaskTitle) : manualCategory;
      }
    } else {
      finalCategory = manualCategory === 'Auto' ? await categorizeTask(newTaskTitle) : manualCategory;
    }
    
    onAddTask(newTaskTitle, finalCategory, selectedDate, linkMeta);
    setNewTaskTitle('');
    setIsAiLoading(false);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task?.category === 'Resources') return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const categories: ParaCategory[] = ['Projects', 'Areas', 'Resources', 'Archives'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            {selectedDate === new Date().toISOString().split('T')[0] ? "오늘" : 
            new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </h2>
          <p className="text-slate-500 mt-1 font-medium italic">PARA Intelligence & Knowledge Vault</p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
          />
        </div>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 px-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setManualCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                manualCategory === cat 
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleAddTask} className="relative group">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="정보, 할 일 또는 URL을 입력하세요..."
            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 pr-16 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 placeholder:text-slate-400 text-base"
            disabled={isAiLoading}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-white rounded-xl disabled:opacity-50"
            disabled={isAiLoading}
          >
            {isAiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map(cat => {
          const catTasks = filteredTasks.filter(t => t.category === cat);
          return (
            <div key={cat} className="flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                <h3 className={`font-bold flex items-center space-x-2 text-sm uppercase tracking-tighter ${
                  cat === 'Projects' ? 'text-orange-500' :
                  cat === 'Areas' ? 'text-blue-500' :
                  cat === 'Resources' ? 'text-emerald-500' : 'text-slate-400'
                }`}>
                  <span>{cat}</span>
                </h3>
              </div>
              
              <div className="space-y-2">
                {catTasks.map(task => {
                  const url = isUrl(task.title);
                  const isResources = task.category === 'Resources';
                  const isArchivedProject = task.category === 'Archives' && task.archivedItems;

                  return (
                    <div 
                      key={task.id}
                      onClick={() => !isResources && !isArchivedProject && toggleTask(task.id)}
                      className={`relative p-4 rounded-2xl border transition-all flex flex-col space-y-2 group ${
                        !isResources && task.completed 
                          ? 'bg-slate-50 border-slate-100 opacity-80' 
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isResources && (
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            task.completed ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                          }`}>
                            {task.completed && <i className="fas fa-check text-[8px] text-white"></i>}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {url ? (
                            <a 
                              href={task.title} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-blue-600 hover:underline break-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {task.linkMetadata?.displayTitle || task.title}
                            </a>
                          ) : (
                            <span className={`text-sm break-words font-medium ${!isResources && task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                              {task.title}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => deleteTask(e, task.id)}
                          className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <i className="fas fa-trash-can text-xs"></i>
                        </button>
                      </div>

                      {/* 아카이브된 프로젝트 상세 보기 */}
                      {isArchivedProject && (
                        <>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setExpandedArchiveId(expandedArchiveId === task.id ? null : task.id); 
                            }}
                            className="mt-1 text-[10px] font-black text-slate-400 hover:text-blue-500 flex items-center space-x-1 transition-colors w-fit"
                          >
                            <i className={`fas ${expandedArchiveId === task.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                            <span>{expandedArchiveId === task.id ? '상세 닫기' : '세부 내용 및 Task 보기'}</span>
                          </button>

                          {expandedArchiveId === task.id && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-1">
                              <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">설명</span>
                                <p className="text-[11px] text-slate-600 leading-relaxed">{task.notes || '설명이 없습니다.'}</p>
                              </div>
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">수행한 할 일 목록</span>
                                <div className="space-y-1">
                                  {task.archivedItems?.map(item => (
                                    <div key={item.id} className="flex items-center space-x-2">
                                      <i className="fas fa-check-circle text-[10px] text-emerald-500/60"></i>
                                      <span className="text-[10px] text-slate-500 line-through truncate">{item.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                {catTasks.length === 0 && (
                  <p className="text-[10px] text-slate-300 italic text-center py-2 font-medium">비어있음</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyView;
