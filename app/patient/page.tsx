'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { Brain, Calendar, Users, FileText, Shield, LogOut, ArrowLeft } from 'lucide-react'

interface ResearchProject {
  id: string
  title: string
  description: string
  principal_investigator: string
  institution: string
  data_types: string[]
  purpose: string
  duration_months: number
  status: 'active' | 'completed' | 'paused'
  created_at: string
}

interface ConsentRecord {
  id: string
  project_id: string
  consent_given: boolean
  consent_date: string
  withdrawal_date: string | null
  data_retention_period: number
  specific_permissions: Record<string, any>
}

export default function PatientPortal() {
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<ResearchProject[]>([])
  const [consents, setConsents] = useState<ConsentRecord[]>([])
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
      // Load research projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('research_projects')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Load user's consent records
      const { data: consentsData, error: consentsError } = await supabase
        .from('consent_records')
        .select('*')
        .eq('patient_id', user?.id)

      if (consentsError) throw consentsError

      setProjects(projectsData || [])
      setConsents(consentsData || [])
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

  const handleConsentChange = async (projectId: string, consentGiven: boolean) => {
    if (!user) return

    try {
      const existingConsent = consents.find(c => c.project_id === projectId)
      
      if (existingConsent) {
        // Update existing consent
        const { error } = await supabase
          .from('consent_records')
          .update({
            consent_given: consentGiven,
            withdrawal_date: consentGiven ? null : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingConsent.id)

        if (error) throw error
      } else {
        // Create new consent record
        const { error } = await supabase
          .from('consent_records')
          .insert({
            patient_id: user.id,
            project_id: projectId,
            consent_given: consentGiven,
            consent_date: new Date().toISOString(),
            data_retention_period: 60, // 5 years in months
            specific_permissions: {
              data_sharing: consentGiven,
              federated_learning: consentGiven,
              anonymized_research: consentGiven,
            },
            gdpr_compliant: true,
          })

        if (error) throw error
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: consentGiven ? 'CONSENT_GIVEN' : 'CONSENT_WITHDRAWN',
          resource_type: 'consent_record',
          resource_id: projectId,
          details: {
            project_id: projectId,
            consent_status: consentGiven,
          },
        })

      await loadData()
      
      toast({
        title: consentGiven ? "Consent granted" : "Consent withdrawn",
        description: `Your consent for this research project has been ${consentGiven ? 'granted' : 'withdrawn'}.`,
      })
    } catch (error: any) {
      toast({
        title: "Error updating consent",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getConsentStatus = (projectId: string) => {
    const consent = consents.find(c => c.project_id === projectId)
    return consent?.consent_given || false
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
              <h1 className="text-3xl font-bold text-gray-900">Patient Portal</h1>
              <p className="text-gray-600">Welcome, {user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Your Data Rights
              </CardTitle>
              <CardDescription>
                You have full control over your data. You can grant or withdraw consent at any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Right to Information</h4>
                  <p className="text-blue-700">You have the right to know how your data is being used in research.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Right to Withdraw</h4>
                  <p className="text-green-700">You can withdraw your consent at any time without penalty.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Right to Deletion</h4>
                  <p className="text-purple-700">You can request deletion of your data from research projects.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Available Research Projects</h2>
            <div className="grid gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                        <CardDescription className="text-base mb-4">
                          {project.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Label htmlFor={`consent-${project.id}`} className="text-sm font-medium">
                          Participate
                        </Label>
                        <Switch
                          id={`consent-${project.id}`}
                          checked={getConsentStatus(project.id)}
                          onCheckedChange={(checked) => handleConsentChange(project.id, checked)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            <strong>Principal Investigator:</strong> {project.principal_investigator}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            <strong>Institution:</strong> {project.institution}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            <strong>Duration:</strong> {project.duration_months} months
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Data Types Used:</h4>
                          <div className="flex flex-wrap gap-1">
                            {project.data_types.map((type, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Research Purpose:</h4>
                          <p className="text-sm text-gray-600">{project.purpose}</p>
                        </div>
                      </div>
                    </div>
                    
                    {getConsentStatus(project.id) && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            You are participating in this research project
                          </span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          Your data will be used in federated learning while maintaining privacy and anonymity.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {consents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Your Consent History
                </CardTitle>
                <CardDescription>
                  Track your participation history and consent changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consents.map((consent) => {
                    const project = projects.find(p => p.id === consent.project_id)
                    return (
                      <div key={consent.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{project?.title || 'Unknown Project'}</h4>
                          <p className="text-sm text-gray-600">
                            {consent.consent_given ? 'Consented' : 'Withdrawn'} on {formatDate(consent.consent_date)}
                          </p>
                        </div>
                        <Badge variant={consent.consent_given ? "default" : "secondary"}>
                          {consent.consent_given ? 'Active' : 'Withdrawn'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}