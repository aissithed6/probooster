"use client"

import { useState, useEffect } from 'react'
import { 
  Users, UserPlus, UserCheck, UserX, Shield, 
  Search, Filter, MoreHorizontal, Eye, Edit,
  Trash2, CheckCircle, XCircle, Clock, Star,
  Mail, Phone, MapPin, Calendar, Activity,
  Settings, Lock, Key, Plus, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'buyer' | 'vendor' | 'admin' | 'super_admin'
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'verified'
  type: 'buyer' | 'vendor' | 'admin'
  joinDate: string
  lastActive: string
  totalOrders: number
  totalSpent: number
  totalEarnings: number
  rating: number
  isVerified: boolean
  has2FA: boolean
  location: string
  avatar?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // États pour la création/édition d'utilisateur
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'buyer' as const,
    type: 'buyer' as const,
    location: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    // Simulation du chargement des utilisateurs
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        phone: '+225 01234567',
        role: 'buyer',
        status: 'active',
        type: 'buyer',
        joinDate: '2024-01-15',
        lastActive: '2024-12-19 14:30',
        totalOrders: 25,
        totalSpent: 150000,
        totalEarnings: 0,
        rating: 4.8,
        isVerified: true,
        has2FA: true,
        location: 'Abidjan, Côte d\'Ivoire'
      },
      {
        id: '2',
        name: 'TechStore Pro',
        email: 'contact@techstore.ci',
        phone: '+225 08765432',
        role: 'vendor',
        status: 'pending',
        type: 'vendor',
        joinDate: '2024-12-18',
        lastActive: '2024-12-19 10:15',
        totalOrders: 0,
        totalSpent: 0,
        totalEarnings: 0,
        rating: 0,
        isVerified: false,
        has2FA: false,
        location: 'Abidjan, Côte d\'Ivoire'
      }
    ]

    setUsers(mockUsers)
    setFilteredUsers(mockUsers)
  }, [])

  // Filtrage des utilisateurs
  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter, roleFilter])

  const handleCreateUser = () => {
    console.log('Création utilisateur:', userForm)
    setIsCreateModalOpen(false)
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'buyer',
      type: 'buyer',
      location: '',
      password: '',
      confirmPassword: ''
    })
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      type: user.type,
      location: user.location,
      password: '',
      confirmPassword: ''
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateUser = () => {
    console.log('Mise à jour utilisateur:', selectedUser?.id, userForm)
    setIsEditModalOpen(false)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter(user => user.id !== userId))
    }
  }

  const handleStatusChange = (userId: string, newStatus: User['status']) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
  }

  const handleRoleChange = (userId: string, newRole: User['role']) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ))
  }

  const exportUsers = () => {
    console.log('Export des utilisateurs')
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la gestion des utilisateurs */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion Complète des Utilisateurs</h2>
            <p className="text-gray-600 mt-2">
              Création, modification, suppression et gestion des rôles et permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Créer Utilisateur
            </Button>
            <Button variant="outline" onClick={exportUsers}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="verified">Vérifié</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="buyer">Acheteur</SelectItem>
                <SelectItem value="vendor">Vendeur</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Tous ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="buyers">Acheteurs</TabsTrigger>
          <TabsTrigger value="vendors">Vendeurs</TabsTrigger>
          <TabsTrigger value="admins">Administrateurs</TabsTrigger>
          <TabsTrigger value="pending">En Attente</TabsTrigger>
          <TabsTrigger value="suspended">Suspendus</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <UserList 
            users={filteredUsers}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="buyers" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.role === 'buyer')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.role === 'vendor')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.role === 'admin' || u.role === 'super_admin')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.status === 'pending')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="suspended" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.status === 'suspended')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modals seront ajoutés dans la prochaine partie */}
    </div>
  )
}

// Composant de liste des utilisateurs
interface UserListProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
  onStatusChange: (userId: string, status: User['status']) => void
  onRoleChange: (userId: string, role: User['role']) => void
  onView: (user: User) => void
}

function UserList({ users, onEdit, onDelete, onStatusChange, onRoleChange, onView }: UserListProps) {
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    {getStatusBadge(user.status)}
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{user.email}</span>
                    <span>{user.phone}</span>
                    <span>{user.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onView(user)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(user.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {users.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-600">Aucun utilisateur ne correspond aux critères de recherche.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Fonctions utilitaires pour les badges
function getStatusBadge(status: string) {
  switch (status) {
    case 'active': return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>
    case 'inactive': return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactif</Badge>
    case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>
    case 'suspended': return <Badge className="bg-red-100 text-red-800 border-red-200">Suspendu</Badge>
    case 'verified': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Vérifié</Badge>
    default: return <Badge variant="outline">Inconnu</Badge>
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'buyer': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Acheteur</Badge>
    case 'vendor': return <Badge className="bg-green-100 text-green-800 border-green-200">Vendeur</Badge>
    case 'admin': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>
    case 'super_admin': return <Badge className="bg-red-100 text-red-800 border-red-200">Super Admin</Badge>
    default: return <Badge variant="outline">Inconnu</Badge>
  }
}
