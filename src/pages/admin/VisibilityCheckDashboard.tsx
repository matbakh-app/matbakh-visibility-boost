import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Mail, 
  Phone, 
  MessageSquare,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Star
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

// ================================================================
// Types and Interfaces
// ================================================================

interface VisibilityCheckLead {
  id: string
  email: string
  confirmed: boolean
  analysis_status: string
  language: string
  created_at: string
  updated_at: string
  visibility_check_context_data?: BusinessContextData[]
  visibility_check_results?: AnalysisResult[]
  visibility_check_followups?: FollowupRecord[]
}

interface BusinessContextData {
  business_name: string
  city: string
  main_category: string
  data_completeness_score: number
  persona_type?: string
}

interface AnalysisResult {
  summary_score: number
  platform_scores: Record<string, number>
  analysis_confidence: number
  created_at: string
}

interface FollowupRecord {
  status: string
  lead_score: number
  contact_attempts: number
  last_contact_at?: string
  next_contact_at?: string
}

interface DashboardStats {
  total_leads: number
  confirmed_leads: number
  completed_analyses: number
  conversion_rate: number
  avg_analysis_score: number
  leads_by_status: Array<{ status: string; count: number }>
  leads_by_date: Array<{ date: string; count: number }>
  top_categories: Array<{ category: string; count: number }>
}

// ================================================================
// Main Dashboard Component
// ================================================================

export default function VisibilityCheckDashboard() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<VisibilityCheckLead[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })
  const [selectedLead, setSelectedLead] = useState<VisibilityCheckLead | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // ================================================================
  // Data Fetching
  // ================================================================

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, currentPage, filters])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Build query with filters
      let query = supabase
        .from('visibility_check_leads')
        .select(`
          *,
          visibility_check_context_data (*),
          visibility_check_results (*),
          visibility_check_followups (*)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('analysis_status', filters.status)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,visibility_check_context_data.business_name.ilike.%${filters.search}%`)
      }

      // Pagination
      const limit = 50
      const offset = (currentPage - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: leadsData, error: leadsError, count } = await query

      if (leadsError) throw leadsError

      setLeads(leadsData || [])
      setTotalPages(Math.ceil((count || 0) / limit))

      // Fetch statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_vc_dashboard_stats')

      if (statsError) {
        console.error('Stats error:', statsError)
      } else {
        setStats(statsData)
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ================================================================
  // Action Handlers
  // ================================================================

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('visibility_check_followups')
        .upsert({
          lead_id: leadId,
          status: newStatus,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Refresh data
      fetchDashboardData()
    } catch (error) {
      console.error('Status update error:', error)
    }
  }

  const handleExportData = async (format: 'csv' | 'pdf') => {
    try {
      // Call export function
      const { data, error } = await supabase.functions.invoke('export-vc-data', {
        body: { format, filters }
      })

      if (error) throw error

      // Download file
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/pdf' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vc-leads-${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const handleAnonymizeLead = async (email: string) => {
    if (!confirm('Are you sure you want to anonymize this lead? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase.functions.invoke('vc-data-management/anonymize-lead', {
        body: { email }
      })

      if (error) throw error

      alert('Lead anonymized successfully')
      fetchDashboardData()
    } catch (error) {
      console.error('Anonymization error:', error)
      alert('Failed to anonymize lead')
    }
  }

  // ================================================================
  // Render Functions
  // ================================================================

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending_opt_in': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'confirmed': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'data_collection': { color: 'bg-purple-100 text-purple-800', icon: Users },
      'ai_analysis': { color: 'bg-orange-100 text-orange-800', icon: TrendingUp },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'failed': { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_opt_in
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const renderStatsCards = () => {
    if (!stats) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_leads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed_leads}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.confirmed_leads / stats.total_leads) * 100).toFixed(1)}% confirmation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_analyses}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.completed_analyses / stats.confirmed_leads) * 100).toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_analysis_score}</div>
            <p className="text-xs text-muted-foreground">
              Analysis quality score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Lead to customer
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCharts = () => {
    if (!stats) return null

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.leads_by_status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.leads_by_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.leads_by_date}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderLeadsTable = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Visibility Check Leads</CardTitle>
              <CardDescription>
                Manage and track all visibility check submissions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportData('csv')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExportData('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email or business name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="max-w-sm"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending_opt_in">Pending Opt-In</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="data_collection">Data Collection</SelectItem>
                <SelectItem value="ai_analysis">AI Analysis</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-40"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-40"
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const contextData = lead.visibility_check_context_data?.[0]
                const resultData = lead.visibility_check_results?.[0]
                const followupData = lead.visibility_check_followups?.[0]

                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {lead.language.toUpperCase()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contextData ? (
                        <div>
                          <div className="font-medium">{contextData.business_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {contextData.city} • {contextData.main_category}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lead.analysis_status)}
                    </TableCell>
                    <TableCell>
                      {resultData ? (
                        <div className="flex items-center">
                          <div className="w-12 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ width: `${resultData.summary_score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{resultData.summary_score}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnonymizeLead(lead.email)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ================================================================
  // Main Render
  // ================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Visibility Check Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive management of visibility check leads and analysis results
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="export">Export & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderStatsCards()}
          {renderCharts()}
          {renderLeadsTable()}
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          {renderLeadsTable()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {renderCharts()}
          <Card>
            <CardHeader>
              <CardTitle>Top Business Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.top_categories || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Export visibility check data for analysis and reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => handleExportData('csv')} className="h-20">
                  <div className="text-center">
                    <Download className="w-6 h-6 mx-auto mb-2" />
                    <div>Export as CSV</div>
                    <div className="text-sm opacity-70">Spreadsheet format</div>
                  </div>
                </Button>
                <Button onClick={() => handleExportData('pdf')} className="h-20">
                  <div className="text-center">
                    <Download className="w-6 h-6 mx-auto mb-2" />
                    <div>Export as PDF</div>
                    <div className="text-sm opacity-70">Report format</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}

// ================================================================
// Lead Detail Modal Component
// ================================================================

interface LeadDetailModalProps {
  lead: VisibilityCheckLead
  onClose: () => void
  onStatusUpdate: (leadId: string, status: string) => void
}

function LeadDetailModal({ lead, onClose, onStatusUpdate }: LeadDetailModalProps) {
  const contextData = lead.visibility_check_context_data?.[0]
  const resultData = lead.visibility_check_results?.[0]
  const followupData = lead.visibility_check_followups?.[0]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Lead Details</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>Email:</strong> {lead.email}</div>
              <div><strong>Language:</strong> {lead.language}</div>
              <div><strong>Status:</strong> {getStatusBadge(lead.analysis_status)}</div>
              <div><strong>Created:</strong> {new Date(lead.created_at).toLocaleString()}</div>
              <div><strong>Confirmed:</strong> {lead.confirmed ? 'Yes' : 'No'}</div>
            </CardContent>
          </Card>

          {/* Business Information */}
          {contextData && (
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>Name:</strong> {contextData.business_name}</div>
                <div><strong>Location:</strong> {contextData.city}</div>
                <div><strong>Category:</strong> {contextData.main_category}</div>
                <div><strong>Data Completeness:</strong> {contextData.data_completeness_score}%</div>
                {contextData.persona_type && (
                  <div><strong>Persona:</strong> {contextData.persona_type}</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {resultData && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                    <div className="text-2xl font-bold">{resultData.summary_score}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                    <div className="text-2xl font-bold">
                      {(resultData.analysis_confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Platform Scores</div>
                    <div className="space-y-1">
                      {Object.entries(resultData.platform_scores).map(([platform, score]) => (
                        <div key={platform} className="flex justify-between">
                          <span className="capitalize">{platform}:</span>
                          <span>{score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-up Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Follow-up Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Select 
                  value={followupData?.status || 'new'} 
                  onValueChange={(value) => onStatusUpdate(lead.id, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                    <SelectItem value="unresponsive">Unresponsive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Schedule Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}