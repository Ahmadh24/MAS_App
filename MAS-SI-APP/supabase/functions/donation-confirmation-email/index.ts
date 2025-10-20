// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")
const RESEND_API_KEY = Deno.env.get('RESEND_KEY')

Deno.serve(async (req) => {
  const { message, profile } = await req.json()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: 'temurbeksayfutdinov@gmail.com',
      subject: 'MAS App Feedback',
      html: `
          <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #0044cc;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }
        .header img {
            width: 80px;
            margin-bottom: 10px;
            border-radius: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
            color: #333333;
            line-height: 1.6;
        }
        .content h2 {
            color: #0044cc;
        }
        .content p {
            margin: 0 0 20px;
        }
        .content .donation-details {
            background-color: #f1f9ff;
            padding: 15px;
            border-radius: 5px;
            font-size: 16px;
        }
        .donation-details strong {
            color: #0044cc;
        }
        .footer {
            background-color: #f1f1f1;
            padding: 10px;
            text-align: center;
            color: #777777;
        }
        .footer a {
            color: #0044cc;
            text-decoration: none;
        }
    </style>
</head>
<body>

    <div class="email-container">
        <div class="header">
            <img src="https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0" alt="MAS Staten Island">
            <h1>New App Feedback!</h1>
        </div>
        <div class="content">
            <div class="donation-details">
                <p><strong>Message:</strong> ${message}</p>
            </div>
        </div>
        <div class="footer">
       
            <p>&copy; 2024 MAS Staten Island. All Rights Reserved.</p>
        </div>
    </div>

</body>
      `,
    }),
  })

    if (!res.ok) {
        return new Response("Error sending email", { status: 500 })
    }

    const userRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'developer@massic.org',
          to: `${profile.profile_email}`,
          subject: 'MAS App Feedback Confirmation',
          html: `
              <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Your Donation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 0;
            }
            .email-container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background-color: #0044cc;
                color: #ffffff;
                text-align: center;
                padding: 20px;
            }
            .header img {
                width: 80px;
                margin-bottom: 10px;
                border-radius: 20px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 20px;
                color: #333333;
                line-height: 1.6;
            }
            .content h2 {
                color: #0044cc;
            }
            .content p {
                margin: 0 0 20px;
            }
            .content .donation-details {
                background-color: #f1f9ff;
                padding: 15px;
                border-radius: 5px;
                font-size: 16px;
            }
            .donation-details strong {
                color: #0044cc;
            }
            .footer {
                background-color: #f1f1f1;
                padding: 10px;
                text-align: center;
                color: #777777;
            }
            .footer a {
                color: #0044cc;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
    
        <div class="email-container">
            <div class="header">
                <img src="https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0" alt="MAS Staten Island">
                <h1>Thank You for Your Feedback!</h1>
            </div>
            <div class="content">
                <div class="donation-details">
                    <p><strong>Dear MAS Staten Island Member</strong></p>
                    <br/> <br/>
                    <p>Thank you for your feedback! We appreciate your input and will review it shortly.</p>
                    <br/>
                    <p>Here are the details of your feedback</p>
                    <br/>
                    <p><strong>Message:</strong> ${message}</p>
                </div>
            </div>
            <div class="footer">
           
                <p>&copy; 2024 MAS Staten Island. All Rights Reserved.</p>
            </div>
        </div>
    
    </body>
          `,
        }),
    })

      if(!userRes.ok) {
        return new Response("Error sending user confirmation email", { status: 500 })
      }



  const userData = await userRes.json()
  const data = await res.json()
  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/donation-confirmation-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
