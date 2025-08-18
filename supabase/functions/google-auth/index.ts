import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const encryptionKey = Deno.env.get('GOOGLE_TOKEN_ENCRYPTION_KEY')!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Encryption utilities for secure token storage
async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(encryptionKey.slice(0, 32)); // Use first 32 chars as key
  const tokenData = encoder.encode(token);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    tokenData
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(encryptedToken: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const keyData = encoder.encode(encryptionKey.slice(0, 32));
    
    const combined = new Uint8Array(atob(encryptedToken).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token');
  }
}

// Comprehensive audit logging
async function logCredentialAccess(credentialId: string, action: string, req: Request, success: boolean = true, errorMessage?: string) {
  try {
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    await supabaseAdmin
      .from('google_credentials_audit_log')
      .insert({
        credential_id: credentialId,
        action,
        user_agent: userAgent,
        ip_address: ipAddress,
        edge_function_name: 'google-auth',
        success,
        error_message: errorMessage
      });
  } catch (error) {
    console.error('Failed to log credential access:', error);
  }
}

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
    // SECURITY: Check authentication for all requests
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT and get user info
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ Invalid JWT token:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Check if user is admin for sensitive operations
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error checking user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = profile?.role === 'admin';
    
    // Log authenticated request
    console.log(`✅ Authenticated request from ${user.email} (admin: ${isAdmin})`);

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

    // SECURITY: Restrict sensitive operations to admin users only
    const sensitiveOperations = ['test_connection', 'list_workspace_users'];
    if (sensitiveOperations.includes(action) && !isAdmin) {
      console.log(`❌ Non-admin user ${user.email} attempted ${action}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'test_connection': {
        // Test the service account connection
        const accessToken = await getAccessToken(serviceAccountKey);
        
        // Encrypt tokens for secure storage
        const encryptedAccessToken = await encryptToken(accessToken);
        const encryptedRefreshToken = await encryptToken('service_account_token');
        
        // Store admin credentials in database with encryption
        const credentialData = {
          admin_email: serviceAccountKey.client_email,
          access_token: accessToken, // Legacy field for compatibility
          refresh_token: 'service_account_token', // Legacy field
          encrypted_access_token: encryptedAccessToken,
          encrypted_refresh_token: encryptedRefreshToken,
          token_expires_at: new Date(Date.now() + 3600000).toISOString(),
          domain: extractDomainFromEmail(serviceAccountKey.client_email),
          scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/admin.directory.user.readonly'],
          token_version: 1,
          rotation_count: 0,
          security_flags: {
            encrypted: true,
            last_rotation: new Date().toISOString(),
            encryption_method: 'AES-GCM'
          }
        };

        const { data: insertedCredential, error: insertError } = await supabaseAdmin
          .from('admin_google_credentials')
          .upsert(credentialData, { onConflict: 'admin_email' })
          .select('id')
          .single();

        if (insertError) {
          throw insertError;
        }

        // Log the credential creation
        await logCredentialAccess(insertedCredential.id, 'create', req, true);

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Google Service Account connected successfully with enhanced security',
          serviceAccountEmail: serviceAccountKey.client_email,
          securityFeatures: ['token_encryption', 'audit_logging', 'rotation_tracking']
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
          
          // Request user data with photo information explicitly
          const response = await fetch(`https://admin.googleapis.com/admin/directory/v1/users?domain=${domain}&maxResults=500&projection=full&viewType=admin_view`, {
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
          
          // Log what we're getting from Google to debug photo URLs
          if (data.users && data.users.length > 0) {
            console.log('Sample user data from Google:', JSON.stringify(data.users[0], null, 2));
            data.users.forEach(user => {
              if (user.thumbnailPhotoUrl) {
                console.log(`User ${user.name?.fullName} has photo URL: ${user.thumbnailPhotoUrl}`);
              } else {
                console.log(`User ${user.name?.fullName} has NO photo URL`);
              }
            });
          }
          
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

        console.log('Validating email:', email);
        
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
        
        console.log('Using admin email for validation:', adminEmail);
        
        const accessToken = await getAccessToken(serviceAccountKey, adminEmail);
        
        const response = await fetch(`https://admin.googleapis.com/admin/directory/v1/users/${email}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Validation response status:', response.status);
        
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

        console.log('Getting user profile for:', email);
        
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
        
        console.log('Using admin email for profile fetch:', adminEmail);
        
        const accessToken = await getAccessToken(serviceAccountKey, adminEmail);
        
        const response = await fetch(`https://admin.googleapis.com/admin/directory/v1/users/${email}?projection=full&viewType=admin_view`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Directory API error for user profile:', error);
          throw new Error(`Directory API error: ${error}`);
        }

        const userData = await response.json();
        console.log('User profile data received:', JSON.stringify(userData, null, 2));
        
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

        console.log('Creating event for user:', userEmail);
        console.log('Event data received:', JSON.stringify(eventData, null, 2));
        console.log('Attendees in event data:', eventData.attendees);

        const accessToken = await getAccessToken(serviceAccountKey, userEmail);
        
        const eventPayload = {
          ...eventData,
          sendNotifications: true,
          // Add Google Meet conference data
          conferenceData: {
            createRequest: {
              requestId: `meet-${Date.now()}`, // Unique request ID
              conferenceSolutionKey: {
                type: 'hangoutsMeet'
              }
            }
          }
        };

        console.log('Final event payload being sent to Google Calendar:', JSON.stringify(eventPayload, null, 2));
        
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${userEmail}/events?sendUpdates=all&conferenceDataVersion=1`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Calendar API error response:', error);
          throw new Error(`Calendar API error: ${error}`);
        }

        const event = await response.json();
        console.log('Google Calendar event created:', JSON.stringify(event, null, 2));
        
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
        
        // Use Events API instead of FreeBusy to filter by response status
        const results = {};
        
        for (const email of emailsToCheck) {
          try {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${email}/events?timeMin=${encodeURIComponent(eventData.timeMin)}&timeMax=${encodeURIComponent(eventData.timeMax)}&singleEvents=true&orderBy=startTime`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              const error = await response.text();
              console.error(`Calendar API error for ${email}:`, error);
              // Set empty busy times for this user if API fails
              results[email] = { busy: [] };
              continue;
            }

            const events = await response.json();
            console.log(`Events for ${email}:`, events.items?.length || 0);
            
            // Filter events to only include ones where user is attending
            const busyTimes = [];
            for (const event of events.items || []) {
              // Skip all-day events
              if (!event.start?.dateTime || !event.end?.dateTime) {
                continue;
              }
              
              // Check if user has accepted or is the organizer
              let isAttending = false;
              
              // If user is organizer, they're attending
              if (event.organizer?.email === email) {
                isAttending = true;
              } else {
                // Check attendee response status
                const attendee = event.attendees?.find(att => att.email === email);
                if (attendee) {
                  // Only count as busy if accepted or tentative (not declined or needsAction)
                  isAttending = attendee.responseStatus === 'accepted' || attendee.responseStatus === 'tentative';
                } else {
                  // If not in attendees list but event exists in their calendar, assume attending
                  isAttending = true;
                }
              }
              
              if (isAttending) {
                busyTimes.push({
                  start: event.start.dateTime,
                  end: event.end.dateTime
                });
              }
            }
            
            results[email] = { busy: busyTimes };
            console.log(`Busy times for ${email}:`, busyTimes.length);
            
          } catch (error) {
            console.error(`Error checking availability for ${email}:`, error);
            results[email] = { busy: [] };
          }
        }
        
        // Format response to match FreeBusy API structure
        const availability = {
          calendars: results
        };
        
        console.log('Final availability response:', availability);
        
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
