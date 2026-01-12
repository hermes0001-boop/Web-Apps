
import React, { useState, useMemo } from 'react';
import { Project, ProjectItem } from '../types';
import { breakdownProject, generateShortSlug } from '../services/geminiService';

interface ProjectViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onUpdateProject: (updatedProject: Project) => void;
  onUpdateProjectItem: (projectId: string, item: ProjectItem) => void;
  onAddProjectItem: (projectId: string, item: ProjectItem) => void;
  onRemoveProjectItem: (projectId: string, itemId: string) => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({ 
  projects, setProjects, onUpdateProject, onUpdateProjectItem, onAddProjectItem, onRemoveProjectItem 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [newProj, setNewProj] = useState({
    title: '',
    description: '',
    term: 'Mid' as 'Mid' | 'Long',
    deadline: '',
    initialItems: ''
  });

  const activeProjects = useMemo(() => {
    // 100% 미만인 활성 프로젝트만 표시
    return projects.filter(p => {
      const total = p.items.length;
      if (total === 0) return true;
      const completed = p.items.filter(i => i.completed).length;
      return total > completed || total === 0;
    });
  }, [projects]);

  function getProgress(project: Project) {
    const total = project.items.length;
    if (total === 0) return 0;
    const completed = project.items.filter(i => i.completed).length;
    return Math.round((completed / total) * 100);
  }

  const addProject = async () => {
    if (!newProj.title.trim()) return;
    const slug = await generateShortSlug(newProj.title);
    const projId = crypto.randomUUID();
    const proj: Project = {
      id: projId,
      title: newProj.title,
      description: newProj.description,
      term: newProj.term,
      deadline: newProj.deadline,
      status: 'In Progress',
      items: [],
      slug: slug
    };
    
    setProjects(prev => [proj, ...prev]);

    newProj.initialItems.split(',').filter(i => i.trim()).forEach(title => {
      onAddProjectItem(projId, { id: crypto.randomUUID(), title: title.trim(), completed: false });
    });

    setShowAddModal(false);
    setNewProj({ title: '', description: '', term: 'Mid', deadline: '', initialItems: '' });
  };

  const handleBreakdown = async (project: Project) => {
    setLoadingId(project.id);
    const steps = await breakdownProject(project);
    steps.forEach(step => {
      onAddProjectItem(project.id, { id: crypto.randomUUID(), title: step, completed: false });
    });
    setLoadingId(null);
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">프로젝트 관리</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Completed projects move to Archives automatically</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <i className="fas fa-plus"></i>
          <span>새 프로젝트</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeProjects.map(p => (
          <ProjectCard 
            key={p.id} 
            project={p} 
            progress={getProgress(p)}
            onBreakdown={() => handleBreakdown(p)} 
            isLoading={loadingId === p.id}
            onUpdateItem={(item) => onUpdateProjectItem(p.id, item)}
            onRemoveItem={(itemId) => onRemoveProjectItem(p.id, itemId)}
            onDelete={() => setProjects(prev => prev.filter(proj => proj.id !== p.id))}
            onAddItem={(title) => onAddProjectItem(p.id, { id: crypto.randomUUID(), title, completed: false })}
            onShare={() => {}}
            onUpdate={(up) => onUpdateProject(up)}
          />
        ))}
        {activeProjects.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-medium">
            진행 중인 프로젝트가 없습니다.
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6 text-slate-900 tracking-tight">새 프로젝트 생성</h3>
            <div className="space-y-4">
              <input type="text" value={newProj.title} onChange={e => setNewProj({...newProj, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl" placeholder="제목" />
              <textarea value={newProj.description} onChange={e => setNewProj({...newProj, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl" placeholder="설명" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <select value={newProj.term} onChange={e => setNewProj({...newProj, term: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <option value="Mid">중기 프로젝트</option>
                  <option value="Long">장기 프로젝트</option>
                </select>
                <input type="date" value={newProj.deadline} onChange={e => setNewProj({...newProj, deadline: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl" />
              </div>
              <input type="text" value={newProj.initialItems} onChange={e => setNewProj({...newProj, initialItems: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl" placeholder="초기 할 일들 (쉼표 구분)" />
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-bold text-slate-500">취소</button>
                <button onClick={addProject} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">프로젝트 시작</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
  progress: number;
  onBreakdown: () => void;
  isLoading: boolean;
  onUpdateItem: (item: ProjectItem) => void;
  onRemoveItem: (itemId: string) => void;
  onDelete: () => void;
  onAddItem: (title: string) => void;
  onShare: () => void;
  onUpdate: (updatedProject: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, progress, onBreakdown, isLoading, onUpdateItem, onRemoveItem, onDelete, onAddItem, onShare, onUpdate 
}) => {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: project.title, description: project.description, deadline: project.deadline });

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative group transition-all">
      <div className="absolute top-5 right-5 z-20 flex items-center space-x-1">
        {!isEditing && (
          <>
            <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-blue-500"><i className="fas fa-pencil text-xs"></i></button>
            <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-500"><i className="fas fa-trash-can text-xs"></i></button>
          </>
        )}
      </div>

      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4 pr-10">
            <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl font-bold" />
            <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl text-xs" rows={2} />
            <input type="date" value={editData.deadline} onChange={e => setEditData({...editData, deadline: e.target.value})} className="w-full bg-slate-50 border p-3 rounded-xl text-xs" />
            <div className="flex space-x-2 pt-2">
              <button onClick={() => { onUpdate({...project, ...editData}); setIsEditing(false); }} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-black">저장</button>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-400 font-bold text-xs">취소</button>
            </div>
          </div>
        ) : (
          <div className="pr-20 mb-6">
            <h4 className="font-bold text-xl truncate text-slate-800">{project.title}</h4>
            <p className="text-xs text-orange-500 font-bold mt-1">{project.deadline ? `Due: ${project.deadline}` : 'No deadline'}</p>
            <p className="text-sm line-clamp-2 mt-3 text-slate-500">{project.description}</p>
          </div>
        )}
        
        {!isEditing && (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Status</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-4 space-y-4 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks</span>
                <button onClick={onBreakdown} disabled={isLoading} className="text-[9px] font-black text-blue-600">
                  <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} mr-1`}></i> AI Breakdown
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {project.items.map(item => (
                  <div key={item.id} className="flex flex-col space-y-1 bg-white p-2 rounded-xl border border-slate-100 group/item shadow-sm">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => onUpdateItem({...item, completed: !item.completed})} className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${item.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                        {item.completed && <i className="fas fa-check text-[8px] text-white"></i>}
                      </button>
                      <input 
                        type="text" value={item.title} 
                        onChange={(e) => onUpdateItem({...item, title: e.target.value})}
                        className={`text-xs flex-1 bg-transparent border-none focus:ring-0 p-0 ${item.completed ? 'line-through text-slate-300' : 'text-slate-700 font-medium'}`}
                      />
                      <button onClick={() => onRemoveItem(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400"><i className="fas fa-times-circle text-xs"></i></button>
                    </div>
                    <div className="flex items-center space-x-2 pl-6">
                      <input 
                        type="date" value={item.deadline || ''} 
                        onChange={(e) => onUpdateItem({...item, deadline: e.target.value})}
                        className="text-[10px] bg-blue-50 border-none rounded p-0.5 px-1 text-blue-600 w-24 focus:ring-0"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if(newItemTitle.trim()) { onAddItem(newItemTitle); setNewItemTitle(''); } }} className="relative">
                <input type="text" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Add task..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100" />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500"><i className="fas fa-plus-circle"></i></button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectView;
