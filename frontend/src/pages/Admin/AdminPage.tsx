import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Settings, Users, Bell, Save, Loader2 } from 'lucide-react'
import { api } from '../../services/api'
import { Table } from '../../components/ui/Table'
import type { Column } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'

type Tab = 'users' | 'system' | 'notifications'
type UserRole = 'ADMIN' | 'TRAFFIC_OPERATOR'

interface User {
  id: number
  name: string
  email: string
  role: string
  password?: string
  avatar?: string | null
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('TRAFFIC_OPERATOR')
  const [password, setPassword] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/api/users')
      const mapped = response.data.map((u: any) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        avatar: null
      }))
      setUsers(mapped)
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.response?.data?.detail || 'Failed to load users from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setName(user.name)
      setEmail(user.email)
      setRole(user.role as UserRole)
      setPassword('')
    } else {
      setEditingUser(null)
      setName('')
      setEmail('')
      setRole('TRAFFIC_OPERATOR')
      setPassword('')
    }
    setIsModalOpen(true)
  }

  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (editingUser) {
        // Edit User
        const payload: any = {
          full_name: name,
          email: email,
          role: role,
        }
        if (password) {
          payload.password = password
        }
        await api.put(`/api/users/${editingUser.id}`, payload)
      } else {
        // Create User
        await api.post('/api/users', {
          full_name: name,
          email: email,
          password: password,
          role: role,
        })
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      console.error('Error saving user:', err)
      alert(err.response?.data?.detail || 'Failed to save user details.')
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/users/${id}`)
        fetchUsers()
      } catch (err: any) {
        console.error('Error deleting user:', err)
        alert(err.response?.data?.detail || 'Failed to delete user.')
      }
    }
  }

  const userColumns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tv-primary/20 text-xs font-bold text-tv-primary">
            {user.name.charAt(0)}
          </div>
          <span className="font-medium">{user.name}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge
          variant={
            user.role === 'ADMIN' ? 'primary' : 'warning'
          }
        >
          {user.role === 'ADMIN' ? 'Admin' : 'Operator'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(user)}
            className="rounded-lg p-1.5 text-tv-muted transition-colors hover:bg-white/[0.08] hover:text-tv-text"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(user.id)}
            className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-tv-text">Admin Control Panel</h1>
        <p className="text-tv-muted">Manage system operators, API configurations, and threshold settings.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/[0.08]">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'users' ? 'border-tv-primary text-tv-primary' : 'border-transparent text-tv-muted hover:text-tv-text'
          }`}
        >
          <Users className="h-4 w-4" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'system' ? 'border-tv-primary text-tv-primary' : 'border-transparent text-tv-muted hover:text-tv-text'
          }`}
        >
          <Settings className="h-4 w-4" />
          System Settings
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'notifications' ? 'border-tv-primary text-tv-primary' : 'border-transparent text-tv-muted hover:text-tv-text'
          }`}
        >
          <Bell className="h-4 w-4" />
          Notification Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
                </div>
                <Button onClick={() => handleOpenModal()} icon={<Plus className="h-4 w-4" />} fullWidth={false}>
                  Add User
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-tv-primary" />
                </div>
              ) : (
                <Table columns={userColumns} data={users} keyExtractor={(u) => u.id} />
              )}
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="tv-glass rounded-2xl p-6 space-y-6"
            >
              <h3 className="text-lg font-semibold text-tv-text mb-4">API & Integrations</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <Input label="Traffic Data Provider API Key" type="password" placeholder="sk-..." defaultValue="sk-mock-12345" />
                <Input label="Weather Service API Key" type="password" placeholder="sk-..." defaultValue="sk-weather-123" />
                <Input label="Server Endpoint URL" type="url" placeholder="https://" defaultValue="https://api.trafficvision.ai/v1" />
              </div>
              
              <h3 className="text-lg font-semibold text-tv-text mt-8 mb-4">Global Thresholds</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <Input label="High Congestion Alert Threshold (%)" type="number" defaultValue={75} />
                <Input label="Critical Speed Alert (km/h below avg)" type="number" defaultValue={15} />
              </div>

              <div className="pt-4 flex justify-end">
                <Button icon={<Save className="h-4 w-4" />} fullWidth={false}>Save Settings</Button>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="tv-glass rounded-2xl p-6 space-y-6"
            >
               <h3 className="text-lg font-semibold text-tv-text mb-4">Global Alert Preferences</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                    <div>
                      <h4 className="font-medium text-tv-text">Critical Incident Emails</h4>
                      <p className="text-sm text-tv-muted mt-1">Send emails to all operators when a critical incident occurs.</p>
                    </div>
                    {/* Simulated Toggle */}
                    <div className="w-12 h-6 bg-tv-primary rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                    <div>
                      <h4 className="font-medium text-tv-text">Daily Analytics Digest</h4>
                      <p className="text-sm text-tv-muted mt-1">Automated daily reports summarizing traffic flow and predictions.</p>
                    </div>
                    {/* Simulated Toggle */}
                    <div className="w-12 h-6 bg-white/20 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
               </div>
               <div className="pt-4 flex justify-end">
                <Button icon={<Save className="h-4 w-4" />} fullWidth={false}>Save Preferences</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSaveUser} className="space-y-4 pt-2">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-tv-text">Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="tv-focus-ring h-12 w-full rounded-xl border border-white/[0.08] bg-tv-bg/60 px-4 text-[15px] font-normal text-tv-text focus:outline-none focus:border-tv-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
            >
              <option value="TRAFFIC_OPERATOR">Traffic Operator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!editingUser} />
          
          <div className="pt-4 flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} fullWidth={false}>Cancel</Button>
            <Button type="submit" fullWidth={false}>{editingUser ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default AdminPage
