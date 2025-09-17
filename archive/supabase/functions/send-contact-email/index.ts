
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Contact email function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    console.log("Sending contact email from:", email, "subject:", subject);

    // Send notification email to the company
    const notificationResponse = await resend.emails.send({
      from: "Matbakh Contact <mail@matbakh.app>",
      to: ["mail@matbakh.app"],
      subject: `Neue Kontaktanfrage: ${subject}`,
      html: `
        <h2>Neue Kontaktanfrage über die Website</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Betreff:</strong> ${subject}</p>
        <p><strong>Nachricht:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Diese E-Mail wurde automatisch über das Kontaktformular auf matbakh.app gesendet.</small></p>
      `,
    });

    // Send confirmation email to the sender
    const confirmationResponse = await resend.emails.send({
      from: "Matbakh Team <mail@matbakh.app>",
      to: [email],
      subject: "Vielen Dank für Ihre Nachricht",
      html: `
        <h2>Vielen Dank für Ihre Nachricht, ${name}!</h2>
        <p>Wir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.</p>
        <p><strong>Ihre Nachricht:</strong></p>
        <p><em>"${message}"</em></p>
        <p>Wir antworten normalerweise innerhalb von 24 Stunden.</p>
        <br>
        <p>Mit freundlichen Grüßen,<br>
        Das Matbakh Team</p>
        <hr>
        <p><small>BaSSco (Bavarian Software Solution), München</small></p>
      `,
    });

    console.log("Notification email sent:", notificationResponse);
    console.log("Confirmation email sent:", confirmationResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "E-Mails erfolgreich versendet",
        notificationId: notificationResponse.data?.id,
        confirmationId: confirmationResponse.data?.id
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Fehler beim Versenden der E-Mail", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
