"""Scheduling routes for booking sessions with instructors."""

from datetime import datetime
from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    flash,
    current_app,
    request,
    jsonify,
)
from flask_login import login_required, current_user
from models import db
from models.submission import Submission
from models.scheduled_meeting import ScheduledMeeting
from models.user import User

scheduling_bp = Blueprint("scheduling", __name__, url_prefix="/schedule")


@scheduling_bp.route("/<int:submission_id>")
@login_required
def book(submission_id):
    """Display the Calendly booking page for a submission that needs more work."""
    submission = Submission.query.get_or_404(submission_id)

    # Validate submission belongs to current user
    if submission.user_id != current_user.id:
        flash("You can only schedule sessions for your own submissions.", "danger")
        return redirect(url_for("home"))

    # Validate submission has "Needs Work" status (instructor feedback with passed=False)
    if not submission.instructor_feedback or submission.instructor_feedback.passed:
        flash(
            "Scheduling is only available for submissions that need more work.",
            "warning",
        )
        return redirect(
            url_for("submissions.view_submission", submission_id=submission_id)
        )

    # Get Calendly URL from config
    calendly_url = current_app.config.get("CALENDLY_URL", "")

    if not calendly_url:
        flash(
            "Scheduling is not currently available. Please contact the instructor directly.",
            "warning",
        )
        return redirect(
            url_for("submissions.view_submission", submission_id=submission_id)
        )

    return render_template(
        "scheduling/book.html",
        submission=submission,
        calendly_url=calendly_url,
        student_email=current_user.email,
        student_name=current_user.email.split("@")[0],  # Use email prefix as name
    )


@scheduling_bp.route("/calendly-webhook", methods=["POST"])
def calendly_webhook():
    """Handle Calendly webhook for tracking scheduled meetings.

    Calendly sends a POST request when an event is created, cancelled, or rescheduled.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_type = data.get("event")
        payload = data.get("payload", {})

        # Extract event details
        event_uri = payload.get("event", {}).get("uri", "")
        invitee = payload.get("invitee", {})
        invitee_email = invitee.get("email", "")
        scheduled_at_str = payload.get("event", {}).get("start_time", "")

        # Parse scheduled time
        scheduled_at = None
        if scheduled_at_str:
            try:
                scheduled_at = datetime.fromisoformat(
                    scheduled_at_str.replace("Z", "+00:00")
                )
            except ValueError:
                pass

        # Find the student by email
        student = User.query.filter_by(email=invitee_email).first()
        if not student:
            # Could be a new user or email mismatch - log but don't fail
            return jsonify({"status": "ok", "message": "Student not found"}), 200

        if event_type == "invitee.created":
            # New meeting scheduled
            meeting = ScheduledMeeting(
                student_id=student.id,
                scheduled_at=scheduled_at,
                calendly_event_uri=event_uri,
                status="scheduled",
            )
            db.session.add(meeting)
            db.session.commit()

        elif event_type == "invitee.canceled":
            # Meeting cancelled
            meeting = ScheduledMeeting.query.filter_by(
                calendly_event_uri=event_uri
            ).first()
            if meeting:
                meeting.status = "cancelled"
                db.session.commit()

        return jsonify({"status": "ok"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@scheduling_bp.route("/meetings", methods=["GET"])
@login_required
def list_meetings():
    """List all scheduled meetings for the current user or all (admin)."""
    from middleware.auth import is_admin

    if is_admin(current_user):
        meetings = (
            ScheduledMeeting.query.filter_by(status="scheduled")
            .order_by(ScheduledMeeting.scheduled_at)
            .all()
        )
    else:
        meetings = (
            ScheduledMeeting.query.filter_by(
                student_id=current_user.id, status="scheduled"
            )
            .order_by(ScheduledMeeting.scheduled_at)
            .all()
        )

    return jsonify({"meetings": [m.to_dict() for m in meetings]})


@scheduling_bp.route("/meetings/<int:meeting_id>/complete", methods=["POST"])
@login_required
def complete_meeting(meeting_id):
    """Mark a meeting as completed."""
    from middleware.auth import is_admin

    meeting = ScheduledMeeting.query.get_or_404(meeting_id)

    # Only admin/instructor can mark meetings complete
    if not is_admin(current_user):
        return jsonify({"error": "Unauthorized"}), 403

    meeting.status = "completed"
    meeting.notes = request.json.get("notes", "") if request.is_json else ""
    db.session.commit()

    return jsonify({"status": "ok", "meeting": meeting.to_dict()})
