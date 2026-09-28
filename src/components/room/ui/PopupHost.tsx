import { labels } from "../labels"
import { useRoomData } from "../roomData"
import { useRoomStore } from "../store"
import Popup, { type TabDef } from "./Popup"
import AboutContactPopup from "./popups/AboutContactPopup"
import BlogTalksPopup from "./popups/BlogTalksPopup"
import CollectionPopup from "./popups/CollectionPopup"
import ProjectsPopup, { ProjectDetail } from "./popups/ProjectsPopup"
import TechStackPopup from "./popups/TechStackPopup"

const ABOUT_TABS: TabDef[] = [
  { id: "about", label: "About me" },
  { id: "contact", label: "Contact" }
]

const BLOG_TABS: TabDef[] = [
  { id: "blog", label: "Blog" },
  { id: "talks", label: "Talks" }
]

export default function PopupHost() {
  const popup = useRoomStore((state) => state.popup)
  const back = useRoomStore((state) => state.back)
  const setPopupTab = useRoomStore((state) => state.setPopupTab)
  const closePopup = useRoomStore((state) => state.closePopup)
  const data = useRoomData()

  if (!popup) return null
  const { section } = popup
  const close = closePopup

  if (section === "about-contact" || section === "blog-talks") {
    const tabs = section === "about-contact" ? ABOUT_TABS : BLOG_TABS
    const tab = tabs.some((t) => t.id === popup.tab) ? popup.tab! : tabs[0].id
    const Content = section === "about-contact" ? AboutContactPopup : BlogTalksPopup
    return (
      <Popup title={labels[section]} onClose={close} tabs={tabs} activeTab={tab} onTab={setPopupTab}>
        <Content tab={tab} />
      </Popup>
    )
  }

  if (section === "projects") {
    const project = data.projects.find((p) => p.id === popup.projectId)
    return (
      <Popup
        title={project ? project.title : labels.projects}
        onClose={close}
        headerAction={
          project && (
            <button
              type="button"
              onClick={back}
              className="cursor-pointer rounded-sm px-2 py-1 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Back to projects"
            >
              ←
            </button>
          )
        }
      >
        {project ? <ProjectDetail project={project} /> : <ProjectsPopup />}
      </Popup>
    )
  }

  if (section === "techstack") {
    return (
      <Popup title={labels.techstack} onClose={close}>
        <TechStackPopup />
      </Popup>
    )
  }

  const tabs = data.collections[section]
  const active = tabs.find((t) => t.id === popup.tab) ?? tabs[0]
  return (
    <Popup
      title={labels[section]}
      onClose={close}
      tabs={tabs.map(({ id, label }) => ({ id, label }))}
      activeTab={active?.id}
      onTab={setPopupTab}
    >
      <CollectionPopup tab={active} />
    </Popup>
  )
}
