
import React, { useState } from 'react';
import { CalendarEvent, Project, ParaCategory, Task } from '../types';
import { generateSmartMockEvents, smartMapEventsToPara } from '../services/geminiService';

// 외부 리소스 URL 상수화
const GOOGLE_CAL_ICON = "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg";

interface GoogleSyncProps {
  projects: Project[];
  onImportTasks: (tasks: Task[]) => void;
}

const GoogleSync: React.FC<GoogleSyncProps> = ({ projects, onImportTasks }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [mappings, setMappings] = useState<Record<string, { category: ParaCategory, reason: string }>>({});
  const [isMapping, setIsMapping] = useState(false);
  const targetEmail = "hermes0001@gmail.com";
  const today = new Date().toISOString().split('T')[0];

  const syncAccount = async () => {
    setIsSyncing(true);
    const smartEvents = await generateSmartMockEvents(targetEmail, projects);
    setEvents(smartEvents);
    setIsSyncing(false);
  };

  const autoCategorize = async () => {
    if (events.length === 0) return;
    setIsMapping(true);
    const result = await smartMapEventsToPara(events);
    const mappingObj: Record<string, { category: ParaCategory, reason: string }> = {};
    result.forEach(item => {
      mappingObj[item.id] = { category: item.category, reason: item.reason };
    });
    setMappings(mappingObj);
    setIsMapping(false);
  };

  const importAll = () => {
    const newTasks: Task[] = events.map(event => ({
      id: crypto.randomUUID(),
      title: event.summary,
      completed: false,
      category: mappings[event.id]?.category || 'Areas',
      date: today,
      notes: `Imported from Google Calendar (${event.start} - ${event.end})`
    }));
    onImportTasks(newTasks);
    setEvents([]);
    setMappings({});
    alert(`성공적으로 ${newTasks.length}개의 일정을 오늘 할 일로 가져왔습니다!`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
      <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-xl overflow-hidden relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white shadow-lg border border-slate-50 rounded-2xl flex items-center justify-center p-2">
              <img src={GOOGLE_CAL_ICON} className="w-full h-full" alt="Google" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">구글 캘린더 연동</h2>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-sm font-medium text-slate-500">{targetEmail}</p>
              </div>
            </div>
          </div>
          
          {events.length === 0 ? (
            <button 
              onClick={syncAccount}
              disabled={isSyncing}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center space-x-3 disabled:opacity-50"
            >
              {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync"></i>}
              <span>{isSyncing ? '일정 가져오는 중...' : '캘린더 동기화'}</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button 
                onClick={autoCategorize}
                disabled={isMapping}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black border border-blue-100 hover:bg-blue-100 transition-all flex items-center space-x-2"
              >
                {isMapping ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                <span>AI 분류 실행</span>
              </button>
              <button onClick={() => setEvents([])} className="px-4 py-2 text-slate-400 hover:text-slate-600 text-sm">취소</button>
            </div>
          )}
        </header>

        {events.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <i className="fas fa-calendar-alt text-5xl text-slate-200 mb-4 block"></i>
            <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm leading-relaxed">
              <span className="text-slate-900 font-bold">{targetEmail}</span> 계정의 일정을 가져와 PARA 방식으로 자동 정리해보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {events.map(event => (
                <div key={event.id} className="group relative flex items-start space-x-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all">
                  <div className="w-16 flex flex-col items-center justify-center pt-1 flex-shrink-0">
                    <span className="text-[10px] font-black text-blue-600 leading-none">{event.start}</span>
                    <div className="h-4 w-px bg-slate-100 my-1"></div>
                    <span className="text-[10px] text-slate-400 font-bold leading-none">{event.end}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-slate-800 leading-tight truncate pr-2">{event.summary}</h4>
                      {mappings[event.id] && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 ${
                          mappings[event.id].category === 'Projects' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          mappings[event.id].category === 'Areas' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          mappings[event.id].category === 'Resources' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {mappings[event.id].category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={importAll}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center space-x-3"
            >
              <i className="fas fa-file-import"></i>
              <span>모든 일정 가져오기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSync;
