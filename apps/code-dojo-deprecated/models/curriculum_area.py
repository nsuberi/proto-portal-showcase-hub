"""Curriculum area model — one of the 9 AI Builder skill areas."""

from models import db


class CurriculumArea(db.Model):
    """A curriculum area grouping related learning modules."""

    __tablename__ = "curriculum_areas"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon_name = db.Column(db.String(50))  # Lucide icon name
    color = db.Column(db.String(20))  # Tailwind color class
    order = db.Column(db.Integer, default=0)

    # Relationships
    modules = db.relationship(
        "LearningModule",
        backref="area",
        lazy="dynamic",
        order_by="LearningModule.order",
    )

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "description": self.description,
            "icon_name": self.icon_name,
            "color": self.color,
            "order": self.order,
            "module_count": self.modules.count(),
            "published_count": self.modules.filter_by(status="published").count(),
        }

    def __repr__(self):
        return f"<CurriculumArea {self.slug}>"
