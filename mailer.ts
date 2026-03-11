import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const from = process.env.EMAIL_FROM || 'noreply@mail.l7fitness.com.br';

export async function enviarEmail(to: string, subject: string, html: string) {
  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Erro ao enviar e-mail via Resend:', error);
      throw new Error(error.message);
    }

    console.log('E-mail enviado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Falha ao enviar e-mail:', error);
    throw error;
  }
}
