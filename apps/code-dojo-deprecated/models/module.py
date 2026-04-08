"""Learning module model."""

from models import db


class LearningModule(db.Model):
    """A learning module containing multiple goals."""

    __tablename__ = "learning_modules"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)

    # Curriculum area linkage
    curriculum_area_id = db.Column(
        db.Integer, db.ForeignKey("curriculum_areas.id"), nullable=True
    )
    estimated_hours = db.Column(db.Float, nullable=True)
    difficulty_level = db.Column(db.Integer, default=1)  # 1-5
    status = db.Column(db.String(20), default="published")  # published, coming_soon, draft

    # Relationships
    goals = db.relationship(
        "LearningGoal", backref="module", lazy="dynamic", order_by="LearningGoal.order"
    )

    def to_dict(self):
        """Convert to dictionary."""
        result = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "order": self.order,
            "goal_count": self.goals.count(),
            "curriculum_area_id": self.curriculum_area_id,
            "estimated_hours": self.estimated_hours,
            "difficulty_level": self.difficulty_level,
            "status": self.status,
        }
        if self.area:
            result["area"] = {
                "slug": self.area.slug,
                "title": self.area.title,
                "color": self.area.color,
                "icon_name": self.area.icon_name,
            }
        return result

    def __repr__(self):
        return f"<LearningModule {self.title}>"
