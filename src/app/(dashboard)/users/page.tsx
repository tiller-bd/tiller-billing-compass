// src/app/users/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Shield, ShieldOff, Trash2, MoreHorizontal, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSharedFilters } from '@/contexts/FilterContext';
import { SortableHeader, useSorting } from '@/components/ui/sortable-header';

export default function Users() {
  const { debouncedSearch } = useSharedFilters();
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ name: '', email: '', role: 'USER' as UserRole, password: '' });

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  const loadUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => { loadUsers(); }, []);

  // Filter users based on header search
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [users, debouncedSearch]);

  // Sorting
  const { sortedData, sortConfig, handleSort } = useSorting(filteredUsers);

  const handleToggleSuspend = async (user: User) => {
    if (!isSuperAdmin) return;
    const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !user.is_active })
    });
    if (res.ok) {
        toast({ title: user.is_active ? 'User Suspended' : 'User Activated' });
        loadUsers();
    }
  };

  const handleDelete = async (id: number) => {
    if (!isSuperAdmin || id === currentUser?.id) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
        toast({ title: 'User Removed' });
        loadUsers();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast({ title: 'User Created Successfully' });
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', role: 'USER', password: '' });
      loadUsers();
    }
    setLoading(false);
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUserForPassword(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setIsPasswordDialogOpen(true);
  };

  const canChangePassword = (user: User) => {
    // Super admin can change anyone's password
    // Regular user can only change their own password
    return isSuperAdmin || user.id === currentUser?.id;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUserForPassword.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.newPassword })
      });

      if (res.ok) {
        toast({ title: 'Password Changed Successfully' });
        setIsPasswordDialogOpen(false);
        setSelectedUserForPassword(null);
        setPasswordData({ newPassword: '', confirmPassword: '' });
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Failed to change password', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to change password', variant: 'destructive' });
    }
    setPasswordLoading(false);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Members</h1>
          {isSuperAdmin && (
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2"><UserPlus className="w-4 h-4" /> Add Member</Button>
          )}
        </div>

        {/* Search is in header */}
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader label="User" sortKey="full_name" currentSort={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Email" sortKey="email" currentSort={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Role" sortKey="role" currentSort={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Status" sortKey="is_active" currentSort={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant={user.role === 'SUPERADMIN' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                  <TableCell>
                    <Badge className={user.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>
                        {user.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canChangePassword(user) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                            <KeyRound className="w-4 h-4 mr-2" />
                            Change Password
                          </DropdownMenuItem>
                          {isSuperAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => handleToggleSuspend(user)} disabled={user.id === currentUser?.id}>
                                {user.is_active ? <ShieldOff className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                                {user.is_active ? 'Suspend' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(user.id)} disabled={user.id === currentUser?.id} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Member Account</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Full Name</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email Address</Label><Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Set Password</Label><Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>System Role</Label>
              <Select value={formData.role} onValueChange={(v: UserRole) => setFormData({...formData, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="USER">User</SelectItem><SelectItem value="SUPERADMIN">Super Admin</SelectItem></SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={loading}>{loading ? 'Creating...' : 'Register User'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Change Password {selectedUserForPassword && selectedUserForPassword.id !== currentUser?.id && (
                <span className="text-muted-foreground font-normal">for {selectedUserForPassword.full_name}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={passwordData.newPassword}
                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
              />
            </div>
            {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={passwordLoading || passwordData.newPassword !== passwordData.confirmPassword}
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}