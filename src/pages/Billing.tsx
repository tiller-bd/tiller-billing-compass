import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Receipt, Calendar, DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

// Mock bills data matching the schema
const mockBillsData = [
  {
    id: 1,
    project: { id: 1, name: 'E-Government Portal' },
    sl_no: 'B-001',
    bill_name: 'Inception Payment',
    bill_percent: 10,
    bill_amount: 1500000,
    tentative_billing_date: '2024-07-15',
    received_percent: 10,
    received_amount: 1500000,
    received_date: '2024-07-20',
    remaining_amount: 0,
    vat: 75000,
    it: 15000,
    status: 'PAID',
  },
  {
    id: 2,
    project: { id: 1, name: 'E-Government Portal' },
    sl_no: 'B-002',
    bill_name: 'Deliverable 1 Payment',
    bill_percent: 25,
    bill_amount: 3750000,
    tentative_billing_date: '2024-09-15',
    received_percent: 25,
    received_amount: 3750000,
    received_date: '2024-09-25',
    remaining_amount: 0,
    vat: 187500,
    it: 37500,
    status: 'PAID',
  },
  {
    id: 3,
    project: { id: 1, name: 'E-Government Portal' },
    sl_no: 'B-003',
    bill_name: 'Deliverable 2 Payment',
    bill_percent: 25,
    bill_amount: 3750000,
    tentative_billing_date: '2025-01-15',
    received_percent: 0,
    received_amount: 0,
    received_date: null,
    remaining_amount: 3750000,
    vat: 0,
    it: 0,
    status: 'PENDING',
  },
  {
    id: 4,
    project: { id: 2, name: 'Smart City Infrastructure' },
    sl_no: 'B-004',
    bill_name: 'Inception Payment',
    bill_percent: 15,
    bill_amount: 3750000,
    tentative_billing_date: '2024-04-30',
    received_percent: 15,
    received_amount: 3750000,
    received_date: '2024-05-10',
    remaining_amount: 0,
    vat: 187500,
    it: 37500,
    status: 'PAID',
  },
  {
    id: 5,
    project: { id: 2, name: 'Smart City Infrastructure' },
    sl_no: 'B-005',
    bill_name: 'Phase 1 Payment',
    bill_percent: 30,
    bill_amount: 7500000,
    tentative_billing_date: '2024-08-15',
    received_percent: 30,
    received_amount: 7500000,
    received_date: '2024-08-20',
    remaining_amount: 0,
    vat: 375000,
    it: 75000,
    status: 'PAID',
  },
  {
    id: 6,
    project: { id: 2, name: 'Smart City Infrastructure' },
    sl_no: 'B-006',
    bill_name: 'Phase 2 Payment',
    bill_percent: 30,
    bill_amount: 7500000,
    tentative_billing_date: '2025-01-10',
    received_percent: 10,
    received_amount: 2500000,
    received_date: '2025-01-05',
    remaining_amount: 5000000,
    vat: 125000,
    it: 25000,
    status: 'PARTIAL',
  },
  {
    id: 7,
    project: { id: 5, name: 'Agricultural Data System' },
    sl_no: 'B-007',
    bill_name: 'Inception Payment',
    bill_percent: 15,
    bill_amount: 1800000,
    tentative_billing_date: '2024-09-15',
    received_percent: 15,
    received_amount: 1800000,
    received_date: '2024-09-20',
    remaining_amount: 0,
    vat: 90000,
    it: 18000,
    status: 'PAID',
  },
  {
    id: 8,
    project: { id: 5, name: 'Agricultural Data System' },
    sl_no: 'B-008',
    bill_name: 'Development Phase',
    bill_percent: 45,
    bill_amount: 5400000,
    tentative_billing_date: '2025-02-15',
    received_percent: 0,
    received_amount: 0,
    received_date: null,
    remaining_amount: 5400000,
    vat: 0,
    it: 0,
    status: 'PENDING',
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PAID': return <CheckCircle2 className="w-4 h-4" />;
    case 'PARTIAL': return <Clock className="w-4 h-4" />;
    case 'PENDING': return <AlertCircle className="w-4 h-4" />;
    default: return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAID': return 'bg-success/10 text-success';
    case 'PARTIAL': return 'bg-warning/10 text-warning';
    case 'PENDING': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function Billing() {
  const [currentPath, setCurrentPath] = useState('/billing');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const filteredBills = mockBillsData.filter(bill => {
    const matchesSearch = bill.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.bill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.sl_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totals = mockBillsData.reduce((acc, bill) => ({
    total: acc.total + bill.bill_amount,
    received: acc.received + bill.received_amount,
    pending: acc.pending + bill.remaining_amount,
  }), { total: 0, received: 0, pending: 0 });

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    navigate(path);
  };

  return (
    <DashboardLayout
      title="Billing"
      currentPath={currentPath}
      onNavigate={handleNavigate}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing</h1>
            <p className="text-muted-foreground">Track all project bills and payments</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Bill
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Billed</p>
                <p className="text-xl font-bold">{formatCurrency(totals.total)}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totals.received)}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(totals.pending)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search bills, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Bills Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Bill Amount</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill, index) => (
                <motion.tr
                  key={bill.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted/50 cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{bill.bill_name}</p>
                        <p className="text-xs text-muted-foreground">{bill.sl_no}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{bill.project.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(bill.tentative_billing_date).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{formatCurrency(bill.bill_amount)}</span>
                      <span className="text-xs text-muted-foreground">({bill.bill_percent}%)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-success font-medium">
                      {formatCurrency(bill.received_amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={bill.remaining_amount > 0 ? 'text-warning font-medium' : 'text-muted-foreground'}>
                      {formatCurrency(bill.remaining_amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`gap-1 ${getStatusColor(bill.status)}`}>
                      {getStatusIcon(bill.status)}
                      {bill.status}
                    </Badge>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {filteredBills.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No bills found matching your criteria.
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
