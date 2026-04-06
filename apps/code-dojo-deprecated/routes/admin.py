"""Admin and instructor routes."""

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models import db
from models.user import User
from models.submission import Submission
from models.instructor_feedback import InstructorFeedback
from models.goal import LearningGoal
from models.anatomy_topic import AnatomyTopic
from models.anatomy_conversation import AnatomyConversation
from models.goal_progress import GoalProgress
from models.core_learning_goal import CoreLearningGoal
from models.agent_session import AgentSession
from models.scheduled_meeting import ScheduledMeeting
from middleware.auth import require_admin, require_instructor
from services.github import fetch_github_diff, calculate_diff_stats
from config import Config

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.route("/")
@require_admin
def dashboard():
    """Admin dashboard showing all students and submissions."""
    students = (
        User.query.filter(User.role == "student").order_by(User.created_at.desc()).all()
    )
    submissions = Submission.query.order_by(Submission.created_at.desc()).all()
    pending_reviews = Submission.query.filter_by(status="feedback_requested").count()

    return render_template(
        "admin/dashboard.html",
        students=students,
        submissions=submissions,
        pending_reviews=pending_reviews,
    )


@admin_bp.route("/submissions/<int:submission_id>/review", methods=["GET", "POST"])
@require_instructor
def review_submission(submission_id):
    """Instructor view for reviewing a submission."""
    submission = Submission.query.get_or_404(submission_id)
    goal = submission.goal

    # Try to get the diff for display
    diff_content = None
    diff_stats = {"file_count": 0, "total_additions": 0, "total_deletions": 0}
    try:
        diff_content = fetch_github_diff(
            goal.starter_repo, submission.repo_url, submission.branch
        )
        if diff_content:
            diff_stats = calculate_diff_stats(diff_content)
    except Exception:
        pass

    if request.method == "POST":
        comment = request.form.get("comment", "").strip()
        passed = request.form.get("passed") == "true"

        # Check if feedback already exists
        if submission.instructor_feedback:
            # Update existing feedback
            submission.instructor_feedback.comment = comment
            submission.instructor_feedback.passed = passed
            submission.instructor_feedback.instructor_id = current_user.id
        else:
            # Create new feedback
            feedback = InstructorFeedback(
                submission_id=submission.id,
                instructor_id=current_user.id,
                comment=comment,
                passed=passed,
            )
            db.session.add(feedback)

        submission.status = "reviewed"
        db.session.commit()
        flash("Review saved successfully!", "success")
        return redirect(url_for("admin.dashboard"))

    return render_template(
        "submissions/instructor_view.html",
        submission=submission,
        diff_content=diff_content,
        file_count=diff_stats["file_count"],
        total_additions=diff_stats["total_additions"],
        total_deletions=diff_stats["total_deletions"],
    )


@admin_bp.route("/goals/<int:goal_id>/anatomy-topics", methods=["GET", "POST"])
@require_admin
def anatomy_topics(goal_id):
    """Manage anatomy topics for a learning goal."""
    goal = LearningGoal.query.get_or_404(goal_id)

    if request.method == "POST":
        action = request.form.get("action")

        if action == "add":
            name = request.form.get("name", "").strip()
            description = request.form.get("description", "").strip()
            suggested_analogies = request.form.get("suggested_analogies", "").strip()

            if name:
                # Get max order for this goal
                max_order = (
                    db.session.query(db.func.max(AnatomyTopic.order))
                    .filter_by(goal_id=goal_id)
                    .scalar()
                    or 0
                )
                topic = AnatomyTopic(
                    goal_id=goal_id,
                    name=name,
                    description=description,
                    suggested_analogies=suggested_analogies,
                    order=max_order + 1,
                )
                db.session.add(topic)
                db.session.commit()
                flash(f'Topic "{name}" added successfully!', "success")
            else:
                flash("Topic name is required.", "danger")

        elif action == "update":
            topic_id = request.form.get("topic_id")
            topic = AnatomyTopic.query.get_or_404(topic_id)

            topic.name = request.form.get("name", "").strip()
            topic.description = request.form.get("description", "").strip()
            topic.suggested_analogies = request.form.get(
                "suggested_analogies", ""
            ).strip()
            db.session.commit()
            flash("Topic updated successfully!", "success")

        elif action == "delete":
            topic_id = request.form.get("topic_id")
            topic = AnatomyTopic.query.get_or_404(topic_id)
            db.session.delete(topic)
            db.session.commit()
            flash("Topic deleted successfully!", "success")

        elif action == "reorder":
            order_data = request.form.get("order", "")
            if order_data:
                for idx, topic_id in enumerate(order_data.split(",")):
                    topic = AnatomyTopic.query.get(int(topic_id))
                    if topic:
                        topic.order = idx
                db.session.commit()

        return redirect(url_for("admin.anatomy_topics", goal_id=goal_id))

    topics = (
        AnatomyTopic.query.filter_by(goal_id=goal_id).order_by(AnatomyTopic.order).all()
    )
    return render_template("admin/anatomy_topics.html", goal=goal, topics=topics)


@admin_bp.route("/submissions/<int:submission_id>/conversations")
@require_instructor
def submission_conversations(submission_id):
    """View anatomy conversations for a submission."""
    submission = Submission.query.get_or_404(submission_id)
    conversations = submission.anatomy_conversations.order_by(
        AnatomyConversation.created_at.desc()
    ).all()

    return render_template(
        "admin/submission_conversations.html",
        submission=submission,
        conversations=conversations,
    )


@admin_bp.route("/students/<int:user_id>/progress")
@require_instructor
def student_progress(user_id):
    """Student detail view showing Digi-Trainer engagement."""
    student = User.query.get_or_404(user_id)
    progress_list = GoalProgress.query.filter_by(user_id=user_id).all()
    scheduled_meeting = ScheduledMeeting.query.filter_by(
        student_id=user_id, status="scheduled"
    ).first()

    # Calculate engagement stats
    gems = sum(1 for p in progress_list if p.status == "passed" and not p.is_expired())
    lightbulbs = sum(
        1 for p in progress_list if p.status == "needs_work" and not p.is_expired()
    )
    engaged = sum(
        1 for p in progress_list if p.status == "engaged" and not p.is_expired()
    )
    total = len(progress_list)

    return render_template(
        "admin/student_progress.html",
        student=student,
        gems=gems,
        lightbulbs=lightbulbs,
        engaged=engaged,
        total=total,
        progress_list=progress_list,
        meeting_scheduled=scheduled_meeting is not None,
    )


@admin_bp.route("/students/<int:user_id>/topics/<int:core_goal_id>")
@require_instructor
def topic_conversation(user_id, core_goal_id):
    """View topic rubric and conversation history (Hybrid approach - LangSmith for conversation detail)."""
    student = User.query.get_or_404(user_id)
    core_goal = CoreLearningGoal.query.get_or_404(core_goal_id)
    progress = GoalProgress.query.filter_by(
        user_id=user_id, core_goal_id=core_goal_id
    ).first()

    # Get rubric from core_goal
    rubric = (
        core_goal.get_rubric()
        if hasattr(core_goal, "get_rubric")
        else core_goal.to_dict(include_rubric=True).get("rubric", {})
    )

    # Get conversation detail from LangSmith (hybrid approach)
    topic_conversations = []
    source = "local"

    try:
        from langsmith import Client

        client = Client()
        runs = client.list_runs(
            project_name=Config.LANGCHAIN_PROJECT,
            filter=f"eq(metadata.user_id, {user_id}) and eq(metadata.topic_id, {core_goal_id})",
            limit=10,
        )
        for run in runs:
            topic_conversations.append(
                {
                    "run_id": str(run.id),
                    "start_time": run.start_time,
                    "end_time": run.end_time,
                    "inputs": run.inputs,
                    "outputs": run.outputs,
                    "outcome": (
                        run.extra.get("metadata", {}).get("outcome", "unknown")
                        if run.extra
                        else "unknown"
                    ),
                }
            )
        if topic_conversations:
            source = "langsmith"
    except Exception as e:
        # Fallback to local DB if LangSmith unavailable
        flash(f"LangSmith unavailable, showing local data: {e}", "warning")

    # If no LangSmith data, fall back to local AgentSession messages
    if not topic_conversations:
        sessions = (
            AgentSession.query.filter_by(user_id=user_id, harness_type="articulation")
            .order_by(AgentSession.created_at.desc())
            .all()
        )

        for session in sessions:
            messages = session.messages.all()
            if messages:
                topic_conversations.append(
                    {
                        "session_id": session.id,
                        "start_time": session.created_at,
                        "end_time": session.completed_at,
                        "messages": [m.to_dict() for m in messages],
                        "outcome": "local_session",
                    }
                )

    return render_template(
        "admin/topic_conversation.html",
        student=student,
        core_goal=core_goal,
        rubric=rubric,
        progress=progress,
        conversations=topic_conversations,
        source=source,
    )


def get_status_icon(status):
    """Get the icon for a given status."""
    icons = {
        "passed": "💎",
        "needs_work": "💡",
        "engaged": "🔵",
        "in_progress": "⚪",
        "locked": "○",
        "expired": "⟳",
    }
    return icons.get(status, "○")
