import { CLASSIC_URL, setExperience } from "../../../utils/experience"
import { buttonClass } from "./buttons"

// Way back to the 2D site (K33); a manual choice, remembered across visits.
export default function SimpleViewLink() {
  return (
    <a href={CLASSIC_URL} onClick={() => setExperience("classic")} className={`${buttonClass} pointer-events-auto`}>
      Simple view
    </a>
  )
}
