import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendVerificationEmail(
  email: string,
  token: string,
  locale: string = 'en'
) {
  
  const verifyLink = `${domain}/api/auth/verify-email?token=${token}&locale=${locale}`
  
  const messages = {
    en: {
      subject: 'Verify your email address',
      title: 'Verify your email',
      text: 'Click the button below to verify your email address.',
      button: 'Verify Email',
      footer: 'If you did not create an account, please ignore this email.',
      expire: 'This link will expire in 1 hour.',
    },
    es: {
      subject: 'Verifica tu correo electrónico',
      title: 'Verifica tu correo',
      text: 'Haz clic en el botón de abajo para verificar tu dirección de correo.',
      button: 'Verificar Email',
      footer: 'Si no creaste una cuenta, por favor ignora este correo.',
      expire: 'Este enlace expirará en 1 hora.',
    }
  }

  const t = messages[locale as keyof typeof messages] || messages.en

  try {
    await resend.emails.send({
      from: 'EventCard Creator <onboarding@resend.dev>',
      to: email,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${t.title}</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          ${t.text}
                        </p>
                        
                        <!-- Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${verifyLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                ${t.button}
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                          ${t.expire}
                        </p>
                        
                        <!-- Link alternativo -->
                        <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0; word-break: break-all;">
                          Or copy this link: <br>
                          <a href="${verifyLink}" style="color: #667eea;">${verifyLink}</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="color: #6c757d; font-size: 14px; margin: 0;">
                          ${t.footer}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })
    
    console.log(`[Email] ✅ Verification email sent to: ${email}`)
    return { success: true }
  } catch (error) {
    console.error('[Email] ❌ Error sending verification email:', error)
    return { success: false, error }
  }
}

export async function sendPaymentApprovedEmail(
  email: string,
  planName: string,
  locale: string = 'en'
) {
  const messages = {
    en: {
      subject: 'Payment Approved - Subscription Activated',
      title: 'Payment Confirmed!',
      text: `Your payment has been approved and your ${planName} subscription is now active.`,
      subtitle: 'Thank you for your purchase!',
      details: 'Your subscription has been activated and you can now access all the features included in your plan.',
      footer: 'If you have any questions, please contact our support team.',
    },
    es: {
      subject: 'Pago Aprobado - Suscripción Activada',
      title: '¡Pago Confirmado!',
      text: `Tu pago ha sido aprobado y tu suscripción ${planName} está ahora activa.`,
      subtitle: '¡Gracias por tu compra!',
      details: 'Tu suscripción ha sido activada y ahora puedes acceder a todas las funciones incluidas en tu plan.',
      footer: 'Si tienes alguna pregunta, por favor contacta a nuestro equipo de soporte.',
    }
  }

  const t = messages[locale as keyof typeof messages] || messages.en

  try {
    await resend.emails.send({
      from: 'MemberBase <onboarding@resend.dev>',
      to: email,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✓ ${t.title}</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="color: #333333; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                          ${t.subtitle}
                        </p>
                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          ${t.text}
                        </p>
                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                          ${t.details}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="color: #6c757d; font-size: 14px; margin: 0;">
                          ${t.footer}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    console.log(`[Email] ✅ Payment approved email sent to: ${email}`)
    return { success: true }
  } catch (error) {
    console.error('[Email] ❌ Error sending payment approved email:', error)
    return { success: false, error }
  }
}

export async function sendPaymentRejectedEmail(
  email: string,
  reason: string,
  locale: string = 'en'
) {
  const messages = {
    en: {
      subject: 'Payment Not Approved',
      title: 'Payment Not Approved',
      text: 'Unfortunately, your payment could not be verified.',
      reasonLabel: 'Reason:',
      action: 'Please try again or contact our support team if you believe this is an error.',
      footer: 'If you have any questions, please contact our support team.',
    },
    es: {
      subject: 'Pago No Aprobado',
      title: 'Pago No Aprobado',
      text: 'Lamentablemente, tu pago no pudo ser verificado.',
      reasonLabel: 'Motivo:',
      action: 'Por favor intenta nuevamente o contacta a nuestro equipo de soporte si crees que esto es un error.',
      footer: 'Si tienes alguna pregunta, por favor contacta a nuestro equipo de soporte.',
    }
  }

  const t = messages[locale as keyof typeof messages] || messages.en

  try {
    await resend.emails.send({
      from: 'MemberBase <onboarding@resend.dev>',
      to: email,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✗ ${t.title}</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          ${t.text}
                        </p>
                        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                          <p style="color: #991b1b; font-size: 14px; margin: 0;">
                            <strong>${t.reasonLabel}</strong> ${reason}
                          </p>
                        </div>
                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                          ${t.action}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="color: #6c757d; font-size: 14px; margin: 0;">
                          ${t.footer}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    console.log(`[Email] ✅ Payment rejected email sent to: ${email}`)
    return { success: true }
  } catch (error) {
    console.error('[Email] ❌ Error sending payment rejected email:', error)
    return { success: false, error }
  }
}