interface DraftDeleteDialogProps {
  onCancel: () => void
  onConfirm: () => void
}

export function DraftDeleteDialog({ onCancel, onConfirm }: DraftDeleteDialogProps) {
  return (
    <div className="confirmation-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-delete-title"
        aria-describedby="draft-delete-message"
        onClick={event => event.stopPropagation()}
      >
        <h3 id="draft-delete-title">Delete this report draft?</h3>
        <p id="draft-delete-message">This permanently deletes your saved progress. This action cannot be undone.</p>
        <div className="confirmation-modal-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="reset-button" type="button" onClick={onConfirm}>Delete draft</button>
        </div>
      </div>
    </div>
  )
}
