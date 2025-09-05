import jsPDF from 'jspdf'
import type { QuoteData, Project } from '@/lib/services'

export interface PDFGenerationOptions {
  quote: QuoteData
  project: Project
  includeLogo?: boolean
  logoUrl?: string
}

class PDFService {
  // Generate a professional quote PDF
  async generateQuotePDF(options: PDFGenerationOptions): Promise<Blob> {
    const { quote, project } = options
    
    try {
      // Create new PDF document
      const doc = new jsPDF()
      
      // Set up colors
      const primaryColor = [59, 130, 246] // Blue-500
      const grayColor = [107, 114, 128] // Gray-500
      
      // Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.rect(0, 0, 210, 30, 'F')
      
      // Company name
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('ReBath Pro', 20, 20)
      
      // Quote title
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(`Quote ${quote.quoteNumber}`, 20, 50)
      
      // Quote details
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.text(`Created: ${new Date(quote.createdAt!).toLocaleDateString()}`, 20, 60)
      doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, 20, 65)
      doc.text(`Status: ${quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}`, 20, 70)
      
      // Client information
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Bill To:', 20, 85)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(project.clientName, 20, 92)
      if (project.clientEmail) {
        doc.text(project.clientEmail, 20, 97)
      }
      if (project.clientPhone) {
        doc.text(project.clientPhone, 20, 102)
      }
      doc.text(project.address, 20, 107)
      
      // Project information
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Project Details:', 20, 120)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Project Type: ${project.projectType.replace('_', ' ').toUpperCase()}`, 20, 127)
      doc.text(`Project Status: ${project.status.replace('_', ' ').toUpperCase()}`, 20, 132)
      doc.text(`Priority: ${project.priority.toUpperCase()}`, 20, 137)
      
      // Quote items section
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Quote Items:', 20, 155)
      
      let currentY = 165
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      // Table headers
      doc.setFont('helvetica', 'bold')
      doc.text('#', 20, currentY)
      doc.text('Item', 30, currentY)
      doc.text('Brand/Model', 80, currentY)
      doc.text('Qty', 130, currentY)
      doc.text('Unit Price', 150, currentY)
      doc.text('Total', 180, currentY)
      
      currentY += 10
      
      // Draw line under headers
      doc.line(20, currentY - 5, 190, currentY - 5)
      
      // Separate fixture and labor items
      const fixtureItems = quote.items.filter(item => item.type === 'fixture' || !item.type)
      const laborItems = quote.items.filter(item => item.type === 'labor')
      
      // Fixture items
      if (fixtureItems.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.text('Fixture Items', 20, currentY)
        currentY += 10
        
        doc.setFont('helvetica', 'normal')
        fixtureItems.forEach((item, index) => {
          if (currentY > 250) {
            doc.addPage()
            currentY = 20
          }
          
          const combinedUnitPrice = item.unitPrice + (item.installationCost || 0)
          
          doc.text((index + 1).toString(), 20, currentY)
          doc.text(item.name, 30, currentY)
          doc.text(`${item.brand || ''} ${item.model || ''}`, 80, currentY)
          doc.text(item.quantity.toString(), 130, currentY)
          doc.text(`$${combinedUnitPrice.toFixed(2)}`, 150, currentY)
          doc.text(`$${item.totalPrice.toFixed(2)}`, 180, currentY)
          
          currentY += 8
        })
      }
      
      // Labor items
      if (laborItems.length > 0) {
        currentY += 5
        doc.setFont('helvetica', 'bold')
        doc.text('Labor Items', 20, currentY)
        currentY += 10
        
        doc.setFont('helvetica', 'normal')
        laborItems.forEach((item, index) => {
          if (currentY > 250) {
            doc.addPage()
            currentY = 20
          }
          
          doc.text((fixtureItems.length + index + 1).toString(), 20, currentY)
          doc.text(item.name, 30, currentY)
          doc.text(item.description || '', 80, currentY)
          doc.text(item.quantity.toString(), 130, currentY)
          doc.text(`$${item.unitPrice.toFixed(2)}`, 150, currentY)
          doc.text(`$${item.totalPrice.toFixed(2)}`, 180, currentY)
          
          currentY += 8
        })
      }
      
      // Quote summary
      currentY += 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Quote Summary', 20, currentY)
      
      currentY += 15
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Subtotal:', 20, currentY)
      doc.text(`$${quote.subtotal.toFixed(2)}`, 180, currentY)
      currentY += 10
      
      if (quote.discountAmount > 0) {
        doc.text('Discount:', 20, currentY)
        doc.text(`-$${quote.discountAmount.toFixed(2)}`, 180, currentY)
        currentY += 10
      }
      
      doc.text('Tax:', 20, currentY)
      doc.text(`$${quote.taxAmount.toFixed(2)}`, 180, currentY)
      currentY += 10
      
      doc.setFont('helvetica', 'bold')
      doc.text('Total:', 20, currentY)
      doc.text(`$${quote.total.toFixed(2)}`, 180, currentY)
      
      // Notes section
      if (quote.notes) {
        currentY += 20
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Notes:', 20, currentY)
        
        currentY += 10
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const splitNotes = doc.splitTextToSize(quote.notes, 170)
        doc.text(splitNotes, 20, currentY)
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.text('Thank you for choosing ReBath Pro for your renovation needs.', 20, pageHeight - 20)
      doc.text('This quote is valid until the date specified above.', 20, pageHeight - 15)
      
      // Convert to blob
      const pdfBlob = doc.output('blob')
      return pdfBlob
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // Download PDF file
  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  // Generate and download quote PDF
  async generateAndDownloadQuotePDF(options: PDFGenerationOptions): Promise<void> {
    try {
      const blob = await this.generateQuotePDF(options)
      const filename = `Quote-${options.quote.quoteNumber}-${options.project.clientName.replace(/\s+/g, '-')}.pdf`
      this.downloadPDF(blob, filename)
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF')
    }
  }
}

export const pdfService = new PDFService()
