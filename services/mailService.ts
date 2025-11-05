
import type { Email, EmailBody } from '../types';

const API_BASE_URL = 'https://www.1secmail.com/api/v1/';

export const generateRandomEmail = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}?action=genRandomMailbox&count=1`);
  if (!response.ok) {
    throw new Error('Failed to generate email');
  }
  const data = await response.json();
  return data[0];
};

export const getMessages = async (login: string, domain: string): Promise<Email[]> => {
  const response = await fetch(`${API_BASE_URL}?action=getMessages&login=${login}&domain=${domain}`);
  if (!response.ok) {
    // It's normal to get a 404 if inbox is empty, so we don't throw an error here.
    if(response.status === 404) return [];
    throw new Error('Failed to fetch messages');
  }
  return await response.json();
};

export const readMessage = async (login: string, domain: string, id: number): Promise<EmailBody> => {
  const response = await fetch(`${API_BASE_URL}?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
  if (!response.ok) {
    throw new Error('Failed to read message');
  }
  return await response.json();
};
