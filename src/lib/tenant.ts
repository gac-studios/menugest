export function getSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Local dev: use ?tenant=slug query param
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get('tenant');
  if (tenantParam) return tenantParam;

  // Production: extract subdomain
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'app') return sub;
  }

  return null;
}

export function isAdminDomain(): boolean {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] === 'app') return true;
  // In dev, if no tenant param, treat as admin
  return !getSubdomain();
}
