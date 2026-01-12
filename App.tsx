
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import DailyView from './components/DailyView';
import ProjectView from './components/ProjectView';
import GoogleSync from './components/GoogleSync';
import Login from './components/Login';
import { Task, Project, ParaCategory, ProjectItem } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const today = new Date().toISOString().split('T')[0];
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('para_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('para_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const handleLogin = (password: string) => {
    setIsLoggedIn(true);
  };

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('para_tasks', JSON.stringify(tasks));
      localStorage.setItem('para_projects', JSON.stringify(projects));
    }
  }, [tasks, projects, isLoggedIn]);

  // 프로젝트가 100% 완료되었는지 체크하고 Archives로 이동시키는 함수
  const checkAndArchiveProject = useCallback((project: Project) => {
    const total = project.items.length;
    if (total === 0) return false;
    const completed = project.items.filter(i => i.completed).length;
    const isFinished = total > 0 && total === completed;

    if (isFinished) {
      const archiveTask: Task = {
        id: crypto.randomUUID(),
        title: `[Archived Project] ${project.title}`,
        completed: true,
        category: 'Archives',
        date: new Date().toISOString().split('T')[0],
        notes: project.description,
        archivedItems: [...project.items], // 세부 항목 복사하여 저장
        projectId: project.id
      };
      
      setTasks(prev => [archiveTask, ...prev]);
      setProjects(prev => prev.filter(p => p.id !== project.id));
      alert(`'${project.title}' 프로젝트가 완료되어 Archives로 이동되었습니다. 상세 내용은 Daily 탭에서 확인 가능합니다.`);
      return true;
    }
    return false;
  }, []);

  const syncProjectItemToDaily = useCallback((projectId: string, projectTitle: string, item: ProjectItem) => {
    setTasks(prevTasks => {
      const existingTaskIndex = prevTasks.findIndex(t => t.projectItemId === item.id);
      if (!item.deadline) {
        if (existingTaskIndex > -1) {
          return prevTasks.filter(t => t.projectItemId !== item.id);
        }
        return prevTasks;
      }

      const updatedTask: Task = {
        id: existingTaskIndex > -1 ? prevTasks[existingTaskIndex].id : crypto.randomUUID(),
        title: `[${projectTitle}] ${item.title}`,
        completed: item.completed,
        category: 'Areas',
        date: item.deadline,
        projectId: projectId,
        projectItemId: item.id,
        notes: `연동됨`
      };

      if (existingTaskIndex > -1) {
        const newTasks = [...prevTasks];
        newTasks[existingTaskIndex] = updatedTask;
        return newTasks;
      } else {
        return [updatedTask, ...prevTasks];
      }
    });
  }, []);

  const handleUpdateProject = (updatedProject: Project) => {
    if (!checkAndArchiveProject(updatedProject)) {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      updatedProject.items.forEach(item => {
        syncProjectItemToDaily(updatedProject.id, updatedProject.title, item);
      });
    }
  };

  const handleUpdateProjectItem = (projectId: string, item: ProjectItem) => {
    setProjects(prev => {
      const proj = prev.find(p => p.id === projectId);
      if (!proj) return prev;
      
      const updatedItems = proj.items.map(i => i.id === item.id ? item : i);
      const updatedProj = { ...proj, items: updatedItems };
      
      const total = updatedProj.items.length;
      const completed = updatedProj.items.filter(i => i.completed).length;
      
      if (total > 0 && total === completed) {
        setTimeout(() => checkAndArchiveProject(updatedProj), 100);
        return prev.filter(p => p.id !== projectId);
      }

      syncProjectItemToDaily(projectId, proj.title, item);
      return prev.map(p => p.id === projectId ? updatedProj : p);
    });
  };

  const handleAddProjectItem = (projectId: string, item: ProjectItem) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      syncProjectItemToDaily(projectId, p.title, item);
      return { ...p, items: [...p.items, item] };
    }));
  };

  const handleRemoveProjectItem = (projectId: string, itemId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      setTasks(prevTasks => prevTasks.filter(t => t.projectItemId !== itemId));
      return { ...p, items: p.items.filter(i => i.id !== itemId) };
    }));
  };

  const addNewTask = (title: string, category: ParaCategory, date: string, metadata?: Task['linkMetadata']) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      category,
      date,
      linkMetadata: metadata
    };
    setTasks(prev => [newTask, ...prev]);

    if (category === 'Projects') {
      const alreadyExists = projects.some(p => p.title.toLowerCase() === title.toLowerCase());
      if (!alreadyExists) {
        setProjects(prev => [{
          id: crypto.randomUUID(),
          title: title,
          description: 'Daily Projects에서 자동 생성됨.',
          status: 'In Progress',
          term: 'Mid',
          deadline: '', 
          slug: metadata?.slug || title.toLowerCase().replace(/\s+/g, '-'),
          items: []
        }, ...prev]);
      }
    }
  };

  const pinnedLinks = useMemo(() => tasks.filter(t => t.linkMetadata?.isPinned), [tasks]);

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsLoggedIn(false)} pinnedLinks={pinnedLinks}>
      {activeTab === 'daily' && <DailyView tasks={tasks} setTasks={setTasks} onAddTask={addNewTask} />}
      {activeTab === 'projects' && (
        <ProjectView 
          projects={projects} 
          setProjects={setProjects} 
          onUpdateProject={handleUpdateProject}
          onUpdateProjectItem={handleUpdateProjectItem}
          onAddProjectItem={handleAddProjectItem}
          onRemoveProjectItem={handleRemoveProjectItem}
        />
      )}
      {activeTab === 'google' && <GoogleSync projects={projects} onImportTasks={(ts) => setTasks(prev => [...ts, ...prev])} />}
    </Layout>
  );
};

export default App;
