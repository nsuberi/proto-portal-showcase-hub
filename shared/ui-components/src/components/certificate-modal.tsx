import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../lib/utils"

/**
 * Certificate of completion modal — Codecademy achievement display.
 * Shows certificate preview with actions: edit name, save PDF, add to profile.
 *
 * Curriculum: Go-to-market (recording compelling evidence of work)
 *             Community of Practice (showing proof, legitimate peripheral participation)
 */

export interface CertificateModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  recipientName: string
  courseName: string
  date?: string
  onEditName?: () => void
  onSavePDF?: () => void
  onAddToProfile?: () => void
}

const CertificateModal = React.forwardRef<HTMLDivElement, CertificateModalProps>(
  ({
    open, onClose, recipientName, courseName, date,
    onEditName, onSavePDF, onAddToProfile,
    className, ...props
  }, ref) => {
    if (!open) return null

    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/80 animate-fade-in" onClick={onClose} />
        <div
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl",
            "bg-card border rounded-lg shadow-lg animate-fade-scale-in",
            className
          )}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="text-sm font-semibold">Certificate of Completion</h3>
            <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Certificate preview */}
          <div className="p-8">
            <div className="border-2 border-border rounded p-8 text-center space-y-4 bg-background">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Certificate of Completion</p>
              {date && <p className="text-xs text-muted-foreground">{date}</p>}
              <p className="text-2xl font-bold">{recipientName}</p>
              <div className="w-16 h-px bg-border mx-auto" />
              <p className="text-base font-medium">{courseName}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-5 py-3 border-t">
            {onEditName && (
              <button
                type="button"
                onClick={onEditName}
                className="text-sm font-medium text-primary hover:underline"
              >
                Edit Name
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {onSavePDF && (
                <button
                  type="button"
                  onClick={onSavePDF}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
                >
                  Save as PDF
                </button>
              )}
              {onAddToProfile && (
                <button
                  type="button"
                  onClick={onAddToProfile}
                  className="px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Add to Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }
)
CertificateModal.displayName = "CertificateModal"

export { CertificateModal }
