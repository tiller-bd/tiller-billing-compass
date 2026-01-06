export interface Department {
  id: number;
  name: string;
  description: string | null;
}

export const departmentsData: Department[] = [
  { id: 1, name: 'Software Development', description: 'Custom software and web application development' },
  { id: 2, name: 'Planning & Development', description: 'Infrastructure planning and development consulting' },
];
