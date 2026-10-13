import type { SavedReport } from '../services/reportStore'

interface SavedDraftRowProps {
  draft: SavedReport
  onResume: () => void
  onDelete: () => void
}

export function SavedDraftRow({ draft, onResume, onDelete }: SavedDraftRowProps) {
  return (
    <article className="saved-report-row">
      <div>
        <h3>Continue your report</h3>
        <p>Progress saved {new Date(draft.updatedAt).toLocaleString()}</p>
      </div>
      <div className="saved-report-actions">
        <button className="saved-report-action" type="button" onClick={onResume}>Resume</button>
        <button className="saved-report-delete" type="button" onClick={onDelete}>Delete</button>
      </div>
    </article>
  )
}
