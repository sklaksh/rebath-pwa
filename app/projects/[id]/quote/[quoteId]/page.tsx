'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { ProtectedRoute } from '@/components/protected-route'
import { projectService, quoteService, pdfService } from '@/lib/services'
import type { Project, QuoteData } from '@/lib/services'
import { Edit, Send, Check, X, Download, Calendar, DollarSign, FileText } from 'lucide-react'

function QuoteDetailContent() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const quoteId = params.quoteId as string

  const [project, setProject] = useState<Project | null>(null)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project
        const { project: fetchedProject, error: projectError } = await projectService.getProject(projectId)
        if (projectError) {
          toast.error('Project not found')
          router.push('/projects')
          return
        }
        setProject(fetchedProject)

        // Load quote
        const { quote: fetchedQuote, error: quoteError } = await quoteService.getQuote(quoteId)
        if (quoteError) {
          toast.error('Quote not found')
          router.push(`/projects/${projectId}`)
          return
        }
        setQuote(fetchedQuote)
      } catch (error) {
        toast.error('Failed to load data')
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (projectId && quoteId) {
      loadData()
    }
  }, [projectId, quoteId, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSendQuote = async () => {
    if (!quote) return
    
    setActionLoading(true)
    try {
      const { success, error } = await quoteService.sendQuote(quote.id!)
      if (error) {
        toast.error(`Failed to send quote: ${error.message}`)
      } else {
        toast.success('Quote sent successfully!')
        setQuote(prev => prev ? { ...prev, status: 'sent' } : null)
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAcceptQuote = async () => {
    if (!quote) return
    
    setActionLoading(true)
    try {
      const { success, error } = await quoteService.acceptQuote(quote.id!)
      if (error) {
        toast.error(`Failed to accept quote: ${error.message}`)
      } else {
        toast.success('Quote accepted!')
        setQuote(prev => prev ? { ...prev, status: 'accepted' } : null)
      }
    } catch (error) {
      console.error('Error accepting quote:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectQuote = async () => {
    if (!quote) return
    
    setActionLoading(true)
    try {
      const { success, error } = await quoteService.rejectQuote(quote.id!)
      if (error) {
        toast.error(`Failed to reject quote: ${error.message}`)
      } else {
        toast.success('Quote rejected')
        setQuote(prev => prev ? { ...prev, status: 'rejected' } : null)
      }
    } catch (error) {
      console.error('Error rejecting quote:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!quote || !project) {
      toast.error('Quote or project data not available')
      return
    }
    
    try {
      setActionLoading(true)
      console.log('Starting PDF generation...', { quote: quote.quoteNumber, project: project.name })
      
      await pdfService.generateAndDownloadQuotePDF({
        quote,
        project
      })
      
      console.log('PDF generation completed successfully')
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to generate PDF: ${errorMessage}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quote...</p>
        </div>
      </div>
    )
  }

  if (!project || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Not Found</h2>
          <p className="text-gray-600 mb-4">The requested quote could not be found.</p>
          <Button onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title={`Quote ${quote.quoteNumber}`}
        showBackButton={true}
        showQuickNav={true}
      />

      <div className="p-4 space-y-6">
        {/* Quote Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-3">
                  <span>Quote {quote.quoteNumber}</span>
                  <Badge className={getStatusColor(quote.status)}>
                    {quote.status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Created {new Date(quote.createdAt!).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {quote.status === 'draft' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/projects/${projectId}/quote/${quoteId}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendQuote}
                      disabled={actionLoading}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Quote
                    </Button>
                  </>
                )}
                {quote.status === 'sent' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRejectQuote}
                      disabled={actionLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAcceptQuote}
                      disabled={actionLoading}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={actionLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Generating...' : 'PDF'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Client</h4>
                <p className="text-gray-600">{project.clientName}</p>
                {project.clientEmail && <p className="text-sm text-gray-500">{project.clientEmail}</p>}
                {project.clientPhone && <p className="text-sm text-gray-500">{project.clientPhone}</p>}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Project Address</h4>
                <p className="text-gray-600">{project.address}</p>
                <p className="text-sm text-gray-500 capitalize">{project.projectType.replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Quote Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Fixture Items */}
              {quote.items.filter(item => item.type === 'fixture' || !item.type).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Fixture Items</h4>
                  <div className="space-y-4">
                    {quote.items.filter(item => item.type === 'fixture' || !item.type).map((item, index) => (
                      <div key={item.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.brand} {item.model}</p>
                          {item.size && <p className="text-xs text-gray-500">Size: {item.size}</p>}
                          {item.material && <p className="text-xs text-gray-500">Material: {item.material}</p>}
                          {item.color && <p className="text-xs text-gray-500">Color: {item.color}</p>}
                          {item.notes && <p className="text-xs text-gray-500 mt-1">Notes: {item.notes}</p>}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} each</p>
                          {item.installationCost && (
                            <p className="text-sm text-gray-600">+ ${item.installationCost.toFixed(2)} install</p>
                          )}
                          <p className="font-medium text-gray-900">${item.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labor Items */}
              {quote.items.filter(item => item.type === 'labor').length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Labor Items</h4>
                  <div className="space-y-4">
                    {quote.items.filter(item => item.type === 'labor').map((item, index) => (
                      <div key={item.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                          {item.notes && <p className="text-xs text-gray-500 mt-1">Notes: {item.notes}</p>}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} each</p>
                          <p className="font-medium text-gray-900">${item.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quote Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Quote Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${quote.subtotal.toFixed(2)}</span>
              </div>
              
              {quote.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount ({quote.discountPercentage * 100}%):</span>
                  <span className="font-medium text-green-600">-${quote.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({quote.taxRate * 100}%):</span>
                <span className="font-medium">${quote.taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between border-t pt-3">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-primary-600">${quote.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Quote Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Valid Until</h4>
                <p className="text-gray-600">{new Date(quote.validUntil).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Last Updated</h4>
                <p className="text-gray-600">{new Date(quote.updatedAt!).toLocaleDateString()}</p>
              </div>
            </div>
            
            {quote.notes && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                <p className="text-gray-600">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function QuoteDetail() {
  return (
    <ProtectedRoute>
      <QuoteDetailContent />
    </ProtectedRoute>
  )
}
