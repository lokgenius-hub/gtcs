/**
 * Send email notification to admin when a new lead/contact form is submitted.
 * Uses Resend free tier (100 emails/day) — no credit card needed.
 * https://resend.com
 * Falls back silently if not configured.
 */

const RESEND_API_URL = 'https://api.resend.com/emails'

interface LeadData {
  name: string
  phone: string
  email?: string | null
  service_interest?: string | null
  message?: string | null
}

export async function sendLeadEmail(lead: LeadData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL

  if (!apiKey || !adminEmail) {
    console.log('[Email] Skipping — RESEND_API_KEY or ADMIN_EMAIL not configured')
    return false
  }

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'GTCS'
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || ''

  const htmlBody = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #050A14; color: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,102,204,0.3);">
      
      <div style="background: linear-gradient(135deg, #0066CC, #004E99); padding: 24px 28px; display: flex; align-items: center; gap: 12px;">
        <div style="background: rgba(255,255,255,0.15); border-radius: 10px; padding: 10px 16px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #fff;">GTCS</div>
        <div>
          <div style="color: rgba(255,255,255,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">New Enquiry</div>
          <div style="color: #fff; font-size: 18px; font-weight: 700;">${siteName}</div>
        </div>
      </div>

      <div style="padding: 28px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #338FD9; font-size: 13px; font-weight: 600; width: 140px; vertical-align: top;">Name</td>
            <td style="padding: 10px 0; color: #fff; font-size: 15px; font-weight: 600;">${lead.name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #338FD9; font-size: 13px; font-weight: 600; vertical-align: top;">Phone</td>
            <td style="padding: 10px 0;">
              <a href="tel:+91${lead.phone}" style="color: #0066CC; text-decoration: none; font-size: 15px; font-weight: 600;">+91 ${lead.phone}</a>
            </td>
          </tr>
          ${lead.email ? `
          <tr>
            <td style="padding: 10px 0; color: #338FD9; font-size: 13px; font-weight: 600; vertical-align: top;">Email</td>
            <td style="padding: 10px 0; color: #fff;">${lead.email}</td>
          </tr>` : ''}
          ${lead.service_interest ? `
          <tr>
            <td style="padding: 10px 0; color: #338FD9; font-size: 13px; font-weight: 600; vertical-align: top;">Interested In</td>
            <td style="padding: 10px 0; color: #fff; text-transform: capitalize;">${lead.service_interest}</td>
          </tr>` : ''}
          ${lead.message ? `
          <tr>
            <td style="padding: 10px 0; color: #338FD9; font-size: 13px; font-weight: 600; vertical-align: top;">Message</td>
            <td style="padding: 10px 0; color: rgba(255,255,255,0.8);">${lead.message}</td>
          </tr>` : ''}
        </table>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="https://wa.me/${whatsapp}?text=Hi%20${encodeURIComponent(lead.name)}%2C%20Thank%20you%20for%20contacting%20${encodeURIComponent(siteName)}!%20How%20can%20we%20assist%20you%3F" 
             style="display: inline-block; padding: 10px 20px; background: #25D366; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">
            💬 Reply on WhatsApp
          </a>
          <a href="tel:+91${lead.phone}" 
             style="display: inline-block; padding: 10px 20px; background: #0066CC; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">
            📞 Call Now
          </a>
          ${lead.email ? `<a href="mailto:${lead.email}" 
             style="display: inline-block; padding: 10px 20px; background: rgba(255,255,255,0.08); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; border: 1px solid rgba(255,255,255,0.15);">
            ✉️ Reply Email
          </a>` : ''}
        </div>
      </div>

      <div style="padding: 14px 28px; background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.25); text-align: center; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.05);">
        ${siteName} — Admin Notification System • ${new Date().toLocaleString('en-IN')}
      </div>
    </div>
  `

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${siteName} <onboarding@resend.dev>`,
        to: adminEmail,
        subject: `🔔 New Lead: ${lead.name} — ${lead.service_interest || 'General Enquiry'}`,
        html: htmlBody,
      }),
    })
    return res.ok
  } catch (err) {
    console.error('[Email] Failed to send:', err)
    return false
  }
}

/** Send auto-reply to the customer */
export async function sendAutoReply(lead: LeadData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !lead.email) return false

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'GTCS'
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || ''
  const phone = process.env.NEXT_PUBLIC_PHONE || ''

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${siteName} <onboarding@resend.dev>`,
        to: lead.email,
        subject: `✅ We received your enquiry — ${siteName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #050A14; color: #fff; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066CC, #004E99); padding: 28px; text-align: center;">
              <div style="font-size: 32px; font-weight: 900; color: #fff; letter-spacing: -1px;">GTCS</div>
              <div style="color: rgba(255,255,255,0.75); font-size: 13px; margin-top: 4px;">Gentech Consultancy Services</div>
            </div>
            <div style="padding: 32px 28px;">
              <h2 style="color: #fff; font-size: 22px; margin: 0 0 8px 0;">Hi ${lead.name}! 👋</h2>
              <p style="color: rgba(255,255,255,0.7); line-height: 1.7; margin: 0 0 20px 0;">
                Thank you for reaching out to <strong style="color: #0066CC;">${siteName}</strong>. We have received your enquiry and our team will get back to you within <strong style="color: #fff;">2–4 business hours</strong>.
              </p>
              <div style="background: rgba(0,102,204,0.1); border: 1px solid rgba(0,102,204,0.3); border-radius: 12px; padding: 20px;">
                <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Your enquiry summary</p>
                ${lead.service_interest ? `<p style="color: #fff; margin: 0 0 8px 0;">🎯 <strong>Service:</strong> ${lead.service_interest}</p>` : ''}
                ${lead.message ? `<p style="color: rgba(255,255,255,0.75); margin: 0; font-style: italic;">"${lead.message}"</p>` : ''}
              </div>
              <p style="color: rgba(255,255,255,0.5); line-height: 1.7; margin: 20px 0 0 0; font-size: 14px;">
                In the meantime, feel free to WhatsApp us for a faster response:
              </p>
              <a href="https://wa.me/${whatsapp}" style="display: inline-block; margin-top: 12px; padding: 12px 24px; background: #25D366; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700;">
                💬 WhatsApp Us
              </a>
            </div>
            <div style="padding: 16px 28px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.25); font-size: 12px; text-align: center;">
              ${phone} &nbsp;|&nbsp; ${process.env.NEXT_PUBLIC_EMAIL || ''} &nbsp;|&nbsp; ${process.env.NEXT_PUBLIC_SITE_URL || ''}
            </div>
          </div>
        `,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
