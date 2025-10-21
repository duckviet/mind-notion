"use server";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default async function server(path: string, options: RequestInit = {}) {
  try {
    const headers = {
      ...options.headers,
    };
    const res = await fetch(`${baseURL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      throw await res.json();
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
}
