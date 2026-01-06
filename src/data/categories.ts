export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export const categoriesData: Category[] = [
  { id: 1, name: 'Web Application', description: 'Web-based software applications' },
  { id: 2, name: 'Infrastructure', description: 'Infrastructure projects' },
  { id: 3, name: 'Mobile Application', description: 'Mobile app development' },
];
