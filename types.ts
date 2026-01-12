
export type ParaCategory = 'Projects' | 'Areas' | 'Resources' | 'Archives';

export interface ProjectItem {
  id: string;
  title: string;
  completed: boolean;
  deadline?: string; // YYYY-MM-DD
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: ParaCategory;
  date: string; // YYYY-MM-DD format
  dueDate?: string;
  notes?: string;
  projectId?: string; // 연동된 프로젝트 ID
  projectItemId?: string; // 연동된 프로젝트 내 항목 ID
  archivedItems?: ProjectItem[]; // 아카이브된 프로젝트의 세부 항목들
  linkMetadata?: {
    displayTitle?: string;
    domain?: string;
    favicon?: string;
    slug?: string;
    isPinned?: boolean;
  };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'In Progress' | 'On Hold' | 'Completed';
  term: 'Mid' | 'Long';
  deadline: string;
  items: ProjectItem[];
  slug?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
}
