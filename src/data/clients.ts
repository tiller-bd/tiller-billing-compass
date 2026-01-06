export interface Client {
  id: number;
  name: string;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export const clientsData: Client[] = [
  { id: 1, name: 'Ministry of ICT', contact_person: 'Mr. Rahman', contact_email: 'rahman@moict.gov.bd', contact_phone: '+880-2-123456' },
  { id: 2, name: 'Dhaka North City Corp', contact_person: 'Ms. Begum', contact_email: 'begum@dncc.gov.bd', contact_phone: '+880-2-234567' },
  { id: 3, name: 'Bangladesh Trade Corp', contact_person: 'Mr. Khan', contact_email: 'khan@btc.gov.bd', contact_phone: '+880-2-345678' },
  { id: 4, name: 'First National Bank', contact_person: 'Mr. Ahmed', contact_email: 'ahmed@fnb.com.bd', contact_phone: '+880-2-456789' },
  { id: 5, name: 'FAO Bangladesh', contact_person: 'Dr. Islam', contact_email: 'islam@fao.org', contact_phone: '+880-2-567890' },
];
