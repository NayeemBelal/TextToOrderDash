import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const UPLOAD_BUCKET = 'onboarding-uploads';
const SIGNED_URL_TTL = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    // Files were uploaded browser-side to Supabase Storage; the client now sends
    // a small JSON body with their object paths (never the file bytes — that was
    // exceeding the Netlify function's ~6MB request limit and returning a 500).
    const body = await req.json();

    const {
      brandName,
      orgLegalName,
      legalForm,
      legalEntityType,
      taxId,
      contactFirstName,
      contactLastName,
      contactTitle,
      contactEmail,
      contactPhone,
      registeredAddress,
      city,
      state,
      zipCode,
      storePhone,
      storeEmail,
      websiteUrl,
      accountEmail,
      cloverMerchantId,
      cloverApiKey,
      cloverEcomApiKey,
      verificationDocPath,
      verificationDocName,
      logoPath,
      logoName,
    } = body;

    const hasClover = !!(cloverMerchantId || cloverApiKey || cloverEcomApiKey);

    // Mint time-limited signed URLs for the uploaded files using the service role
    // (the bucket is private, so these links let the ops team view/download them).
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    async function signedUrlFor(path: string | null | undefined): Promise<string | null> {
      if (!path) return null;
      const { data, error } = await supabaseAdmin.storage
        .from(UPLOAD_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (error) {
        console.error(`Signed URL error for ${path}:`, error.message);
        return null;
      }
      return data?.signedUrl ?? null;
    }

    const [verificationDocUrl, logoUrl] = await Promise.all([
      signedUrlFor(verificationDocPath),
      signedUrlFor(logoPath),
    ]);

    const fileCell = (name: string | null | undefined, url: string | null) =>
      url
        ? `<a href="${url}">${name || 'Download'}</a> <span style="color:#94a3b8">(link valid 30 days)</span>`
        : 'Not provided';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #0F172A; background: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 640px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #b88862; padding: 28px 32px; }
    .header h1 { color: white; margin: 0; font-size: 22px; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 28px 32px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 0; font-size: 14px; vertical-align: top; }
    td:first-child { color: #64748b; width: 45%; }
    td:last-child { color: #0F172A; font-weight: 500; }
    .footer { padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>New Marketing Onboarding</h1>
      <p>${brandName} — submitted ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
    </div>
    <div class="body">

      <div class="section">
        <div class="section-title">Account</div>
        <table>
          <tr><td>Account Email</td><td>${accountEmail}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Business Identity</div>
        <table>
          <tr><td>Organization Legal Name</td><td>${orgLegalName}</td></tr>
          <tr><td>Brand Name</td><td>${brandName}</td></tr>
          <tr><td>Legal Form</td><td>${legalForm}</td></tr>
          <tr><td>Legal Entity Type</td><td>${legalEntityType}</td></tr>
          <tr><td>National Tax ID / EIN</td><td>${taxId}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Contact Information</div>
        <table>
          <tr><td>Name</td><td>${contactFirstName} ${contactLastName}</td></tr>
          <tr><td>Title</td><td>${contactTitle}</td></tr>
          <tr><td>Business Email</td><td>${contactEmail}</td></tr>
          <tr><td>Phone</td><td>${contactPhone}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Registered Address</div>
        <table>
          <tr><td>Street</td><td>${registeredAddress}</td></tr>
          <tr><td>City</td><td>${city}</td></tr>
          <tr><td>State</td><td>${state}</td></tr>
          <tr><td>ZIP</td><td>${zipCode}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Store Details</div>
        <table>
          <tr><td>Store Phone</td><td>${storePhone}</td></tr>
          <tr><td>Store Email</td><td>${storeEmail}</td></tr>
          <tr><td>Website</td><td>${websiteUrl || '—'}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Clover POS Credentials</div>
        <table>
          ${hasClover ? `
          <tr><td>Merchant ID</td><td>${cloverMerchantId || '—'}</td></tr>
          <tr><td>API Key</td><td>${cloverApiKey || '—'}</td></tr>
          <tr><td>Ecommerce API Key</td><td>${cloverEcomApiKey || '—'}</td></tr>
          ` : `<tr><td>Status</td><td>Skipped — not provided</td></tr>`}
        </table>
      </div>

      <div class="section">
        <div class="section-title">Uploaded Files</div>
        <table>
          <tr><td>Verification Document</td><td>${fileCell(verificationDocName, verificationDocUrl)}</td></tr>
          <tr><td>Logo</td><td>${fileCell(logoName, logoUrl)}</td></tr>
        </table>
      </div>

    </div>
    <div class="footer">Submitted via Belan Marketing Onboarding · belan.tech</div>
  </div>
</body>
</html>`;

    const { data, error: sendError } = await resend.emails.send({
      from: 'Belan Onboarding <sales@belan.tech>',
      to: 'belal.nayeem1@gmail.com',
      subject: `New Marketing Onboarding — ${brandName}`,
      html,
    });

    if (sendError) {
      console.error('Resend error:', JSON.stringify(sendError));
      return NextResponse.json({ error: sendError.message ?? 'Email send failed' }, { status: 500 });
    }

    console.log('Email sent, id:', data?.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Marketing onboarding error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
