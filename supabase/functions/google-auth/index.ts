import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// JWT signing function for Google Service Account
async function createJWT(serviceAccountKey: any, userEmail?: string) {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour expiry

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/admin.directory.user.readonly'
  ].join(' ');

  const payload = {
    iss: serviceAccountKey.client_email,
    scope: scopes,
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
    ...(userEmail && { sub: userEmail })
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const privateKeyPem = serviceAccountKey.private_key;
  
  // Clean and format the private key properly
  let cleanedKey = privateKeyPem.replace(/\\n/g, '\n');
  
  // Ensure proper PEM format
  if (!cleanedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: missing BEGIN marker');
  }
  if (!cleanedKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: missing END marker');
  }

  // Extract the base64 content between the markers
  const pemContent = cleanedKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');

  // Convert base64 to binary
  const binaryKey = atob(pemContent);
  const keyBytes = new Uint8Array(binaryKey.length);
  for (let i = 0; i < binaryKey.length; i++) {
    keyBytes[i] = binaryKey.charCodeAt(i);
  }

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${unsignedToken}.${encodedSignature}`;
}

// Get access token from Google
async function getAccessToken(serviceAccountKey: any, userEmail?: string) {
  try {
    const jwt = await createJWT(serviceAccountKey, userEmail);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token request failed:', errorData);
      
      if (errorData.includes('unauthorized_client')) {
        throw new Error(`Domain-wide delegation not properly configured. Please ensure:\n1. Service account has domain-wide delegation enabled\n2. Admin has authorized these scopes in Google Workspace Admin Console:\n   - https://www.googleapis.com/auth/calendar\n   - https://www.googleapis.com/auth/calendar.events\n   - https://www.googleapis.com/auth/admin.directory.user.readonly\n\nDetailed error: ${errorData}`);
      }
      
      throw new Error(`Token request failed: ${errorData}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userEmail, eventData, email, userEmails } = await req.json();
    console.log('Processing action:', action);
    const serviceAccountKeyStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    
    if (!serviceAccountKeyStr) {
      console.error('Google Service Account key not configured');
      return new Response(JSON.stringify({ 
        error: 'Google Service Account key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let serviceAccountKey;
    try {
      serviceAccountKey = JSON.parse(serviceAccountKeyStr);
    } catch (parseError) {
      console.error('Invalid service account key format:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid service account key format' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Service account email:', serviceAccountKey.client_email);

    switch (action) {
      case 'test_connection': {
        // Test the service account connection
        const accessToken = await getAccessToken(serviceAccountKey);
        
        // Store admin credentials in database
        const { error: insertError } = await supabase
          .from('admin_google_credentials')
          .upsert({
            admin_email: serviceAccountKey.client_email,
            access_token: accessToken,
            refresh_token: 'service_account_token',
            token_expires_at: new Date(Date.now() + 3600000).toISOString(),
            domain: extractDomainFromEmail(serviceAccountKey.client_email),
            scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/admin.directory.user.readonly']
          });

        if (insertError) {
          throw insertError;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Google Service Account connected successfully',
          serviceAccountEmail: serviceAccountKey.client_email
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_workspace_users': {
        // Use the configured admin email from environment variables
        const adminEmail = Deno.env.get('GOOGLE_ADMIN_EMAIL');
        
        if (!adminEmail) {
          console.error('GOOGLE_ADMIN_EMAIL environment variable is required');
          return new Response(JSON.stringify({ 
            error: 'GOOGLE_ADMIN_EMAIL environment variable is required for domain-wide delegation' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        console.log('Using admin email for impersonation:', adminEmail);
        console.log('Service account email:', serviceAccountKey.client_email);
        
        try {
          const accessToken = await getAccessToken(serviceAccountKey, adminEmail);
          
          const domain = extractDomainFromEmail(adminEmail);
          console.log('Fetching users for domain:', domain);
          
          const response = await fetch(`https://admin.googleapis.com/admin/directory/v1/users?domain=${domain}&maxResults=500`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const error = await response.text();
            console.error('Directory API error:', error);
            throw new Error(`Directory API error: ${error}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify({ 
            success: true, 
            users: data.users || [] 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error in list_workspace_users:', error);
          throw error;
        }
      }

      case 'validate_email': {
        if (!email) {
          throw new Error('Email is required');
        }

        const adminEmail = extractAdminEmailFromDomain(serviceAccountKey.client_email);
        const accessToken = await getAccessToken(serviceAccountKey, adminEmail);
        
        const response = await fetch(`https://admin.googleapis.com/admin/directory/v1/users/${email}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        return new Response(JSON.stringify({ 
          success: true, 
          valid: response.ok 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_user_profile': {
        if (!email) {
          throw new Error('Email is required');
        }

        const adminEmail = extractAdminEmailFromDomain(serviceAccountKey.client_email);
        const accessToken = await getAccessToken(serviceAccountKey, adminEmail);
        
        const response = await fetch(`https://admin.googleapis.com/admin/directory/v1/users/${email}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Directory API error: ${error}`);
        }

        const userData = await response.json();
        return new Response(JSON.stringify({ 
          success: true, 
          user: userData 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_event': {
        if (!userEmail || !eventData) {
          throw new Error('User email and event data required');
        }

        const accessToken = await getAccessToken(serviceAccountKey, userEmail);
        
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${userEmail}/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Calendar API error: ${error}`);
        }

        const event = await response.json();
        return new Response(JSON.stringify({ success: true, event }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_availability': {
        const emailsToCheck = userEmails || (userEmail ? [userEmail] : []);
        
        if (!emailsToCheck || emailsToCheck.length === 0) {
          throw new Error('User email required');
        }

        console.log('Checking availability for emails:', emailsToCheck);

        // Get admin access token for calendar API
        const adminEmail = Deno.env.get('GOOGLE_ADMIN_EMAIL');
        if (!adminEmail) {
          throw new Error('Google admin email not configured');
        }

        const accessToken = await getAccessToken(serviceAccountKey, adminEmail);
        
        const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeMin: eventData.timeMin,
            timeMax: eventData.timeMax,
            items: emailsToCheck.map(email => ({ id: email }))
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Calendar API error:', error);
          throw new Error(`Calendar API error: ${error}`);
        }

        const availability = await response.json();
        console.log('Calendar API response:', availability);
        
        return new Response(JSON.stringify({ success: true, availability }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in google-auth function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractDomainFromEmail(email: string): string {
  return email.split('@')[1] || 'unknown';
}

function extractAdminEmailFromDomain(serviceAccountEmail: string): string {
  // For service accounts, we need to impersonate an admin user
  // This should be configured to use a real admin email from your domain
  const domain = extractDomainFromEmail(serviceAccountEmail);
  
  // Common admin email patterns - try these in order
  const commonAdminEmails = [
    `admin@${domain}`,
    `administrator@${domain}`,
    `it@${domain}`,
    `support@${domain}`
  ];
  
  // Return the first one - in practice, you should configure GOOGLE_ADMIN_EMAIL environment variable
  return commonAdminEmails[0];
}
