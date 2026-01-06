// Mock API functions - replace with actual database calls later
import { usersData, userPasswords } from './users';
import { projectsData } from './projects';
import { clientsData, Client } from './clients';
import { departmentsData, Department } from './departments';
import { categoriesData, Category } from './categories';
import { User, Project, Bill } from '@/types';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Users API
export async function fetchUsers(): Promise<User[]> {
  await delay(100);
  return [...usersData];
}

export async function validateLogin(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  await delay(200);
  const user = usersData.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (user.suspended) {
    return { success: false, error: 'Account is suspended. Contact administrator.' };
  }
  
  const correctPassword = userPasswords[user.email];
  if (password !== correctPassword) {
    return { success: false, error: 'Invalid password' };
  }
  
  return { success: true, user };
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  await delay(200);
  const newUser: User = {
    ...userData,
    id: String(usersData.length + 1),
    createdAt: new Date(),
  };
  usersData.push(newUser);
  return newUser;
}

// Projects API
export async function fetchProjects(): Promise<Project[]> {
  await delay(100);
  return [...projectsData];
}

export async function createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'phases' | 'bills'>): Promise<Project> {
  await delay(200);
  const newProject: Project = {
    ...projectData,
    id: String(projectsData.length + 1),
    createdAt: new Date(),
    phases: [],
    bills: [],
  };
  projectsData.push(newProject);
  return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  await delay(200);
  const index = projectsData.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  projectsData[index] = { ...projectsData[index], ...updates };
  return projectsData[index];
}

// Bills API
export async function fetchBills(): Promise<Array<Bill & { projectName: string }>> {
  await delay(100);
  const bills: Array<Bill & { projectName: string }> = [];
  
  projectsData.forEach(project => {
    project.bills.forEach(bill => {
      bills.push({
        ...bill,
        projectName: project.name,
      });
    });
  });
  
  return bills;
}

export async function createBill(projectId: string, billData: Omit<Bill, 'id' | 'projectId' | 'createdAt'>): Promise<Bill | null> {
  await delay(200);
  const project = projectsData.find(p => p.id === projectId);
  if (!project) return null;
  
  const newBill: Bill = {
    ...billData,
    id: `b${projectId}-${project.bills.length + 1}`,
    projectId,
    createdAt: new Date(),
  };
  project.bills.push(newBill);
  return newBill;
}

// Clients API
export async function fetchClients(): Promise<Client[]> {
  await delay(100);
  return [...clientsData];
}

export async function createClient(clientData: Omit<Client, 'id'>): Promise<Client> {
  await delay(200);
  const newClient: Client = {
    ...clientData,
    id: clientsData.length + 1,
  };
  clientsData.push(newClient);
  return newClient;
}

// Departments API
export async function fetchDepartments(): Promise<Department[]> {
  await delay(100);
  return [...departmentsData];
}

// Categories API
export async function fetchCategories(): Promise<Category[]> {
  await delay(100);
  return [...categoriesData];
}
