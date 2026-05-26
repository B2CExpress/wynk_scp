export async function loginAs(input: {
  baseUrl: string;
  slug: string;
  email: string;
  password: string;
}): Promise<Record<string, string>> {
  const response = await fetch(`${input.baseUrl}/auth/${input.slug}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed for ${input.email}: ${response.status}`);
  }

  const cookies = response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';', 1)[0])
    .join('; ');

  return { Cookie: cookies };
}
