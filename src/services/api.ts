const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers as Record<string, string>),
    } as HeadersInit,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

// Auth API
export async function login(email: string, password: string) {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name: string) {
  return fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

// Events API
export async function getEvents(start?: string, end?: string) {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  return fetchAPI(`/events?${params.toString()}`);
}

export async function createEvent(event: any) {
  return fetchAPI('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function updateEvent(id: number, event: any) {
  return fetchAPI(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
}

export async function deleteEvent(id: number) {
  return fetchAPI(`/events/${id}`, {
    method: 'DELETE',
  });
}

export async function aiSuggestTime(title: string, duration: number) {
  return fetchAPI('/events/ai-suggest-time', {
    method: 'POST',
    body: JSON.stringify({ title, duration }),
  });
}

// Emails API
export async function getEmails(folder = 'inbox', limit = 50, offset = 0) {
  return fetchAPI(`/emails?folder=${folder}&limit=${limit}&offset=${offset}`);
}

export async function getEmailStats() {
  return fetchAPI('/emails/stats');
}

export async function getEmail(id: number) {
  return fetchAPI(`/emails/${id}`);
}

export async function sendEmail(accountId: number, to: string, subject: string, html: string, cc?: string, bcc?: string) {
  return fetchAPI('/emails/send', {
    method: 'POST',
    body: JSON.stringify({ accountId, to, subject, html, cc, bcc }),
  });
}

export async function generateReply(emailId: number, context?: string) {
  return fetchAPI(`/emails/${emailId}/ai-reply`, {
    method: 'POST',
    body: JSON.stringify({ context }),
  });
}

export async function searchEmails(query: string) {
  return fetchAPI('/emails/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function moveEmailToFolder(emailId: number, folder: string) {
  return fetchAPI(`/emails/${emailId}/folder`, {
    method: 'PUT',
    body: JSON.stringify({ folder }),
  });
}

export async function analyzeEmail(emailId: number) {
  return fetchAPI(`/emails/${emailId}/ai-analyze`, {
    method: 'POST',
  });
}

// Accounts API
export async function getEmailAccounts() {
  return fetchAPI('/accounts');
}

export async function addEmailAccount(provider: string, email: string, accessToken?: string, refreshToken?: string) {
  return fetchAPI('/accounts', {
    method: 'POST',
    body: JSON.stringify({ provider, email, accessToken, refreshToken }),
  });
}

export async function removeEmailAccount(id: number) {
  return fetchAPI(`/accounts/${id}`, {
    method: 'DELETE',
  });
}
