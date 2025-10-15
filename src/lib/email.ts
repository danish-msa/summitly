import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
    
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const sendContactEmail = async (data: {
  name: string
  email: string
  phone?: string
  message: string
  propertyId?: string
}) => {
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
    ${data.propertyId ? `<p><strong>Property ID:</strong> ${data.propertyId}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${data.message}</p>
  `

  return sendEmail({
    to: process.env.CONTACT_EMAIL || process.env.SMTP_USER!,
    subject: 'New Contact Form Submission',
    html,
  })
}

export const sendPropertyInquiryEmail = async (data: {
  name: string
  email: string
  phone?: string
  message: string
  propertyId: string
  propertyTitle: string
}) => {
  const html = `
    <h2>Property Inquiry</h2>
    <p><strong>Property:</strong> ${data.propertyTitle} (ID: ${data.propertyId})</p>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${data.message}</p>
  `

  return sendEmail({
    to: process.env.CONTACT_EMAIL || process.env.SMTP_USER!,
    subject: `Property Inquiry: ${data.propertyTitle}`,
    html,
  })
}
