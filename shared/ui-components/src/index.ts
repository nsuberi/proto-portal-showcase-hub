/**
 * @proto-portal/ui-components
 * Shared React component library for the Proto Portal design system.
 *
 * Core UI components (extracted from prototypes):
 * Button, Card, Badge, Input, Label, Progress, Select, Table, Dialog, Popover
 *
 * Codecademy-inspired learning components:
 * ProgressRing, ProgressSegments, XPBar, StepChecklist,
 * CategoryBadge, CollapsibleHint, QuizOption
 *
 * Curriculum-mapped components (from additional-structure.md):
 * OnboardingRadioGroup, ResumeLearningCard, SyllabusItem,
 * EventCard, SettingsToggle, TemplateCardGroup
 */

// Utility
export { cn } from "./lib/utils"

// Core UI — extracted from prototypes (identical across ffx-skill-map, documentation-explorer, home-lending-learning)
export { Button, type ButtonProps } from "./components/button"
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./components/card"
export { Badge, badgeVariants, type BadgeProps } from "./components/badge"
export { Input, type InputProps } from "./components/input"
export { Label } from "./components/label"
export { Progress } from "./components/progress"
export {
  Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
  SelectLabel, SelectItem, SelectSeparator,
  SelectScrollUpButton, SelectScrollDownButton,
} from "./components/select"
export {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell, TableCaption,
} from "./components/table"
export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "./components/dialog"
export { Popover, PopoverTrigger, PopoverContent } from "./components/popover"

// Codecademy-inspired learning components
export { ProgressRing, type ProgressRingProps } from "./components/progress-ring"
export { ProgressSegments, type ProgressSegmentsProps, type ProgressSegment } from "./components/progress-segments"
export { XPBar, type XPBarProps } from "./components/xp-bar"
export { StepChecklist, type StepChecklistProps, type StepChecklistItem } from "./components/step-checklist"
export { CategoryBadge, type CategoryBadgeProps } from "./components/category-badge"
export { CollapsibleHint, type CollapsibleHintProps } from "./components/collapsible-hint"
export { QuizOption, type QuizOptionProps } from "./components/quiz-option"

// Curriculum-mapped components
export { OnboardingRadioGroup, type OnboardingRadioGroupProps, type RadioOption } from "./components/onboarding-radio-group"
export { ResumeLearningCard, type ResumeLearningCardProps } from "./components/resume-learning-card"
export { SyllabusItem, type SyllabusItemProps, type SyllabusItemType } from "./components/syllabus-item"
export { EventCard, type EventCardProps } from "./components/event-card"
export { SettingsToggle, type SettingsToggleProps } from "./components/settings-toggle"
export { TemplateCardGroup, type TemplateCardGroupProps, type TemplateOption } from "./components/template-card"

// Flow-critical components (from deeper Codecademy analysis)
export { CodeDiffView, type CodeDiffViewProps } from "./components/code-diff-view"
export { QuizSummary, type QuizSummaryProps, type QuizAnswer } from "./components/quiz-summary"
export { WeeklyTarget, type WeeklyTargetProps } from "./components/weekly-target"
export { AIChatPanel, type AIChatPanelProps, type ChatMessage } from "./components/ai-chat-panel"
export { FeatureDiscoveryCard, type FeatureDiscoveryCardProps } from "./components/feature-discovery-card"
export { TestimonialCard, type TestimonialCardProps } from "./components/testimonial-card"
export { LoadingState, type LoadingStateProps } from "./components/loading-state"

// Exercise & assessment components
export { FillInBlank, type FillInBlankProps, type BlankSlot } from "./components/fill-in-blank"
export { InlineFeedbackQuiz, type InlineFeedbackQuizProps, type InlineFeedbackOption } from "./components/inline-feedback-quiz"
export { SkillMatrix, type SkillMatrixProps, type SkillSet, type Skill } from "./components/skill-matrix"
export { ConceptReference, type ConceptReferenceProps, type Concept } from "./components/concept-reference"
export { StudyPlanBanner, type StudyPlanBannerProps } from "./components/study-plan-banner"
export { ProjectGenerator, type ProjectGeneratorProps } from "./components/project-generator"

// Final verification components
export { StarRating, type StarRatingProps } from "./components/star-rating"
export { CertificateModal, type CertificateModalProps } from "./components/certificate-modal"
export { AIReviewPanel, type AIReviewPanelProps, type ReviewSection, type ReviewFeedbackItem } from "./components/ai-review-panel"
