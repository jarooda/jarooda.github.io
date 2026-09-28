import { useState, type FormEvent } from "react"
import { socials } from "../../../../data/socials"
import { sendContact } from "../../../../utils/contact"
import { useRoomData } from "../../roomData"
import { buttonClass } from "../buttons"
import { externalLink } from "../format"

type Status = { kind: "idle" | "sending" } | { kind: "success" | "error"; message: string }

const inputClass =
  "block w-full rounded-sm border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none dark:border-gray-500 dark:text-gray-100 dark:focus:border-green-500"

function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const field = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value
    setStatus({ kind: "sending" })
    try {
      const message = await sendContact(import.meta.env.PUBLIC_CONTACT_ME_API, {
        email: field("email"),
        name: field("name"),
        message: field("message")
      })
      form.reset()
      setStatus({ kind: "success", message })
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Something went wrong" })
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <label className="text-sm">
        Your email
        <input name="email" type="email" autoComplete="email" className={inputClass} />
      </label>
      <label className="text-sm">
        Your name
        <input name="name" type="text" autoComplete="name" className={inputClass} />
      </label>
      <label className="text-sm">
        Your message
        <textarea name="message" rows={5} className={`${inputClass} resize-none`} />
      </label>
      <div className="flex items-center justify-between gap-4">
        <p
          role="status"
          className={`text-sm ${status.kind === "error" ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}
        >
          {"message" in status ? status.message : ""}
        </p>
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className={`shrink-0 ${buttonClass}`}
        >
          {status.kind === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  )
}

export function ContactContent() {
  return (
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Find me on</h3>
          <ul className="flex flex-wrap gap-2">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.url}
                  {...externalLink}
                  className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm capitalize hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Or send a message</h3>
          <ContactForm />
        </section>
      </div>
  )
}

export function AboutContent() {
  const { about } = useRoomData()
  return <div className="blog room-prose" dangerouslySetInnerHTML={{ __html: about.html }} />
}

export default function AboutContactPopup({ tab }: { tab: string }) {
  return tab === "contact" ? <ContactContent /> : <AboutContent />
}
