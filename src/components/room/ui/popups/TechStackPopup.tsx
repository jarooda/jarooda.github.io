import { techStack } from "../../../../data/techstack"

// Interim list view; the Rubik (K18) replaces this popup.
export default function TechStackPopup() {
  return (
    <div className="flex flex-col gap-5">
      {techStack.map((category) => (
        <section key={category.category}>
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">{category.category}</h3>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {category.items.map((item) => (
              <li
                key={item.name}
                className="flex flex-col items-center gap-1 rounded-md bg-gray-50 p-2 text-center text-xs dark:bg-gray-700"
              >
                <img src={item.logo} alt="" crossOrigin="anonymous" loading="lazy" className="h-8 w-8 object-contain" />
                {item.name}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
