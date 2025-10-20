// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Supabase client setup
const supabaseUrl = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON');
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Hello from Functions!")
const RESEND_API_KEY = Deno.env.get('RESEND_KEY')

serve(async (req) => {
  const { submission } = await req.json()
  const onApprove = async () => {
    const { error } = await supabase.from('business_ads_submissions').update({ status : 'APPROVED' }).eq('business_flyer_img', submission.business_flyer_img)
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'temur@temurbeksayfutdinov.info',
      to: 'temurbeksayfutdinov@gmail.com',
      subject: 'New App Advertisment Submission',
      html: `
          <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  font-family: Arial, sans-serif;
                  color: #333333;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .email-container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  border-radius: 10px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  overflow: hidden;
              }
              .header {
                background-color: #4CAF50;
                height: 60px;
                border-radius: 10px 10px 0 0;
              }
              .content {
                  padding: 20px;
              }
              .content h2 {
                  font-size: 20px;
                  color: #4CAF50;
              }
              .content p {
                  line-height: 1.6;
                  margin: 10px 0;
              }
              .content img {
                  max-width: 100%;
                  border-radius: 5px;
                  margin: 20px 0;
              }
              .content .info {
                  background-color: #f9f9f9;
                  padding: 15px;
                  border-radius: 5px;
                  margin-bottom: 20px;
              }
              .content .info p {
                  margin: 5px 0;
              }
              .footer {
                  background-color: #4CAF50;
                  color: white;
                  text-align: center;
                  padding: 10px;
                  font-size: 14px;
                  border-radius: 0 0 10px 10px;
              }
              .footer a {
                  color: white;
                  text-decoration: none;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
              </div>
              <div class="content">
                  <h2>Below are the details of the new business flyer submisson:</h2>
                  
                  <div class="info">
                      <h3>Applicant's Information:</h3>
                      <p><strong>Full Name:</strong> ${submission.personal_full_name}</p>
                      <p><strong>Phone Number:</strong> ${submission.personal_phone_number}</p>
                      <p><strong>Email:</strong> ${submission.personal_email}</p>
                  </div>
                  
                  <div class="info">
                      <h3>Business Information:</h3>
                      <p><strong>Business Name:</strong> ${submission.business_name}</p>
                      <p><strong>Address:</strong> ${submission.business_address}</p>
                      <p><strong>Phone Number:</strong> ${submission.business_phone_number}</p>
                      <p><strong>Email:</strong> ${submission.business_email}</p>
                  </div>

                  <div class="info">
                      <h3>Flyer Details:</h3>
                      <p><strong>Duration:</strong> ${submission.business_flyer_duration}</p>
                  </div>
                  
                  <img src="${submission.business_flyer_img}" alt="Business Flyer Image" width="600" height="600">

                  <button type="button" style="background-color: green; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;" onclick=${submission.onApprove}>
                    Approve
                  </button>
              </div>
              <div class="footer">
                  <p>&copy; 2024 MAS Staten Island</p>
              </div>
          </div>
      </body>`,
    }),
  })

  const data = await res.json()
  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/resend' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data  '{
  "submission": {
    "personal_full_name": "Jane Doe",
    "personal_phone_number": "123-456-7890",
    "personal_email": "jane.doe@example.com",
    "business_name": "Doe Law Firm",
    "business_address": "456 Elm Street, New York, NY",
    "business_phone_number": "987-654-3210",
    "business_email": "contact@doelaw.com",
    "business_flyer_duration": "60 days",
    "business_flyer_img": "https://example.com/flyer.jpg",
    "onApprove": "onApproveFunctionPlaceholder"
  }}' 

*/



/*

'{"submission" : '{"personal_full_name":"Test Name", "personal_phone_number" : "347-659-1866", "personal_email" : "temurbeksayfutdinov@gmail.com", "business_name" : "Test Business",
    "business_address" : "Test Address", "business_phone_number", : "347-659-1866", "business_email" : "businesstest@gmail.com", "business_flyer_duration" : "1 Month", "business_flyer_img" : ""}'}'

*/