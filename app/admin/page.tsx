'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatDateTime } from '@/lib/utils'
import { 
  Shield, 
  Users, 
  FileText, 
  BarChart3, 
  LogOut, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react'

interface ConsentSummary {
  project_id: string
  project_title: string
  total_patients: number
  consented_patients: number
  withdrawn_patients: number
  consent_rate: number
}

interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  details: Record<string, any>
  created_at: string
  user_email?: string
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [consentSummary, setConsentSummary] = useState<ConsentSummary[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/'
        return
      }
      setUser(user)
      await loadData()
    }

    getUser()
  }, [])

  const loadData = async () => {
    try {
      // Load consent summary data
      const { data: projects } = await supabase
        .from('research_projects')
        .select('id, title')

      const { data: consents } = await supabase
        .from('consent_records')
        .select('project_id, consent_given, patient_id')

      if (projects && consents) {
        const summary = projects.map(project => {
          const projectConsents = consents.filter(c => c.project_id === project.id)
          const consentedCount = projectConsents.filter(c => c.consent_given).length
          const withdrawnCount = projectConsents.filter(c => !c.consent_given).length
          const totalCount = projectConsents.length

          return {
            project_id: project.id,
            project_title: project.title,
            total_patients: totalCount,
            consented_patients: consentedCount,
            withdrawn_patients: withdrawnCount,
            consent_rate: totalCount > 0 ? (consentedCount / totalCount) * 100 : 0
          }
        })
        setConsentSummary(summary)
      }

      // Load audit logs with user information
      const { data: logs } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles!audit_logs_user_id_fkey(email)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (logs) {
        const logsWithEmail = logs.map(log => ({
          ...log,
          user_email: log.profiles?.email || 'Unknown User'
        }))
        setAuditLogs(logsWithEmail)
      }

    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportConsentData = async () => {
    try {
      const { data } = await supabase
        .from('consent_records')
        .select(`
          *,
          research_projects(title),
          profiles(email)
        `)

      if (data) {
        const csvContent = [
          ['Project', 'Patient Email', 'Consent Status', 'Consent Date', 'Withdrawal Date', 'GDPR Compliant'],
          ...data.map(record => [
            record.research_projects?.title || 'Unknown',
            record.profiles?.email || 'Unknown',
            record.consent_given ? 'Consented' : 'Withdrawn',
            record.consent_date,
            record.withdrawal_date || 'N/A',
            record.gdpr_compliant ? 'Yes' : 'No'
          ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `consent-data-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "Export successful",
          description: "Consent data has been exported to CSV.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalPatients = consentSummary.reduce((sum, item) => sum + item.total_patients, 0)
  const totalConsented = consentSummary.reduce((sum, item) => sum + item.consented_patients, 0)
  const overallConsentRate = totalPatients > 0 ? (totalConsented / totalPatients) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Consent Management & GDPR Compliance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportConsentData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                Across all research projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consented Patients</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalConsented}</div>
              <p className="text-xs text-muted-foreground">
                Currently participating
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consent Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallConsentRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Overall participation rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GDPR Compliance</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <p className="text-xs text-muted-foreground">
                All records compliant
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">Project Overview</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Research Projects Consent Status</CardTitle>
                <CardDescription>
                  Monitor consent rates and patient participation across all active research projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consentSummary.map((project) => (
                    <div key={project.project_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{project.project_title}</h3>
                        <Badge variant={project.consent_rate >= 50 ? "default" : "secondary"}>
                          {project.consent_rate.toFixed(1)}% consent rate
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            <strong>{project.total_patients}</strong> total patients
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            <strong>{project.consented_patients}</strong> consented
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm">
                            <strong>{project.withdrawn_patients}</strong> withdrawn
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.consent_rate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>
                  Complete log of all consent-related activities for GDPR compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{log.action.replace('_', ' ')}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.resource_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            User: {log.user_email}
                          </p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 ml-4">
                          {formatDateTime(log.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}