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
from models.curriculum_area import CurriculumArea
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
            "modules": [m.to_dict() for m in modules]
        }
    )


@api_bp.route("/modules/<int:module_id>")
def module_detail(module_id):
    """Module with its goals."""
    module = LearningModule.query.get_or_404(module_id)
    goals = module.goals.order_by(LearningGoal.order).all()
    module_data = module.to_dict()
    module_data.pop("goal_count", None)  # We're sending goals separately
    return jsonify(
        {
            "module": module_data,
            "goals": [
                {
                    "id": g.id,
                    "title": g.title,
                    "order": g.order,
                    "video_url": g.video_url,
                    "starter_repo": g.starter_repo,
                    "difficulty_level": g.difficulty_level,
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


# ── Curriculum Areas ──────────────────────────────────────────────


@api_bp.route("/areas")
def list_areas():
    """All curriculum areas with module counts and user progress."""
    areas = CurriculumArea.query.order_by(CurriculumArea.order).all()
    result = []

    for area in areas:
        data = area.to_dict()

        # Add user progress if authenticated
        if current_user.is_authenticated:
            area_modules = area.modules.all()
            module_ids = [m.id for m in area_modules]
            if module_ids:
                # Count modules where user has at least one submission
                started = (
                    db.session.query(db.func.count(db.distinct(Submission.goal_id)))
                    .join(LearningGoal)
                    .filter(
                        LearningGoal.module_id.in_(module_ids),
                        Submission.user_id == current_user.id,
                    )
                    .scalar()
                    or 0
                )
                data["user_progress"] = {
                    "modules_started": min(started, len(module_ids)),
                    "modules_completed": 0,  # TODO: track completion
                    "total": len(module_ids),
                }
            else:
                data["user_progress"] = None
        else:
            data["user_progress"] = None

        result.append(data)

    return jsonify({"areas": result})


@api_bp.route("/areas/<slug>")
def area_detail(slug):
    """One area with its modules and goals."""
    area = CurriculumArea.query.filter_by(slug=slug).first_or_404()
    modules = area.modules.order_by(LearningModule.order).all()

    modules_data = []
    for m in modules:
        mod = m.to_dict()
        if m.status == "published":
            goals = m.goals.order_by(LearningGoal.order).all()
            mod["goals"] = [
                {"id": g.id, "title": g.title, "order": g.order}
                for g in goals
            ]
        else:
            mod["goals"] = []
        modules_data.append(mod)

    return jsonify({"area": area.to_dict(), "modules": modules_data})


@api_bp.route("/catalog")
def catalog():
    """All modules with optional filtering by area, difficulty, status."""
    query = LearningModule.query.join(
        CurriculumArea, LearningModule.curriculum_area_id == CurriculumArea.id
    )

    # Filters
    area_slug = request.args.get("area")
    if area_slug:
        query = query.filter(CurriculumArea.slug == area_slug)

    difficulty = request.args.get("difficulty", type=int)
    if difficulty:
        query = query.filter(LearningModule.difficulty_level == difficulty)

    status = request.args.get("status")
    if status:
        query = query.filter(LearningModule.status == status)

    modules = query.order_by(
        CurriculumArea.order, LearningModule.order
    ).all()

    return jsonify(
        {
            "modules": [m.to_dict() for m in modules],
        }
    )


@api_bp.route("/path/progress")
@login_required
def path_progress():
    """User's progress across the AI Builder path."""
    areas = CurriculumArea.query.order_by(CurriculumArea.order).all()

    area_progress = []
    total_modules = 0
    total_started = 0

    for area in areas:
        modules = area.modules.all()
        module_count = len(modules)
        total_modules += module_count

        # Count modules with submissions
        module_ids = [m.id for m in modules]
        started = 0
        if module_ids:
            started = (
                db.session.query(
                    db.func.count(db.distinct(LearningGoal.module_id))
                )
                .join(Submission)
                .filter(
                    LearningGoal.module_id.in_(module_ids),
                    Submission.user_id == current_user.id,
                )
                .scalar()
                or 0
            )
        total_started += started

        area_progress.append(
            {
                "slug": area.slug,
                "title": area.title,
                "icon_name": area.icon_name,
                "color": area.color,
                "progress_percent": (
                    round(started / module_count * 100) if module_count > 0 else 0
                ),
                "modules_started": started,
                "modules_completed": 0,
                "modules_total": module_count,
            }
        )

    overall = (
        round(total_started / total_modules * 100) if total_modules > 0 else 0
    )

    # Recommend next: first published module in an area user hasn't started
    recommended = []
    for area in areas:
        published = area.modules.filter_by(status="published").first()
        if published:
            has_submission = (
                Submission.query.join(LearningGoal)
                .filter(
                    LearningGoal.module_id == published.id,
                    Submission.user_id == current_user.id,
                )
                .first()
            )
            if not has_submission:
                recommended.append(
                    {
                        "module_id": published.id,
                        "title": published.title,
                        "area_slug": area.slug,
                        "area_title": area.title,
                        "difficulty_level": published.difficulty_level,
                        "estimated_hours": published.estimated_hours,
                    }
                )
                if len(recommended) >= 3:
                    break

    return jsonify(
        {
            "overall_progress": overall,
            "total_xp": 0,  # TODO: wire to real XP system
            "areas": area_progress,
            "recommended_next": recommended,
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
