// src/app/admin/users/page.jsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import useAuthStore from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Search, UserPlus, Mail, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function UsersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user'
  })
  const [formErrors, setFormErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const response = await api.client.get('/users/admin/users/')
      setUsers(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      if (error.response?.status === 403) {
        setErrorMessage('Access denied. You need admin privileges to view users.')
      } else if (error.response?.status === 401) {
        setErrorMessage('Session expired. Please login again.')
        router.push('/login')
      } else {
        setErrorMessage('Failed to load users. Please try again.')
      }
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user && user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchUsers()
  }, [isAuthenticated, user, router, fetchUsers])

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleStatus = async (user) => {
    try {
      const updatedStatus = !user.is_active
      await api.client.patch(`/users/admin/users/${user.id}/`, {
        is_active: updatedStatus 
      })
      // Update UI optimistically
      setUsers(users.map(u => 
        u.id === user.id ? {...u, is_active: updatedStatus} : u
      ))
    } catch (err) {
      console.error('Error updating user status:', err)
      alert('Failed to update user status')
    }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    
    try {
      await api.client.delete(`/users/admin/users/${id}/`)
      setUsers(users.filter(u => u.id !== id))
    } catch (err) {
      console.error('Error deleting user:', err)
      if (err.response?.data?.error) {
        alert(err.response.data.error)
      } else {
        alert('Failed to delete user')
      }
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setFormErrors({})
    setErrorMessage('')
    
    // Validate passwords match
    if (formData.password !== formData.password_confirm) {
      setFormErrors({ password_confirm: 'Passwords do not match' })
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setFormErrors({ password: 'Password must be at least 8 characters long' })
      return
    }

    try {
      setSubmitting(true)
      
      // Use direct API call instead of register method
      // This prevents auto-login and allows setting role
      await api.client.post('/users/auth/register/', {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      })

      // If we need to set role to admin, make another call
      if (formData.role === 'admin') {
        // Fetch the newly created user and update their role
        const usersResponse = await api.client.get('/users/admin/users/')
        const newUser = usersResponse.data.results?.find(u => u.email === formData.email)
        if (newUser) {
          await api.client.patch(`/users/admin/users/${newUser.id}/`, {
            role: 'admin',
            is_staff: true
          })
        }
      }
      
      // Refresh user list
      await fetchUsers()
      
      // Reset form and close dialog
      setFormData({
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'user'
      })
      setShowAddDialog(false)
      
    } catch (err) {
      console.error('Error creating user:', err)
      if (err.response?.data) {
        // Handle validation errors from backend
        const errors = err.response.data
        if (typeof errors === 'object') {
          setFormErrors(errors)
          // Show first error as message
          const firstError = Object.values(errors)[0]
          if (Array.isArray(firstError)) {
            setErrorMessage(firstError[0])
          } else if (typeof firstError === 'string') {
            setErrorMessage(firstError)
          }
        } else if (typeof errors === 'string') {
          setErrorMessage(errors)
        }
      } else {
        setErrorMessage('Failed to create user. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (user) => {
    if (user.is_active) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Active
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
        Inactive
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage your store customers and staff members.
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowAddDialog(true)}
        >
          <UserPlus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    {/* User Info */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name'}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </span>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role || 'user'}
                      </Badge>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>

                    {/* Active Toggle */}
                    <TableCell>
                      <Switch 
                        checked={user.is_active || false} 
                        onCheckedChange={() => handleToggleStatus(user)} 
                      />
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-sm text-gray-600">
                      {user.date_joined 
                        ? new Date(user.date_joined).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for your store.
            </DialogDescription>
          </DialogHeader>
          
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAddUser}>
            <div className="grid gap-4 py-4">
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              {/* Role */}
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
                {formErrors.password && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="grid gap-2">
                <Label htmlFor="password_confirm">Confirm Password *</Label>
                <Input
                  id="password_confirm"
                  type="password"
                  value={formData.password_confirm}
                  onChange={(e) => setFormData({...formData, password_confirm: e.target.value})}
                  required
                />
                {formErrors.password_confirm && (
                  <p className="text-sm text-red-500">{formErrors.password_confirm}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false)
                  setErrorMessage('')
                  setFormErrors({})
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
