import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Shield, ShieldOff, Trash2, MoreHorizontal, User as UserIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUsers, createUser } from '@/data/api';
import { User, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Users() {
  const [currentPath, setCurrentPath] = useState('/users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER' as UserRole,
  });

  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const usersData = await fetchUsers();
    setUsers(usersData);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSuspend = (userId: string) => {
    if (!isSuperAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only Super Admin can manage users.',
        variant: 'destructive',
      });
      return;
    }

    setUsers(users.map(u => 
      u.id === userId ? { ...u, suspended: !u.suspended } : u
    ));

    const user = users.find(u => u.id === userId);
    toast({
      title: user?.suspended ? 'User Activated' : 'User Suspended',
      description: `${user?.name} has been ${user?.suspended ? 'activated' : 'suspended'}.`,
    });
  };

  const handleDelete = (userId: string) => {
    if (!isSuperAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only Super Admin can delete users.',
        variant: 'destructive',
      });
      return;
    }

    if (userId === currentUser?.id) {
      toast({
        title: 'Cannot Delete',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      return;
    }

    const user = users.find(u => u.id === userId);
    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: 'User Deleted',
      description: `${user?.name} has been removed from the system.`,
    });
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    navigate(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    const newUser = await createUser({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      suspended: false,
    });

    if (newUser) {
      toast({
        title: 'User Created',
        description: 'New user has been added successfully',
      });
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', role: 'USER' });
      loadUsers();
    }
    
    setLoading(false);
  };

  return (
    <DashboardLayout
      title="Users"
      currentPath={currentPath}
      onNavigate={handleNavigate}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">
              {isSuperAdmin ? 'Create, manage and suspend user accounts' : 'View user accounts'}
            </p>
          </div>
          {isSuperAdmin && (
            <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          )}
        </div>

        {/* Access Notice for non-admins */}
        {!isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 border-l-4 border-warning"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium text-foreground">View Only Access</p>
                <p className="text-sm text-muted-foreground">
                  Only Super Admins can create, suspend, or delete users.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                {isSuperAdmin && <TableHead className="w-[60px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'SUPERADMIN' ? 'default' : 'secondary'}
                      className="gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      {user.role === 'SUPERADMIN' ? 'Super Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={user.suspended 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-success/10 text-success'
                      }
                    >
                      {user.suspended ? 'Suspended' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleToggleSuspend(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            {user.suspended ? (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Activate User
                              </>
                            ) : (
                              <>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Suspend User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user.id)}
                            disabled={user.id === currentUser?.id}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </motion.div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Enter user name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
