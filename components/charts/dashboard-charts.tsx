"use client"

import { useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Activity, Gift, Share2, Package, MessageCircle } from 'lucide-react'

// Données mockées pour les graphiques
const pointsData: any[] = []

const sharesData: any[] = []

const ordersData: any[] = []

const activityData: any[] = []

const performanceData: any[] = []

interface ChartProps {
  title: string
  description?: string
  className?: string
}

type PointsChartItem = {
  date: string
  points: number
  earned: number
  used: number
}

type SharesChartItem = {
  platform: string
  shares: number
  points: number
  color: string
}

type OrdersChartItem = {
  month: string
  orders: number
  revenue: number
  delivered?: number
  pending?: number
}

type WeeklyActivityItem = {
  day: string
  orders: number
  shares: number
  chats: number
}

type PerformanceItem = {
  metric: string
  value: number
  target: number
  color: string
}

// Composant pour le graphique d'évolution des points
export function PointsEvolutionChart({ title, description, className, data }: ChartProps & { data?: PointsChartItem[] }) {
  const [period, setPeriod] = useState('15')

  const source = Array.isArray(data) ? data : pointsData
  const filteredData = source.slice(-parseInt(period))

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>{title}</span>
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Select value={period} onValueChange={(value) => {
            setPeriod(value)
            // Simuler une mise à jour des données
            console.log(`Période sélectionnée: ${value} jours`)
          }}>
            <SelectTrigger className="w-24 hover:bg-gray-50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="15">15 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#888888"
              fontSize={12}
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
              tickFormatter={(value) => `${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any, name: string) => [
                value.toLocaleString(),
                name === 'points' ? 'Points totaux' : 
                name === 'earned' ? 'Points gagnés' : 'Points utilisés'
              ]}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="points" 
              stackId="1"
              stroke="#10B981" 
              fill="#10B981" 
              fillOpacity={0.3}
              name="Points totaux"
            />
            <Line 
              type="monotone" 
              dataKey="earned" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              name="Points gagnés"
            />
            <Line 
              type="monotone" 
              dataKey="used" 
              stroke="#EF4444" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
              name="Points utilisés"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Composant pour le graphique des partages par réseau social
export function SharesDistributionChart({ title, description, className, data }: ChartProps & { data?: SharesChartItem[] }) {
  const source = Array.isArray(data) ? data : sharesData
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChartIcon className="w-5 h-5 text-purple-600" />
          <span>{title}</span>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={source}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="shares"
              >
                {source.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value} partages`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Détails par plateforme</h4>
            {source.map((platform, index) => (
              <div key={platform.platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: platform.color }}
                  />
                  <div>
                    <p className="font-medium">{platform.platform}</p>
                    <p className="text-sm text-gray-600">{platform.shares} partages</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{platform.points}</p>
                  <p className="text-xs text-gray-500">points gagnés</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour le graphique des commandes
export function OrdersChart({ title, description, className, data }: ChartProps & { data?: OrdersChartItem[] }) {
  const source = Array.isArray(data) ? data : ordersData
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span>{title}</span>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={source}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#888888"
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              stroke="#888888"
              fontSize={12}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              stroke="#888888"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any, name: string) => [
                name === 'revenue' ? `${(value / 1000000).toFixed(1)}M F CFA` : value,
                name === 'orders' ? 'Commandes' : 
                name === 'revenue' ? 'Revenus' :
                name === 'delivered' ? 'Livrées' : 'En attente'
              ]}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="orders" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
              name="Commandes"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="revenue" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              name="Revenus"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Composant pour le graphique d'activité hebdomadaire
export function WeeklyActivityChart({ title, description, className, data }: ChartProps & { data?: WeeklyActivityItem[] }) {
  const source = Array.isArray(data) ? data : activityData
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg leading-tight">
          <Activity className="w-5 h-5 text-orange-600" />
          <span>{title}</span>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={source}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              stroke="#888888"
              fontSize={12}
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Commandes" />
            <Bar dataKey="shares" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Partages" />
            <Bar dataKey="chats" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Chats" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Composant pour le graphique radar de performance
export function PerformanceRadarChart({ title, description, className, data }: ChartProps & { data?: PerformanceItem[] }) {
  const source = Array.isArray(data) ? data : performanceData
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg leading-tight">
          <Activity className="w-5 h-5 text-purple-600" />
          <span>{title}</span>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={source}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
            />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {source.map((item) => (
            <div key={item.metric} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{item.metric}</p>
              <p className="text-lg font-bold" style={{ color: item.color }}>
                {item.value}
              </p>
              <p className="text-xs text-gray-500">Objectif: {item.target}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour les statistiques en temps réel
export function RealTimeStats(props?: {
  pointsToday?: number
  pointsDeltaLabel?: string
  sharesToday?: number
  sharesDeltaLabel?: string
  ordersToday?: number
  ordersDeltaLabel?: string
  activeChats?: number
  chatsDeltaLabel?: string
}) {
  const pointsToday = Number(props?.pointsToday ?? 0) || 0
  const sharesToday = Number(props?.sharesToday ?? 0) || 0
  const ordersToday = Number(props?.ordersToday ?? 0) || 0
  const activeChats = Number(props?.activeChats ?? 0) || 0
  const pointsDeltaLabel = String(props?.pointsDeltaLabel ?? '0% vs hier')
  const sharesDeltaLabel = String(props?.sharesDeltaLabel ?? '0 vs hier')
  const ordersDeltaLabel = String(props?.ordersDeltaLabel ?? '0 vs hier')
  const chatsDeltaLabel = String(props?.chatsDeltaLabel ?? '0 vs hier')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start content-start auto-rows-min">
      <Card className="self-start relative min-w-0 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:z-10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-700">Points aujourd'hui</p>
              <p className="text-2xl font-bold text-green-900">{pointsToday.toLocaleString()}</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600 break-words">{pointsDeltaLabel}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="self-start relative min-w-0 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:z-10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-700">Partages</p>
              <p className="text-2xl font-bold text-blue-900">{sharesToday.toLocaleString()}</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600 break-words">{sharesDeltaLabel}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <Share2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="self-start relative min-w-0 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:z-10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-purple-700">Commandes</p>
              <p className="text-2xl font-bold text-purple-900">{ordersToday.toLocaleString()}</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingDown className="w-3 h-3 text-red-600" />
                <span className="text-xs text-red-600 break-words">{ordersDeltaLabel}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="self-start relative min-w-0 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:z-10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-orange-700">Chats actifs</p>
              <p className="text-2xl font-bold text-orange-900">{activeChats.toLocaleString()}</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-3 h-3 text-orange-600" />
                <span className="text-xs text-orange-600 break-words">{chatsDeltaLabel}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

