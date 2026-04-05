"""JSON API routes for React frontend consumption."""

from flask import Blueprint, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user
from models import db
from models.user import User
from models.module import LearningModule
from models.goal import LearningGoal
from models.submission import Submission
from models.goal_progress import GoalProgress
from models.core_learning_goal import CoreLearningGoal
from models.challenge_rubric import ChallengeRubric
from middleware.auth import require_admin

api_bp = Blueprint("api", __name__, url_prefix="/api")


# ── Auth ──────────────────────────────────────────────────────────


@api_bp.route("/auth/me")
def me():
    """Current authenticated user or unauthenticated status."""
    if current_user.is_authenticated:
        return jsonify(
            {
                "authenticated": True,
                "user": {
                    "id": current_user.id,
                    "email": current_user.email,
                    "role": current_user.role,
                },
            }
        )
    return jsonify({"authenticated": False})


@api_bp.route("/auth/login", methods=["POST"])
def login():
    """Authenticate user via JSON body."""
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.authenticate(email, password)
    if user:
        login_user(user)
        return jsonify(
            {
                "success": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                },
            }
        )
    return jsonify({"success": False, "error": "Invalid email or password."}), 401


@api_bp.route("/auth/signup", methods=["POST"])
def signup():
    """Register new user via JSON body."""
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    errors = []
    if not email:
        errors.append("Email is required.")
    if not password:
        errors.append("Password is required.")
    if password != confirm_password:
        errors.append("Passwords do not match.")
    if len(password) < 6:
        errors.append("Password must be at least 6 characters.")
    if User.query.filter_by(email=email).first():
        errors.append("An account with this email already exists.")

    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    user = User.create(email=email, password=password)
    login_user(user)
    return jsonify(
        {
            "success": True,
            "user": {"id": user.id, "email": user.email, "role": user.role},
        }
    )


@api_bp.route("/auth/logout", methods=["POST"])
@login_required
def logout():
    """Log out current user."""
    logout_user()
    return jsonify({"success": True})


@api_bp.route("/auth/account")
@login_required
def account():
    """Current user account with submission history."""
    submissions = current_user.submissions.order_by(db.desc("created_at")).all()
    return jsonify(
        {
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "role": current_user.role,
            },
            "submissions": [
                {
                    "id": s.id,
                    "goal_id": s.goal_id,
                    "goal_title": s.goal.title if s.goal else None,
                    "pr_url": s.pr_url,
                    "status": s.status,
                    "created_at": s.created_at.isoformat(),
                    "passed": (
                        s.instructor_feedback.passed if s.instructor_feedback else None
                    ),
                }
                for s in submissions
            ],
        }
    )


# ── Modules ───────────────────────────────────────────────────────


@api_bp.route("/modules")
def list_modules():
    """List all learning modules."""
    modules = LearningModule.query.order_by(LearningModule.order).all()
    return jsonify(
        {
            "modules": [
                {
                    "id": m.id,
                    "title": m.title,
                    "description": m.description,
                    "order": m.order,
                    "goal_count": m.goals.count(),
                }
                for m in modules
            ]
        }
    )


@api_bp.route("/modules/<int:module_id>")
def module_detail(module_id):
    """Module with its goals."""
    module = LearningModule.query.get_or_404(module_id)
    goals = module.goals.order_by(LearningGoal.order).all()
    return jsonify(
        {
            "module": {
                "id": module.id,
                "title": module.title,
                "description": module.description,
            },
            "goals": [
                {
                    "id": g.id,
                    "title": g.title,
                    "order": g.order,
                    "video_url": g.video_url,
                    "starter_repo": g.starter_repo,
                }
                for g in goals
            ],
        }
    )


@api_bp.route("/modules/<int:module_id>/goals/<int:goal_id>")
def goal_detail(module_id, goal_id):
    """Goal with submission data, progress, and rubric."""
    module = LearningModule.query.get_or_404(module_id)
    goal = LearningGoal.query.filter_by(id=goal_id, module_id=module_id).first_or_404()

    latest_submission = None
    progress = []
    core_goals = []

    if current_user.is_authenticated:
        sub = (
            Submission.query.filter_by(user_id=current_user.id, goal_id=goal_id)
            .order_by(Submission.created_at.desc())
            .first()
        )
        if sub:
            latest_submission = {
                "id": sub.id,
                "pr_url": sub.pr_url,
                "status": sub.status,
                "created_at": sub.created_at.isoformat(),
            }

        core_learning_goals = (
            CoreLearningGoal.query.filter_by(learning_goal_id=goal_id)
            .order_by(CoreLearningGoal.order_index)
            .all()
        )
        core_goals = [
            {
                "id": cg.id,
                "title": cg.title,
                "description": cg.description,
                "gem_color": cg.gem_color,
            }
            for cg in core_learning_goals
        ]

        core_goal_ids = [cg.id for cg in core_learning_goals]
        if core_goal_ids:
            progress = [
                {
                    "core_goal_id": gp.core_goal_id,
                    "status": gp.effective_status,
                    "attempts": gp.attempts,
                }
                for gp in GoalProgress.query.filter(
                    GoalProgress.user_id == current_user.id,
                    GoalProgress.core_goal_id.in_(core_goal_ids),
                ).all()
            ]

    rubric = ChallengeRubric.query.filter_by(learning_goal_id=goal_id).first()

    return jsonify(
        {
            "module": {"id": module.id, "title": module.title},
            "goal": {
                "id": goal.id,
                "title": goal.title,
                "video_url": goal.video_url,
                "challenge_md": goal.challenge_md,
                "starter_repo": goal.starter_repo,
            },
            "latest_submission": latest_submission,
            "progress": progress,
            "core_learning_goals": core_goals,
            "challenge_rubric": (
                {"id": rubric.id, "rubric": rubric.rubric} if rubric else None
            ),
        }
    )


# ── Admin ─────────────────────────────────────────────────────────


@api_bp.route("/admin/dashboard")
@require_admin
def admin_dashboard():
    """Admin dashboard data."""
    students = (
        User.query.filter(User.role == "student").order_by(User.created_at.desc()).all()
    )
    submissions = Submission.query.order_by(Submission.created_at.desc()).all()
    pending_reviews = Submission.query.filter_by(status="feedback_requested").count()

    return jsonify(
        {
            "students": [
                {
                    "id": s.id,
                    "email": s.email,
                    "created_at": s.created_at.isoformat(),
                }
                for s in students
            ],
            "submissions": [
                {
                    "id": sub.id,
                    "user_email": sub.user.email if sub.user else None,
                    "goal_title": sub.goal.title if sub.goal else None,
                    "pr_url": sub.pr_url,
                    "status": sub.status,
                    "created_at": sub.created_at.isoformat(),
                    "passed": (
                        sub.instructor_feedback.passed
                        if sub.instructor_feedback
                        else None
                    ),
                }
                for sub in submissions
            ],
            "pending_reviews": pending_reviews,
        }
    )
