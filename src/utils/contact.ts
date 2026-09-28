export interface ContactPayload {
  email: string
  name: string
  message: string
}

export function validateContact({ email, name, message }: ContactPayload): string | null {
  if (!email) return "Email is required!"
  if (!name) return "Name is required!"
  if (!message) return "Message is required!"
  return null
}

// Resolves with the API's success message; rejects with a user-facing Error.
export async function sendContact(
  url: string | undefined,
  payload: ContactPayload
): Promise<string> {
  const invalid = validateContact(payload)
  if (invalid) throw new Error(invalid)
  if (!url) throw new Error("API is not ready")

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
  const data = await response.json()

  if (response.status !== 200) throw new Error(data.message)
  return data.message
}
