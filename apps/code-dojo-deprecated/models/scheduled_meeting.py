"""Scheduled meeting model for tracking instructor-student meetings."""

from datetime import datetime
from models import db


class ScheduledMeeting(db.Model):
    """Tracks meetings scheduled via Calendly webhook or manual entry."""

    __tablename__ = "scheduled_meetings"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    instructor_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    submission_id = db.Column(db.Integer, db.ForeignKey("submissions.id"))
    scheduled_at = db.Column(db.DateTime)  # Meeting time
    calendly_event_uri = db.Column(db.String(255))  # Calendly event ID
    status = db.Column(
        db.String(20), default="scheduled"
    )  # scheduled, completed, cancelled
    notes = db.Column(db.Text)  # Optional notes about the meeting
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    student = db.relationship(
        "User",
        foreign_keys=[student_id],
        backref=db.backref("scheduled_meetings", lazy="dynamic"),
    )
    instructor = db.relationship("User", foreign_keys=[instructor_id])
    submission = db.relationship(
        "Submission", backref=db.backref("scheduled_meetings", lazy="dynamic")
    )

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "student_id": self.student_id,
            "instructor_id": self.instructor_id,
            "submission_id": self.submission_id,
            "scheduled_at": (
                self.scheduled_at.isoformat() + "Z" if self.scheduled_at else None
            ),
            "calendly_event_uri": self.calendly_event_uri,
            "status": self.status,
            "notes": self.notes,
            "created_at": (
                self.created_at.isoformat() + "Z" if self.created_at else None
            ),
            "updated_at": (
                self.updated_at.isoformat() + "Z" if self.updated_at else None
            ),
        }

    def __repr__(self):
        return f"<ScheduledMeeting {self.id} student={self.student_id} status={self.status}>"
