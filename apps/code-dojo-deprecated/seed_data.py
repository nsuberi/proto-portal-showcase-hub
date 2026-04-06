"""
Database initialization and seed data for Code Dojo.

Run this script to create the database and populate it with:
- Sample learning module and goals
- Admin and instructor users
- Sample student users

Usage:
    python seed_data.py
    python seed_data.py --reset  # Drop and recreate all tables
    python seed_data.py --rubrics  # Add core learning goals with rubrics
"""

import sys
import json
from sqlalchemy import text as sa_text
from app import app, db
from models.user import User
from models.module import LearningModule
from models.goal import LearningGoal
from models.anatomy_topic import AnatomyTopic
from models.core_learning_goal import CoreLearningGoal
from models.challenge_rubric import ChallengeRubric
from models.curriculum_area import CurriculumArea

# Challenge description for the API Auth challenge (Updated Section 1)
API_AUTH_CHALLENGE = """
## Challenge: Add API Authentication

The Snippet Manager API currently allows **anyone** to create, update, and delete code snippets without any authentication. This is a security vulnerability!

### Your Task

Add authentication to protect write operations (POST, PUT, DELETE) while keeping read operations (GET) public.

### Requirements

1. **Choose an approach** - You can use any of these:
   - **API Key Authentication** - Using an `X-API-Key` header
   - **HTTP Basic Authentication** - Using `Authorization: Basic` header
   - **JWT (JSON Web Token)** - Using `Authorization: Bearer` header

2. **Protect write operations**:
   - POST `/api/snippets` (create)
   - PUT `/api/snippets/<id>` (update)
   - DELETE `/api/snippets/<id>` (delete)

3. **Keep read operations public**:
   - GET `/api/snippets` (list all)
   - GET `/api/snippets/<id>` (get one)
   - GET `/api/languages`
   - GET `/api/tags`

4. **Return proper error responses**:
   - 401 Unauthorized when credentials are missing or invalid
   - Include helpful error message

### Getting Started

1. Fork or clone the starter repository
2. Implement your authentication solution
3. Update the tests to verify auth works
4. Submit your solution branch

### Hints

- Look at how Flask decorators work
- Consider using `functools.wraps` for your decorator
- For API keys, `secrets.token_hex(32)` generates secure random keys
- For Basic Auth, werkzeug has password hashing utilities
- For JWT, consider using PyJWT library with HS256 signing
- Each approach has different tradeoffs (stateless vs simple, etc.)

### Success Criteria

- All existing tests still pass (read operations work without auth)
- New tests verify auth is required for write operations
- Invalid credentials return 401 with helpful message
- Valid credentials allow write operations
"""

# Second learning goal: Claude API + LangSmith (Section 14)
CLAUDE_API_CHALLENGE = """
## Challenge: Build an AI-Powered Flask Endpoint

Create a Flask API endpoint that integrates with the Claude LLM API and
captures all interactions in LangSmith for observability.

### Your Task

Build a `/api/ask` endpoint that:
1. Accepts a question in the request body
2. Sends it to Claude for a response
3. Returns the AI-generated answer
4. Traces the entire interaction in LangSmith

### Requirements

1. **Choose an implementation approach**:
   - **Direct Anthropic SDK** - Using the official `anthropic` Python package
   - **LangChain Integration** - Using LangChain's ChatAnthropic wrapper
   - **Custom HTTP Client** - Using `requests` or `httpx` directly

2. **Implement proper error handling**:
   - Handle API rate limits gracefully
   - Return meaningful error messages
   - Log errors for debugging

3. **Add LangSmith tracing**:
   - Trace all LLM calls
   - Include metadata (model, tokens, latency)
   - Support trace grouping by session

4. **Environment configuration**:
   - API keys from environment variables
   - Configurable model selection
   - Tracing can be enabled/disabled

### Getting Started

1. Fork the starter repository
2. Set up your Anthropic and LangSmith API keys
3. Implement your solution
4. Submit your branch

### Hints

- For Anthropic SDK: `pip install anthropic`
- For LangChain: `pip install langchain langchain-anthropic`
- LangSmith tracing can be automatic with LangChain or manual with `@traceable`
- Consider using `LANGCHAIN_TRACING_V2=true` environment variable

### Success Criteria

- Endpoint returns Claude's response correctly
- All calls appear in LangSmith dashboard
- Errors are handled gracefully
- No API keys in source code
"""

# Multi-approach rubric for Claude API challenge (Section 14)
CLAUDE_API_RUBRIC = {
    "version": "1.1",
    "approach_type": "implementation_strategy",
    "approach_type_label": "LLM integration approach",
    "domain_context": "Claude API integration patterns",
    "learning_points": [
        "Different client libraries offer varying levels of abstraction",
        "Error handling is critical when working with external APIs",
        "Environment configuration keeps sensitive credentials secure",
    ],
    "valid_approaches": [
        {
            "id": "anthropic_sdk",
            "name": "Direct Anthropic SDK",
            "detection_patterns": [
                "from anthropic import",
                "Anthropic()",
                "client.messages.create",
            ],
            "tradeoffs": {
                "pros": [
                    "Official SDK",
                    "Type hints",
                    "Minimal dependencies",
                    "Direct control",
                ],
                "cons": [
                    "Manual tracing setup",
                    "No built-in retries",
                    "Less abstraction",
                ],
            },
        },
        {
            "id": "langchain",
            "name": "LangChain Integration",
            "detection_patterns": [
                "from langchain",
                "ChatAnthropic",
                "invoke(",
                "langchain_anthropic",
            ],
            "tradeoffs": {
                "pros": [
                    "Built-in LangSmith integration",
                    "Automatic tracing",
                    "Rich ecosystem",
                ],
                "cons": [
                    "Heavier dependency",
                    "Abstraction overhead",
                    "Versioning complexity",
                ],
            },
        },
        {
            "id": "http_client",
            "name": "Custom HTTP Client",
            "detection_patterns": [
                "requests.post",
                "httpx",
                "api.anthropic.com",
                "messages",
            ],
            "tradeoffs": {
                "pros": ["Full control", "Minimal dependencies", "Educational value"],
                "cons": ["Manual everything", "Error-prone", "No SDK benefits"],
            },
        },
    ],
    "universal_criteria": [
        {
            "id": "endpoint_works",
            "criterion": "POST /api/ask returns Claude's response",
            "pass_indicators": [
                "Returns JSON with 'response' field",
                "Status 200 on success",
            ],
        },
        {
            "id": "error_handling",
            "criterion": "Handles API errors gracefully",
            "pass_indicators": [
                "Rate limit handling",
                "Timeout handling",
                "Meaningful error messages",
            ],
        },
        {
            "id": "langsmith_tracing",
            "criterion": "Traces appear in LangSmith",
            "pass_indicators": [
                "@traceable decorator or equivalent",
                "Trace metadata included",
            ],
        },
        {
            "id": "env_config",
            "criterion": "API keys from environment",
            "pass_indicators": ["os.getenv usage", "No hardcoded keys"],
        },
    ],
    "approach_specific_criteria": {
        "anthropic_sdk": [
            {"id": "sdk_init", "criterion": "Properly initializes Anthropic client"},
            {"id": "manual_trace", "criterion": "Implements manual LangSmith tracing"},
        ],
        "langchain": [
            {"id": "chain_setup", "criterion": "Properly configures LangChain chain"},
            {
                "id": "auto_trace",
                "criterion": "Leverages automatic LangSmith integration",
            },
        ],
        "http_client": [
            {
                "id": "headers",
                "criterion": "Sets correct headers (x-api-key, content-type)",
            },
            {
                "id": "response_parse",
                "criterion": "Correctly parses API response structure",
            },
        ],
    },
}


def seed_database():
    """Create tables and insert sample data."""
    print("Creating database tables...")
    db.create_all()

    # Check if data already exists
    if LearningModule.query.first():
        print("Database already has data. Use --reset to recreate.")
        return

    print("Creating learning module...")

    # Create the Flask API Auth module
    module = LearningModule(
        title="Flask API Authentication",
        description="Learn how to secure your Flask REST APIs with authentication. You'll implement authentication from scratch and understand the security principles behind it.",
        order=1,
    )
    db.session.add(module)
    db.session.flush()  # Get the module ID

    # Create the learning goal (Section 10: Updated title)
    goal = LearningGoal(
        module_id=module.id,
        title="Add authentication to a Flask API",
        video_url="https://www.youtube.com/watch?v=o-pMCoVPN_k",
        challenge_md=API_AUTH_CHALLENGE,
        starter_repo="https://github.com/nsuberi/snippet-manager-starter",
        order=1,
        difficulty_level=2,
        category_tags_json=json.dumps(["auth", "api", "security", "flask"]),
    )
    db.session.add(goal)
    db.session.flush()  # Get the goal ID

    # Create second learning goal (Section 14)
    goal2 = LearningGoal(
        module_id=module.id,
        title="Build an AI-Powered Flask Endpoint with Observability",
        video_url="",  # No video yet
        challenge_md=CLAUDE_API_CHALLENGE,
        starter_repo="",  # To be created
        order=2,
        difficulty_level=3,
        prerequisites_json=json.dumps([goal.id]),  # Requires first goal
        category_tags_json=json.dumps(
            ["ai", "api", "observability", "claude", "langsmith"]
        ),
    )
    db.session.add(goal2)
    db.session.flush()

    print("Creating anatomy topics...")

    # Create anatomy topics for the API Auth challenge
    anatomy_topics = [
        AnatomyTopic(
            goal_id=goal.id,
            name="Authentication Decorator",
            description="The decorator pattern you used to protect routes - how it intercepts requests and validates credentials before allowing access.",
            suggested_analogies="A decorator is like a security guard at a building entrance. Before anyone can enter (access the function), the guard checks their ID (validates credentials). If they pass, they're allowed in; if not, they're turned away.",
            order=1,
        ),
        AnatomyTopic(
            goal_id=goal.id,
            name="API Key Validation",
            description="How your code checks if the provided API key is valid and matches expected credentials.",
            suggested_analogies="Think of API keys like a special password or VIP pass. Just like a bouncer checks if your name is on the guest list, your code checks if the provided key matches one that's been registered.",
            order=2,
        ),
        AnatomyTopic(
            goal_id=goal.id,
            name="HTTP Headers",
            description="How you extract and use the X-API-Key header from incoming requests.",
            suggested_analogies="HTTP headers are like the envelope of a letter - they contain metadata about the message (who it's from, special handling instructions) separate from the actual content inside.",
            order=3,
        ),
        AnatomyTopic(
            goal_id=goal.id,
            name="Error Responses",
            description="How your code returns appropriate 401 Unauthorized responses when authentication fails.",
            suggested_analogies="Error responses are like a helpful receptionist who doesn't just say 'no' but explains why you can't proceed and what you might need to do differently.",
            order=4,
        ),
        AnatomyTopic(
            goal_id=goal.id,
            name="Route Protection Strategy",
            description="Your approach to deciding which routes need protection (write operations) vs which stay public (read operations).",
            suggested_analogies="This is like a museum where anyone can look at the exhibits (read), but only authorized staff can move or modify them (write). You're deciding what requires a staff badge.",
            order=5,
        ),
    ]

    for topic in anatomy_topics:
        db.session.add(topic)

    print("Creating users...")

    # Create admin user
    admin = User.create(email="admin@codedojo.com", password="admin123", role="admin")
    print(f"  Admin: admin@codedojo.com / admin123")

    # Create instructor user
    instructor = User.create(
        email="instructor@codedojo.com", password="instructor123", role="instructor"
    )
    print(f"  Instructor: instructor@codedojo.com / instructor123")

    # Create sample student users
    student1 = User.create(
        email="alice@example.com", password="student123", role="student"
    )
    print(f"  Student 1: alice@example.com / student123")

    student2 = User.create(
        email="bob@example.com", password="student123", role="student"
    )
    print(f"  Student 2: bob@example.com / student123")

    db.session.commit()

    print("\n" + "=" * 60)
    print("SEED DATA CREATED SUCCESSFULLY")
    print("=" * 60)
    print("\nTest Credentials:")
    print("  Admin:      admin@codedojo.com / admin123")
    print("  Instructor: instructor@codedojo.com / instructor123")
    print("  Student 1:  alice@example.com / student123")
    print("  Student 2:  bob@example.com / student123")
    print("\nLearning Content:")
    print(f"  Module: {module.title}")
    print(f"  Goal: {goal.title}")
    print(f"  Starter Repo: {goal.starter_repo}")
    print("=" * 60)


def reset_database():
    """Drop all tables and recreate with seed data."""
    print("Dropping all tables...")
    db.drop_all()
    seed_database()


def seed_anatomy_topics():
    """Add anatomy topics to existing goals (without resetting database)."""
    print("Seeding anatomy topics...")

    # Check if topics already exist
    if AnatomyTopic.query.first():
        print("Anatomy topics already exist. Skipping.")
        return

    # Get the first goal (API Auth challenge)
    goal = LearningGoal.query.first()
    if not goal:
        print("No learning goals found. Run seed_database() first.")
        return

    print(f"Adding anatomy topics to goal: {goal.title}")

    anatomy_topics = [
        AnatomyTopic(
            goal_id=goal.id,
            name="Authentication Decorator",
            description="The decorator pattern you used to protect routes - how it intercepts requests and validates credentials before allowing access.",
            suggested_analogies="A decorator is like a security guard at a building entrance. Before anyone can enter (access the function), the guard checks their ID (validates credentials). If they pass, they're allowed in; if not, they're turned away.",
            order=1,
        ),
        AnatomyTopic(
            goal_id=goal.id,
            name="API Key Validation",
            description="How your code checks if the provided API key is valid and matches expected credentials.",
            suggested_analogies="Think of API keys like a special password or VIP pass. Just like a bouncer checks if your name is on the guest list, your code checks if the provided key matches one that's been registered.",
            order=2,
        ),
        AnatomyTopic(
            goal_id=goal.id,
            name="HTTP Headers",
            description="How you extract and use the X-API-Key header from incoming requests.",
            suggested_analogies="HTTP headers are like the envelope of a letter - they contain metadata about the message (who it's from, special handling instructions) separate from the actual content inside.",
            order=3,
        ),
        AnatomyTopic(
            goal_id=goal.id,
            name="Error Responses",
            description="How your code returns appropriate 401 Unauthorized responses when authentication fails.",
            suggested_analogies="Error responses are like a helpful receptionist who doesn't just say 'no' but explains why you can't proceed and what you might need to do differently.",
            order=4,
        ),
        AnatomyTopic(
            goal_id=goal.id,
            name="Route Protection Strategy",
            description="Your approach to deciding which routes need protection (write operations) vs which stay public (read operations).",
            suggested_analogies="This is like a museum where anyone can look at the exhibits (read), but only authorized staff can move or modify them (write). You're deciding what requires a staff badge.",
            order=5,
        ),
    ]

    for topic in anatomy_topics:
        db.session.add(topic)

    db.session.commit()
    print(f"Created {len(anatomy_topics)} anatomy topics successfully!")


def seed_core_learning_goals():
    """Add core learning goals with rubrics for the API Auth challenge."""
    print("Seeding core learning goals with rubrics...")

    # Check if already exists
    if CoreLearningGoal.query.first():
        print("Core learning goals already exist. Skipping.")
        return

    # Get the first goal (API Auth challenge)
    goal = LearningGoal.query.first()
    if not goal:
        print("No learning goals found. Run seed_database() first.")
        return

    print(f"Adding core learning goals to: {goal.title}")

    # Define core learning goals with rubrics for Flask API Auth
    core_goals = [
        {
            "title": "Authentication Decorator Pattern",
            "description": "Understanding how decorators intercept and validate requests",
            "gem_color": "blue",
            "certification_days": 90,
            "order_index": 1,
            "rubric": {
                "items": [
                    {
                        "id": "decorator_purpose",
                        "criterion": "Understand why decorators are used for authentication",
                        "pass_indicators": [
                            "Explains that decorators wrap functions to add behavior",
                            "Describes how the decorator runs before the route handler",
                            "Uses analogy of security checkpoint or gatekeeper",
                        ],
                        "socratic_hints": [
                            "What happens when a request hits a protected route before your code runs?",
                            "How is this similar to checking IDs at a door?",
                            "Why might wrapping a function be useful instead of checking auth inside each route?",
                        ],
                    },
                    {
                        "id": "decorator_implementation",
                        "criterion": "Explain how the decorator is implemented",
                        "pass_indicators": [
                            "Mentions functools.wraps preserving function metadata",
                            "Describes inner function that does the validation",
                            "Explains returning the original function or error response",
                        ],
                        "socratic_hints": [
                            "Walk me through what your decorator code does line by line.",
                            "What does functools.wraps do and why did you use it?",
                            "When does your decorator let the request through vs block it?",
                        ],
                    },
                ]
            },
        },
        {
            "title": "API Key Extraction and Validation",
            "description": "How to safely extract and validate API keys from requests",
            "gem_color": "purple",
            "certification_days": 90,
            "order_index": 2,
            "rubric": {
                "items": [
                    {
                        "id": "key_extraction",
                        "criterion": "Understand how API keys are extracted from requests",
                        "pass_indicators": [
                            "Knows API keys come from X-API-Key header",
                            "Explains using request.headers.get()",
                            "Handles case where header is missing",
                        ],
                        "socratic_hints": [
                            "Where does the API key live in an HTTP request?",
                            "What Flask method did you use to get the header value?",
                            "What happens if someone makes a request without the header?",
                        ],
                    },
                    {
                        "id": "key_validation",
                        "criterion": "Understand secure key validation",
                        "pass_indicators": [
                            "Compares against stored valid key(s)",
                            "Uses constant-time comparison for security (or understands why)",
                            "Explains what happens on invalid key",
                        ],
                        "socratic_hints": [
                            "How does your code check if a key is valid?",
                            "Why might simple string comparison have security issues?",
                            "Where are your valid keys stored and why there?",
                        ],
                    },
                ]
            },
        },
        {
            "title": "HTTP Response Codes and Error Handling",
            "description": "Returning appropriate responses for authentication failures",
            "gem_color": "green",
            "certification_days": 90,
            "order_index": 3,
            "rubric": {
                "items": [
                    {
                        "id": "status_codes",
                        "criterion": "Understand appropriate HTTP status codes",
                        "pass_indicators": [
                            "Uses 401 for authentication failures",
                            "Knows 401 means Unauthorized",
                            "Distinguishes 401 from 403 Forbidden",
                        ],
                        "socratic_hints": [
                            "What status code did you return when auth fails?",
                            "What does 401 tell the client about what went wrong?",
                            "How is 401 different from 403?",
                        ],
                    },
                    {
                        "id": "error_messages",
                        "criterion": "Provide helpful error responses",
                        "pass_indicators": [
                            "Returns JSON error message",
                            "Message explains what went wrong",
                            "Avoids leaking sensitive information",
                        ],
                        "socratic_hints": [
                            "What does your error response body look like?",
                            "How would a developer using your API know what to fix?",
                            "Why is it important not to say which part of auth failed?",
                        ],
                    },
                ]
            },
        },
        {
            "title": "Route Protection Strategy",
            "description": "Deciding which routes need authentication",
            "gem_color": "orange",
            "certification_days": 90,
            "order_index": 4,
            "rubric": {
                "items": [
                    {
                        "id": "read_write_split",
                        "criterion": "Understand read vs write operation protection",
                        "pass_indicators": [
                            "GET routes remain public (read)",
                            "POST/PUT/DELETE routes require auth (write)",
                            "Explains why this split makes sense",
                        ],
                        "socratic_hints": [
                            "Which HTTP methods did you protect and why?",
                            "Why keep GET public while protecting POST/PUT/DELETE?",
                            "What would happen if GET also required auth?",
                        ],
                    },
                    {
                        "id": "decorator_application",
                        "criterion": "Know how to apply decorator to specific routes",
                        "pass_indicators": [
                            "Uses decorator syntax @require_api_key",
                            "Applies to correct routes only",
                            "Order of decorators matters (understands stacking)",
                        ],
                        "socratic_hints": [
                            "How did you mark which routes need authentication?",
                            "Show me a route that needs auth vs one that doesn not.",
                            "If you have multiple decorators, does order matter?",
                        ],
                    },
                ]
            },
        },
        {
            "title": "Security Considerations",
            "description": "Understanding security implications of API auth",
            "gem_color": "red",
            "certification_days": 60,  # Shorter certification for security topics
            "order_index": 5,
            "rubric": {
                "items": [
                    {
                        "id": "key_generation",
                        "criterion": "Understand secure key generation",
                        "pass_indicators": [
                            "Uses cryptographically secure random generation",
                            "Keys are long enough (32+ hex characters)",
                            "Does not use predictable patterns",
                        ],
                        "socratic_hints": [
                            "How would you generate a new API key?",
                            "Why use secrets.token_hex vs random strings?",
                            "What makes a key secure vs guessable?",
                        ],
                    },
                    {
                        "id": "key_storage",
                        "criterion": "Understand secure key storage",
                        "pass_indicators": [
                            "Keys stored in environment variables",
                            "Not hardcoded in source code",
                            "Understands why .env should not be committed",
                        ],
                        "socratic_hints": [
                            "Where do your API keys live in your codebase?",
                            "Why not just put them directly in the Python file?",
                            "What would happen if keys were committed to GitHub?",
                        ],
                    },
                ]
            },
        },
    ]

    for goal_data in core_goals:
        core_goal = CoreLearningGoal(
            learning_goal_id=goal.id,
            title=goal_data["title"],
            description=goal_data["description"],
            rubric_json=json.dumps(goal_data["rubric"]),
            order_index=goal_data["order_index"],
            gem_color=goal_data["gem_color"],
            certification_days=goal_data["certification_days"],
        )
        db.session.add(core_goal)

    total_created = len(core_goals)

    # Add core learning goals for Claude API Challenge (Section 14)
    goals = LearningGoal.query.order_by(LearningGoal.order).all()
    if len(goals) > 1:
        goal2 = goals[1]
        print(f"Adding core learning goals to: {goal2.title}")

        claude_api_core_goals = [
            {
                "title": "LLM API Integration",
                "description": "Understanding how to call the Claude API from Python",
                "gem_color": "blue",
                "certification_days": 90,
                "order_index": 1,
                "rubric": {
                    "items": [
                        {
                            "id": "client_setup",
                            "criterion": "Properly initialize the API client",
                            "pass_indicators": [
                                "Uses Anthropic SDK or makes HTTP requests correctly",
                                "API key loaded from environment variables",
                                "Client is reusable across requests",
                            ],
                            "socratic_hints": [
                                "How did you configure the Anthropic client in your code?",
                                "Where does your API key come from?",
                                "What happens if someone runs your code without setting up the key?",
                            ],
                        },
                        {
                            "id": "message_format",
                            "criterion": "Understand Claude message format",
                            "pass_indicators": [
                                "Knows the messages array structure",
                                "Understands role (user/assistant) concept",
                                "Can explain max_tokens and model parameters",
                            ],
                            "socratic_hints": [
                                "What does the messages array look like when you call Claude?",
                                "Why do messages have roles?",
                                "What happens if you set max_tokens too low?",
                            ],
                        },
                    ]
                },
            },
            {
                "title": "Error Handling for External APIs",
                "description": "Gracefully handling failures when calling external services",
                "gem_color": "purple",
                "certification_days": 90,
                "order_index": 2,
                "rubric": {
                    "items": [
                        {
                            "id": "rate_limits",
                            "criterion": "Handle rate limiting gracefully",
                            "pass_indicators": [
                                "Catches rate limit errors (429 status)",
                                "Implements retry logic or backoff",
                                "Returns helpful error to user",
                            ],
                            "socratic_hints": [
                                "What happens if too many requests hit Claude at once?",
                                "How does your code respond to a 429 error?",
                                "What does the user see when rate limited?",
                            ],
                        },
                        {
                            "id": "timeout_handling",
                            "criterion": "Handle timeouts appropriately",
                            "pass_indicators": [
                                "Sets appropriate timeout values",
                                "Catches timeout exceptions",
                                "Does not hang indefinitely",
                            ],
                            "socratic_hints": [
                                "What if Claude takes a long time to respond?",
                                "How long should your endpoint wait?",
                                "What happens on a timeout?",
                            ],
                        },
                    ]
                },
            },
            {
                "title": "LangSmith Observability",
                "description": "Adding tracing and monitoring to LLM calls",
                "gem_color": "green",
                "certification_days": 90,
                "order_index": 3,
                "rubric": {
                    "items": [
                        {
                            "id": "trace_setup",
                            "criterion": "Configure LangSmith tracing",
                            "pass_indicators": [
                                "Environment variables set correctly",
                                "Uses @traceable or automatic LangChain tracing",
                                "Traces visible in LangSmith dashboard",
                            ],
                            "socratic_hints": [
                                "What environment variables does LangSmith need?",
                                "How do you mark a function for tracing?",
                                "Can you see your calls in the LangSmith dashboard?",
                            ],
                        },
                        {
                            "id": "trace_metadata",
                            "criterion": "Include useful metadata in traces",
                            "pass_indicators": [
                                "Includes model name and version",
                                "Tracks token usage",
                                "Groups related calls together",
                            ],
                            "socratic_hints": [
                                "What information appears in your traces?",
                                "How can you tell which model was used?",
                                "Can you track how many tokens each call used?",
                            ],
                        },
                    ]
                },
            },
            {
                "title": "Flask API Design",
                "description": "Building a well-designed REST endpoint",
                "gem_color": "orange",
                "certification_days": 90,
                "order_index": 4,
                "rubric": {
                    "items": [
                        {
                            "id": "request_validation",
                            "criterion": "Validate incoming requests",
                            "pass_indicators": [
                                "Checks for required fields",
                                "Returns 400 for invalid requests",
                                "Error messages explain what is wrong",
                            ],
                            "socratic_hints": [
                                "What happens if someone sends an empty request?",
                                "How do you validate the question field?",
                                "What status code do you return for bad input?",
                            ],
                        },
                        {
                            "id": "response_format",
                            "criterion": "Return consistent JSON responses",
                            "pass_indicators": [
                                "Success responses have consistent structure",
                                "Error responses also follow a pattern",
                                "Includes appropriate HTTP status codes",
                            ],
                            "socratic_hints": [
                                "What does a successful response look like?",
                                "What does an error response look like?",
                                "Are they consistent with each other?",
                            ],
                        },
                    ]
                },
            },
            {
                "title": "Environment Configuration",
                "description": "Securely managing secrets and configuration",
                "gem_color": "red",
                "certification_days": 60,
                "order_index": 5,
                "rubric": {
                    "items": [
                        {
                            "id": "secrets_management",
                            "criterion": "Keep secrets out of code",
                            "pass_indicators": [
                                "API keys loaded from environment",
                                "No hardcoded secrets in source",
                                ".env file is gitignored",
                            ],
                            "socratic_hints": [
                                "Where do your API keys live?",
                                "What would happen if you committed your .env file?",
                                "How does someone else run your code?",
                            ],
                        },
                        {
                            "id": "config_flexibility",
                            "criterion": "Make configuration flexible",
                            "pass_indicators": [
                                "Model selection is configurable",
                                "Tracing can be toggled on/off",
                                "Reasonable defaults provided",
                            ],
                            "socratic_hints": [
                                "Can you switch models without changing code?",
                                "Can you disable LangSmith tracing for local dev?",
                                "What defaults do you use when vars are not set?",
                            ],
                        },
                    ]
                },
            },
        ]

        for goal_data in claude_api_core_goals:
            core_goal = CoreLearningGoal(
                learning_goal_id=goal2.id,
                title=goal_data["title"],
                description=goal_data["description"],
                rubric_json=json.dumps(goal_data["rubric"]),
                order_index=goal_data["order_index"],
                gem_color=goal_data["gem_color"],
                certification_days=goal_data["certification_days"],
            )
            db.session.add(core_goal)

        total_created += len(claude_api_core_goals)

    db.session.commit()
    print(f"Created {total_created} core learning goals with rubrics!")


def seed_challenge_rubric():
    """Add multi-approach challenge rubrics for all challenges (Section 7, 14)."""
    print("Seeding challenge rubrics...")

    # Get all learning goals
    goals = LearningGoal.query.order_by(LearningGoal.order).all()
    if not goals:
        print("No learning goals found. Run seed_database() first.")
        return

    created_count = 0

    # First goal: API Auth challenge
    goal = goals[0]
    existing = ChallengeRubric.query.filter_by(learning_goal_id=goal.id).first()
    if existing:
        print(f"Rubric for '{goal.title}' already exists. Skipping.")
    else:
        print(f"Adding multi-approach rubric to: {goal.title}")

        # Multi-approach rubric JSON (Section 2.2)
        rubric_data = {
            "version": "1.1",
            "approach_type": "authentication",
            "approach_type_label": "authentication approach",
            "domain_context": "API security and access control",
            "learning_points": [
                "Authentication protects sensitive endpoints while keeping read operations accessible",
                "The decorator pattern provides clean, reusable authentication logic",
                "Different auth approaches have different tradeoffs - choose based on your use case",
            ],
            "valid_approaches": [
                {
                    "id": "api_key",
                    "name": "API Key Authentication",
                    "detection_patterns": ["X-API-Key", "x-api-key", "API_KEY"],
                    "tradeoffs": {
                        "pros": [
                            "Simple to implement",
                            "Easy to revoke",
                            "No expiration handling needed",
                        ],
                        "cons": [
                            "Must be stored securely",
                            "No built-in expiration",
                            "Less suitable for user-facing apps",
                        ],
                    },
                },
                {
                    "id": "basic_auth",
                    "name": "HTTP Basic Authentication",
                    "detection_patterns": [
                        "Authorization: Basic",
                        "base64",
                        "werkzeug.security",
                    ],
                    "tradeoffs": {
                        "pros": [
                            "Standard HTTP mechanism",
                            "Built-in browser support",
                            "Simple for development",
                        ],
                        "cons": [
                            "Credentials sent with every request",
                            "Must use HTTPS",
                            "No built-in session management",
                        ],
                    },
                },
                {
                    "id": "jwt",
                    "name": "JWT Bearer Token",
                    "detection_patterns": [
                        "Authorization: Bearer",
                        "PyJWT",
                        "jwt.encode",
                        "jwt.decode",
                    ],
                    "tradeoffs": {
                        "pros": [
                            "Stateless",
                            "Self-contained claims",
                            "Standard for modern APIs",
                            "Built-in expiration",
                        ],
                        "cons": [
                            "Larger token size",
                            "Cannot revoke without blacklist",
                            "More complex implementation",
                        ],
                    },
                },
            ],
            "universal_criteria": [
                {
                    "id": "protects_write_ops",
                    "criterion": "Protects POST, PUT, DELETE endpoints",
                    "pass_indicators": [
                        "Decorator applied to write routes",
                        "Returns 401 without valid auth",
                    ],
                },
                {
                    "id": "allows_read_ops",
                    "criterion": "GET endpoints remain public",
                    "pass_indicators": [
                        "No auth decorator on GET routes",
                        "GET requests succeed without credentials",
                    ],
                },
                {
                    "id": "proper_401_response",
                    "criterion": "Returns 401 with JSON error body",
                    "pass_indicators": [
                        "Status code 401",
                        "JSON response with error message",
                    ],
                },
                {
                    "id": "uses_decorator_pattern",
                    "criterion": "Uses decorator pattern for auth",
                    "pass_indicators": [
                        "Defines auth decorator function",
                        "Uses functools.wraps",
                    ],
                },
                {
                    "id": "secrets_not_hardcoded",
                    "criterion": "Secrets loaded from environment",
                    "pass_indicators": [
                        "Uses os.getenv or os.environ",
                        "No literal keys in source",
                    ],
                },
            ],
            "approach_specific_criteria": {
                "api_key": [
                    {
                        "id": "header_extraction",
                        "criterion": "Extracts key from X-API-Key header",
                    },
                    {
                        "id": "secure_comparison",
                        "criterion": "Uses constant-time comparison (secrets.compare_digest)",
                    },
                ],
                "basic_auth": [
                    {
                        "id": "base64_decode",
                        "criterion": "Properly decodes Base64 credentials",
                    },
                    {
                        "id": "password_hash",
                        "criterion": "Compares against hashed password, not plaintext",
                    },
                ],
                "jwt": [
                    {
                        "id": "token_decode",
                        "criterion": "Properly decodes and verifies JWT signature",
                    },
                    {
                        "id": "expiration_check",
                        "criterion": "Validates token expiration (exp claim)",
                    },
                    {
                        "id": "claims_usage",
                        "criterion": "Extracts and uses claims from token payload",
                    },
                ],
            },
        }

        rubric = ChallengeRubric(
            learning_goal_id=goal.id,
            title="API Authentication Multi-Approach Rubric",
            rubric_json=json.dumps(rubric_data),
        )
        db.session.add(rubric)
        created_count += 1

    # Second goal: Claude API challenge (if exists)
    if len(goals) > 1:
        goal2 = goals[1]
        existing2 = ChallengeRubric.query.filter_by(learning_goal_id=goal2.id).first()
        if existing2:
            print(f"Rubric for '{goal2.title}' already exists. Skipping.")
        else:
            print(f"Adding multi-approach rubric to: {goal2.title}")
            rubric2 = ChallengeRubric(
                learning_goal_id=goal2.id,
                title="Claude API Integration Multi-Approach Rubric",
                rubric_json=json.dumps(CLAUDE_API_RUBRIC),
            )
            db.session.add(rubric2)
            created_count += 1

    db.session.commit()
    print(f"Created {created_count} challenge rubric(s) successfully!")


def seed_curriculum_and_catalog():
    """Seed 9 curriculum areas with 27 modules (9 published + 18 coming_soon).

    Published modules get 2 goals each with placeholder challenge content.
    The existing Flask API Auth module is linked to the Architecture area.
    """
    print("Seeding curriculum areas and catalog...")

    if CurriculumArea.query.first():
        print("Curriculum areas already exist. Skipping.")
        return

    # ── 9 Curriculum Areas ────────────────────────────────────────────

    areas_data = [
        {
            "slug": "community-of-practice",
            "title": "Community of Practice",
            "description": "Learn through community engagement — from following directions "
            "to presenting your own work. Build skills in legitimate "
            "peripheral participation and grow into a contributor.",
            "icon_name": "users",
            "color": "violet",
            "order": 1,
        },
        {
            "slug": "architecture",
            "title": "Architecture",
            "description": "Understand the infrastructure that powers modern applications. "
            "From hosts and servers to proxies, networking, and authentication "
            "across human, application, and agent identities.",
            "icon_name": "server",
            "color": "blue",
            "order": 2,
        },
        {
            "slug": "building",
            "title": "Building",
            "description": "Master the craft of building software with AI. Debug with logs, "
            "write meaningful tests, manage API versions, coordinate multiple "
            "agents, and deploy with confidence.",
            "icon_name": "hammer",
            "color": "amber",
            "order": 3,
        },
        {
            "slug": "data-modeling",
            "title": "Data Modeling",
            "description": "Design schemas, manipulate data, and build reliable APIs. "
            "Learn idempotency, data privacy classifications, and PII "
            "cleansing for responsible data handling.",
            "icon_name": "database",
            "color": "emerald",
            "order": 4,
        },
        {
            "slug": "discovery-and-design",
            "title": "Discovery & Design",
            "description": "Use prototypes to learn, shape problems before solving them, "
            "and apply design systems effectively. Practice spec-driven "
            "development and product briefs.",
            "icon_name": "lightbulb",
            "color": "pink",
            "order": 5,
        },
        {
            "slug": "navigating-org",
            "title": "Navigating your Organization",
            "description": "Find teams doing complementary work, pitch partnerships, "
            "scope doable pieces of work, and balance people's attention "
            "with your innovation efforts.",
            "icon_name": "compass",
            "color": "cyan",
            "order": 6,
        },
        {
            "slug": "auto-didactic",
            "title": "Auto-didactic",
            "description": "Develop self-learning skills and learn to respond to feedback "
            "effectively. Build the meta-skills that accelerate everything else.",
            "icon_name": "brain",
            "color": "orange",
            "order": 7,
        },
        {
            "slug": "ai-design-principles",
            "title": "AI Design Principles",
            "description": "Design AI interactions that actually help. Learn conversational "
            "AI patterns, human-in-the-loop design, context engineering, "
            "caching strategies, and latency/cost tradeoffs.",
            "icon_name": "bot",
            "color": "purple",
            "order": 8,
        },
        {
            "slug": "go-to-market",
            "title": "Go-to-Market",
            "description": "Communicate your work effectively. Record compelling demo "
            "videos, create 1-pager presentations, and pitch to "
            "stakeholders with confidence.",
            "icon_name": "rocket",
            "color": "red",
            "order": 9,
        },
    ]

    areas = {}
    for data in areas_data:
        area = CurriculumArea(**data)
        db.session.add(area)
        db.session.flush()
        areas[data["slug"]] = area

    # ── Link existing module to Architecture area ─────────────────────

    existing_module = LearningModule.query.filter_by(
        title="Flask API Authentication"
    ).first()
    if existing_module:
        existing_module.curriculum_area_id = areas["architecture"].id
        existing_module.estimated_hours = 3.0
        existing_module.difficulty_level = 2
        existing_module.status = "published"
        print(f"  Linked existing module '{existing_module.title}' to Architecture")

    # ── Modules per area (published + coming_soon) ────────────────────

    catalog = {
        "architecture": {
            "coming_soon": [
                {
                    "title": "Deploying with Docker & Reverse Proxies",
                    "description": "Containerize your application and route traffic through "
                    "Nginx. Learn about Docker networking, health checks, "
                    "and reverse proxy configuration.",
                    "difficulty_level": 3,
                    "estimated_hours": 4.0,
                },
                {
                    "title": "Hot Module Reload & Dev Proxies",
                    "description": "Set up a smooth development workflow with HMR, "
                    "dev proxies, and live reload across frontend and backend.",
                    "difficulty_level": 2,
                    "estimated_hours": 2.0,
                },
            ],
        },
        "building": {
            "published": {
                "title": "Debugging with AI: Logs, Traces & Observability",
                "description": "Learn to read logs, set up traces, and use observability "
                "tools to debug AI-powered applications. Understand when "
                "AI builds slop and how to catch it.",
                "difficulty_level": 2,
                "estimated_hours": 3.0,
                "goals": [
                    {
                        "title": "Set Up Structured Logging in Flask",
                        "challenge_md": "## Challenge: Add Structured Logging\n\n"
                        "Your Flask app currently uses `print()` for debugging. "
                        "Replace it with structured logging that captures context, "
                        "request IDs, and timing information.\n\n"
                        "### Requirements\n"
                        "1. Use Python's `logging` module with JSON formatter\n"
                        "2. Add a request ID to every log entry\n"
                        "3. Log request/response timing\n"
                        "4. Create different log levels for different scenarios",
                        "difficulty_level": 2,
                        "category_tags": ["debugging", "logging", "flask", "observability"],
                    },
                    {
                        "title": "Trace AI Calls with LangSmith",
                        "challenge_md": "## Challenge: Add Tracing to AI Calls\n\n"
                        "Your app makes calls to Claude but you can't see what's "
                        "happening inside. Add LangSmith tracing to capture "
                        "every LLM interaction.\n\n"
                        "### Requirements\n"
                        "1. Configure LangSmith environment variables\n"
                        "2. Add @traceable decorator to AI functions\n"
                        "3. Include metadata (model, tokens, latency)\n"
                        "4. Group related traces by session",
                        "difficulty_level": 3,
                        "category_tags": ["ai", "observability", "langsmith", "tracing"],
                    },
                ],
            },
            "coming_soon": [
                {
                    "title": "Automated Testing & AI Evals",
                    "description": "Write tests that actually catch bugs, including AI-specific "
                    "evaluation patterns. Learn to communicate what's been tested.",
                    "difficulty_level": 3,
                    "estimated_hours": 4.0,
                },
                {
                    "title": "Multi-Agent Coordination",
                    "description": "Coordinate multiple AI agents working in parallel. "
                    "Handle shared state, conflict resolution, and work distribution.",
                    "difficulty_level": 4,
                    "estimated_hours": 5.0,
                },
            ],
        },
        "data-modeling": {
            "published": {
                "title": "Schema Design & Idempotent APIs",
                "description": "Design database schemas that evolve gracefully and build "
                "APIs that are safe to retry. Learn idempotency patterns "
                "and data migration strategies.",
                "difficulty_level": 2,
                "estimated_hours": 3.0,
                "goals": [
                    {
                        "title": "Design a Schema with Migration Support",
                        "challenge_md": "## Challenge: Evolving a Database Schema\n\n"
                        "Your app needs a new feature that requires schema changes. "
                        "Add columns and tables without losing existing data.\n\n"
                        "### Requirements\n"
                        "1. Write an Alembic migration for the new schema\n"
                        "2. Handle the case where data already exists\n"
                        "3. Make the migration reversible\n"
                        "4. Test with both empty and populated databases",
                        "difficulty_level": 2,
                        "category_tags": ["database", "schema", "migration", "alembic"],
                    },
                    {
                        "title": "Build an Idempotent API Endpoint",
                        "challenge_md": "## Challenge: Safe-to-Retry API\n\n"
                        "Build a POST endpoint that produces the same result "
                        "whether called once or multiple times with the same input.\n\n"
                        "### Requirements\n"
                        "1. Implement an idempotency key pattern\n"
                        "2. Return the cached result for duplicate requests\n"
                        "3. Handle concurrent requests safely\n"
                        "4. Clean up expired idempotency keys",
                        "difficulty_level": 3,
                        "category_tags": ["api", "idempotency", "database", "patterns"],
                    },
                ],
            },
            "coming_soon": [
                {
                    "title": "Data Privacy & PII Cleansing",
                    "description": "Classify data by sensitivity, implement PII detection, "
                    "and build cleansing pipelines for responsible data handling.",
                    "difficulty_level": 3,
                    "estimated_hours": 3.0,
                },
                {
                    "title": "Building Data APIs",
                    "description": "Design and implement RESTful data APIs with pagination, "
                    "filtering, and access control patterns.",
                    "difficulty_level": 2,
                    "estimated_hours": 3.0,
                },
            ],
        },
        "discovery-and-design": {
            "published": {
                "title": "Prototyping to Learn",
                "description": "Use quick prototypes as a learning tool — not to build "
                "production features, but to discover what questions to ask. "
                "Kill your darlings and avoid tool anchoring.",
                "difficulty_level": 1,
                "estimated_hours": 2.0,
                "goals": [
                    {
                        "title": "Build a Throwaway Prototype",
                        "challenge_md": "## Challenge: Prototype to Discover\n\n"
                        "You have a vague product idea. Build a quick prototype "
                        "NOT to ship, but to learn what questions you should be asking.\n\n"
                        "### Requirements\n"
                        "1. Spend no more than 2 hours building\n"
                        "2. Document 3 things you learned from building it\n"
                        "3. Identify 3 questions that the prototype surfaced\n"
                        "4. Explain what you would do differently now",
                        "difficulty_level": 1,
                        "category_tags": ["prototyping", "discovery", "design"],
                    },
                    {
                        "title": "Write a 1-Pager Product Brief",
                        "challenge_md": "## Challenge: Spec-Driven Design\n\n"
                        "Take what you learned from prototyping and write a concise "
                        "product brief that someone else could build from.\n\n"
                        "### Requirements\n"
                        "1. Problem statement (1 paragraph)\n"
                        "2. Proposed solution (1 paragraph)\n"
                        "3. Key user flows (3-5 bullet points)\n"
                        "4. Success criteria (measurable)",
                        "difficulty_level": 2,
                        "category_tags": ["design", "product", "spec", "writing"],
                    },
                ],
            },
            "coming_soon": [
                {
                    "title": "Design Critique & Killing Darlings",
                    "description": "Practice giving and receiving design feedback. "
                    "Learn when to let go of ideas you love.",
                    "difficulty_level": 2,
                    "estimated_hours": 2.0,
                },
                {
                    "title": "Spec-Driven Development",
                    "description": "Write specs before code. Use OpenAPI, JSON Schema, "
                    "and contract testing to build reliable interfaces.",
                    "difficulty_level": 3,
                    "estimated_hours": 4.0,
                },
            ],
        },
        "community-of-practice": {
            "published": {
                "title": "Your First Show & Tell",
                "description": "Present technical work to a small group. Practice "
                "explaining what you built, why you built it that way, "
                "and what you'd do differently.",
                "difficulty_level": 1,
                "estimated_hours": 1.5,
                "goals": [
                    {
                        "title": "Prepare a 5-Minute Demo",
                        "challenge_md": "## Challenge: Show Your Work\n\n"
                        "Prepare a 5-minute demonstration of something you built. "
                        "The focus is on clarity, not polish.\n\n"
                        "### Requirements\n"
                        "1. Structure: Context → Demo → Learnings\n"
                        "2. Show the running application (not just slides)\n"
                        "3. Highlight one design decision you're proud of\n"
                        "4. Share one thing you'd change",
                        "difficulty_level": 1,
                        "category_tags": ["community", "presentation", "communication"],
                    },
                    {
                        "title": "Give Constructive Feedback on a Peer's Work",
                        "challenge_md": "## Challenge: Feedback as Practice\n\n"
                        "Review a peer's demo and provide structured feedback "
                        "that's specific, kind, and actionable.\n\n"
                        "### Requirements\n"
                        "1. Identify one thing that works well (be specific)\n"
                        "2. Ask one clarifying question about a design choice\n"
                        "3. Suggest one improvement with reasoning\n"
                        "4. Keep it under 3 minutes",
                        "difficulty_level": 1,
                        "category_tags": ["community", "feedback", "communication"],
                    },
                ],
            },
            "coming_soon": [
                {
                    "title": "Presenting Technical Work",
                    "description": "Level up from demos to presentations. Structure "
                    "technical narratives for different audiences.",
                    "difficulty_level": 2,
                    "estimated_hours": 2.0,
                },
                {
                    "title": "Running a Community Session",
                    "description": "Facilitate a learning session for your peers. "
                    "Design exercises, manage discussion, and create space.",
                    "difficulty_level": 3,
                    "estimated_hours": 2.0,
                },
            ],
        },
        "navigating-org": {
            "published": {
                "title": "Finding Complementary Teams",
                "description": "Discover teams doing work that aligns with yours. "
                "Practice pitching mutually beneficial partnerships and "
                "scoping doable pieces of collaboration.",
                "difficulty_level": 2,
                "estimated_hours": 2.0,
                "goals": [
                    {
                        "title": "Map Your Organization's AI Landscape",
                        "challenge_md": "## Challenge: Find Your Allies\n\n"
                        "Map out teams in your org that are working on AI "
                        "or could benefit from AI capabilities.\n\n"
                        "### Requirements\n"
                        "1. Identify at least 3 teams working with AI\n"
                        "2. Describe what each team does and their pain points\n"
                        "3. Identify one overlap with your own work\n"
                        "4. Draft a 2-sentence pitch for collaboration",
                        "difficulty_level": 2,
                        "category_tags": ["organization", "strategy", "collaboration"],
                    },
                    {
                        "title": "Scope a Cross-Team Proof of Concept",
                        "challenge_md": "## Challenge: Small Bets, Big Partnerships\n\n"
                        "Take the overlap you identified and scope a proof "
                        "of concept small enough to ship in one sprint.\n\n"
                        "### Requirements\n"
                        "1. Define the PoC in one paragraph\n"
                        "2. List what each team contributes\n"
                        "3. Define success criteria (measurable)\n"
                        "4. Identify the biggest risk and a mitigation",
                        "difficulty_level": 2,
                        "category_tags": ["organization", "scoping", "collaboration"],
                    },
                ],
            },
            "coming_soon": [
                {
                    "title": "Scoping & Socializing Work",
                    "description": "Break big ideas into shippable chunks and get "
                    "buy-in without burning political capital.",
                    "difficulty_level": 2,
                    "estimated_hours": 2.0,
                },
                {
                    "title": "Balancing Innovation with BAU",
                    "description": "Protect time for innovation while keeping the "
                    "lights on. Manage stakeholder expectations.",
                    "difficulty_level": 3,
                    "estimated_hours": 2.0,
                },
            ],
        },
        "auto-didactic": {
            "published": {
                "title": "Learning How to Learn with AI",
                "description": "Develop meta-learning skills using AI as a tutor. "
                "Learn to prompt for understanding, not just answers, "
                "and build a feedback response practice.",
                "difficulty_level": 1,
                "estimated_hours": 2.0,
                "goals": [
                    {
                        "title": "Use AI to Explain a Concept You Don't Understand",
                        "challenge_md": "## Challenge: AI as Tutor\n\n"
                        "Pick a technical concept you're shaky on. Use an AI "
                        "assistant to build understanding — not just get an answer.\n\n"
                        "### Requirements\n"
                        "1. Start with 'Help me understand...' not 'What is...'\n"
                        "2. Ask at least 3 follow-up questions\n"
                        "3. Rephrase the concept in your own words\n"
                        "4. Identify one thing the AI explained poorly",
                        "difficulty_level": 1,
                        "category_tags": ["learning", "ai", "self-directed"],
                    },
                    {
                        "title": "Build a Learning Log from Feedback",
                        "challenge_md": "## Challenge: Feedback → Growth\n\n"
                        "Take feedback you've received (code review, demo, etc.) "
                        "and turn it into a structured learning plan.\n\n"
                        "### Requirements\n"
                        "1. Collect 3 pieces of feedback from recent work\n"
                        "2. For each: what was said, what it means, what to do\n"
                        "3. Identify patterns across the feedback\n"
                        "4. Set 1 concrete goal for next week",
                        "difficulty_level": 1,
                        "category_tags": ["learning", "feedback", "self-directed"],
                    },
                ],
            },
            "coming_soon": [
                {
                    "title": "Responding to Feedback",
                    "description": "Practice receiving feedback without defensiveness. "
                    "Build a growth mindset through structured reflection.",
                    "difficulty_level": 2,
                    "estimated_hours": 2.0,
                },
                {
                    "title": "Building Your Learning Portfolio",
                    "description": "Create a living portfolio that demonstrates "
                    "your learning journey and growth over time.",
                    "difficulty_level": 2,
                    "estimated_hours": 3.0,
                },
            ],
        },
        "ai-design-principles": {
            "published": {
                "title": "Human-in-the-Loop AI Patterns",
                "description": "Design AI interactions that keep humans in control. "
                "Learn when AI reduces cognitive load vs. adds to it, "
                "and build visibility and control levers.",
                "difficulty_level": 2,
                "estimated_hours": 3.0,
                "goals": [
                    {
                        "title": "Design a Conversational AI Interface",
                        "challenge_md": "## Challenge: Help Me Understand\n\n"
                        "Build an AI chat interface that helps users understand "
                        "a concept, not just get answers.\n\n"
                        "### Requirements\n"
                        "1. The AI should ask clarifying questions\n"
                        "2. Include a 'show me an example' action\n"
                        "3. Let the user rate if the explanation helped\n"
                        "4. Reduce cognitive load with progressive disclosure",
                        "difficulty_level": 2,
                        "category_tags": ["ai", "design", "ux", "conversational"],
                    },
                    {
                        "title": "Add Control Levers to an AI Feature",
                        "challenge_md": "## Challenge: Visibility & Control\n\n"
                        "Take an AI-powered feature and add controls that let "
                        "users adjust the AI's behavior.\n\n"
                        "### Requirements\n"
                        "1. Show what the AI is doing (transparency)\n"
                        "2. Let users adjust strictness/creativity\n"
                        "3. Add an 'undo' or 'try again' option\n"
                        "4. Show confidence indicators where appropriate",
                        "difficulty_level": 2,
                        "category_tags": ["ai", "design", "ux", "control"],
                    },
                    {
                        "title": "Evaluate Cognitive Load in an AI Interaction",
                        "challenge_md": "## Challenge: Less is More\n\n"
                        "Analyze an existing AI feature and identify where it "
                        "adds cognitive load instead of reducing it.\n\n"
                        "### Requirements\n"
                        "1. Identify 3 moments of unnecessary complexity\n"
                        "2. Propose simplifications for each\n"
                        "3. Test with a peer and get their reaction\n"
                        "4. Document the before/after",
                        "difficulty_level": 3,
                        "category_tags": ["ai", "design", "cognitive-load", "evaluation"],
                    },
                ],
            },
            "coming_soon": [
                {
                    "title": "Context Engineering & Caching",
                    "description": "Master the art of providing the right context to AI. "
                    "Learn caching strategies to reduce latency and cost.",
                    "difficulty_level": 3,
                    "estimated_hours": 4.0,
                },
                {
                    "title": "Latency, Cost & Prototyping Tradeoffs",
                    "description": "Make informed decisions about model selection, "
                    "caching, and architecture based on real constraints.",
                    "difficulty_level": 3,
                    "estimated_hours": 3.0,
                },
            ],
        },
        "go-to-market": {
            "published": {
                "title": "Recording a Compelling Demo Video",
                "description": "Learn to record short, compelling videos that "
                "communicate what your work does and why it matters. "
                "Focus on clarity and narrative over production value.",
                "difficulty_level": 1,
                "estimated_hours": 2.0,
                "goals": [
                    {
                        "title": "Record a 2-Minute Demo",
                        "challenge_md": "## Challenge: Show, Don't Tell\n\n"
                        "Record a 2-minute video demonstrating something you built. "
                        "The video should make someone want to try it.\n\n"
                        "### Requirements\n"
                        "1. Hook in the first 10 seconds (what problem does it solve?)\n"
                        "2. Show the product in action, not slides\n"
                        "3. End with what's next or how to get involved\n"
                        "4. Keep it under 2 minutes",
                        "difficulty_level": 1,
                        "category_tags": ["video", "communication", "go-to-market"],
                    },
                    {
                        "title": "Create a 1-Pager Leave-Behind",
                        "challenge_md": "## Challenge: The 1-Pager\n\n"
                        "Create a single-page document that someone can share "
                        "after seeing your demo.\n\n"
                        "### Requirements\n"
                        "1. Problem and solution in 2 sentences each\n"
                        "2. One screenshot or diagram\n"
                        "3. 3 bullet points of key capabilities\n"
                        "4. One clear call to action",
                        "difficulty_level": 1,
                        "category_tags": ["writing", "communication", "go-to-market"],
                    },
                ],
            },
            "coming_soon": [
                {
                    "title": "The 1-Pager: Leave-Behind Presentations",
                    "description": "Master the art of concise written communication. "
                    "Create documents that sell your ideas.",
                    "difficulty_level": 2,
                    "estimated_hours": 2.0,
                },
                {
                    "title": "Pitching to Stakeholders",
                    "description": "Craft and deliver pitches tailored to different "
                    "audiences — executives, engineers, and users.",
                    "difficulty_level": 3,
                    "estimated_hours": 2.0,
                },
            ],
        },
    }

    modules_created = 0
    goals_created = 0

    for area_slug, area_content in catalog.items():
        area = areas[area_slug]

        # Create published module with goals (if not the existing one)
        if "published" in area_content:
            pub = area_content["published"]
            module = LearningModule(
                title=pub["title"],
                description=pub["description"],
                curriculum_area_id=area.id,
                difficulty_level=pub["difficulty_level"],
                estimated_hours=pub["estimated_hours"],
                status="published",
                order=1,
            )
            db.session.add(module)
            db.session.flush()
            modules_created += 1

            for i, goal_data in enumerate(pub.get("goals", []), start=1):
                goal = LearningGoal(
                    module_id=module.id,
                    title=goal_data["title"],
                    challenge_md=goal_data["challenge_md"],
                    video_url="",
                    starter_repo="",
                    order=i,
                    difficulty_level=goal_data.get("difficulty_level", 1),
                    category_tags_json=json.dumps(
                        goal_data.get("category_tags", [])
                    ),
                )
                db.session.add(goal)
                goals_created += 1

        # Create coming_soon modules (no goals)
        for i, cs in enumerate(area_content.get("coming_soon", []), start=2):
            module = LearningModule(
                title=cs["title"],
                description=cs["description"],
                curriculum_area_id=area.id,
                difficulty_level=cs["difficulty_level"],
                estimated_hours=cs["estimated_hours"],
                status="coming_soon",
                order=i + 1 if "published" in area_content else i,
            )
            db.session.add(module)
            modules_created += 1

    db.session.commit()
    print(f"Created {len(areas_data)} curriculum areas")
    print(f"Created {modules_created} modules ({goals_created} goals)")
    print("Catalog seeding complete!")


def check_database_health():
    """
    Check if database needs seeding.

    Returns dict with status:
    - db_exists: bool
    - needs_full_seed: bool (no users/modules)
    - needs_rubrics: bool (CoreLearningGoals missing)
    - is_healthy: bool
    """
    import os

    db_path = "instance/code_dojo.db"
    db_exists = os.path.exists(db_path)

    health = {
        "db_exists": db_exists,
        "needs_full_seed": False,
        "needs_rubrics": False,
        "is_healthy": False,
    }

    if not db_exists:
        health["needs_full_seed"] = True
        return health

    user_count = User.query.count()
    module_count = LearningModule.query.count()
    core_goal_count = CoreLearningGoal.query.count()

    if user_count == 0 or module_count == 0:
        health["needs_full_seed"] = True
    elif core_goal_count == 0:
        health["needs_rubrics"] = True
    else:
        health["is_healthy"] = True

    return health


def print_database_status():
    """Print current database status for debugging."""
    print("\n" + "=" * 60)
    print("DATABASE STATUS")
    print("=" * 60)

    print(f"Curriculum Areas:  {CurriculumArea.query.count():3d}")
    print(f"Users:             {User.query.count():3d}")
    print(f"Learning Modules:  {LearningModule.query.count():3d}")
    print(f"Learning Goals:    {LearningGoal.query.count():3d}")
    print(f"Core Goals (Gems): {CoreLearningGoal.query.count():3d}")
    print(f"Challenge Rubrics: {ChallengeRubric.query.count():3d}")
    print(f"Anatomy Topics:    {AnatomyTopic.query.count():3d}")

    print("=" * 60 + "\n")


def _ensure_schema():
    """Ensure all tables and columns exist (handles upgrades)."""
    print("Ensuring schema is up to date...")
    db.create_all()
    # Add new columns to learning_modules if they don't exist yet
    # (db.create_all creates new tables but doesn't ALTER existing ones)
    dialect = db.engine.dialect.name  # "sqlite" or "postgresql"
    migrations = {
        "curriculum_area_id": "ALTER TABLE learning_modules ADD COLUMN curriculum_area_id INTEGER REFERENCES curriculum_areas(id)",
        "estimated_hours": "ALTER TABLE learning_modules ADD COLUMN estimated_hours REAL",
        "difficulty_level": "ALTER TABLE learning_modules ADD COLUMN difficulty_level INTEGER DEFAULT 1",
        "status": "ALTER TABLE learning_modules ADD COLUMN status VARCHAR(20) DEFAULT 'published'",
    }
    try:
        with db.engine.connect() as conn:
            # Get existing columns (works for both SQLite and PostgreSQL)
            if dialect == "sqlite":
                rows = conn.execute(
                    sa_text("PRAGMA table_info(learning_modules)")
                ).fetchall()
                existing = [row[1] for row in rows]
            else:
                rows = conn.execute(
                    sa_text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_name = 'learning_modules'"
                    )
                ).fetchall()
                existing = [row[0] for row in rows]

            for col, sql in migrations.items():
                if col not in existing:
                    conn.execute(sa_text(sql))
                    print(f"  Migration: added learning_modules.{col}")
            conn.commit()
            print(f"  Schema is up to date ({dialect}).")
    except Exception as e:
        print(f"  Warning: schema migration failed: {e}")
        import traceback
        traceback.print_exc()


def smart_seed():
    """Intelligently seed only missing data."""
    _ensure_schema()
    health = check_database_health()

    if health["needs_full_seed"]:
        print("Database missing core data. Running full seed...")
        seed_database()
        seed_core_learning_goals()
        seed_challenge_rubric()
        seed_curriculum_and_catalog()
    elif health["needs_rubrics"]:
        print("CoreLearningGoals missing. Seeding rubrics...")
        seed_core_learning_goals()
        seed_challenge_rubric()
        seed_curriculum_and_catalog()
    else:
        # Always try to seed curriculum if missing
        if not CurriculumArea.query.first():
            seed_curriculum_and_catalog()
        else:
            print("Database is healthy - no seeding needed.")


if __name__ == "__main__":
    with app.app_context():
        if len(sys.argv) > 1:
            arg = sys.argv[1]

            if arg == "--reset":
                reset_database()
            elif arg == "--anatomy":
                seed_anatomy_topics()
            elif arg == "--rubrics":
                seed_core_learning_goals()
            elif arg == "--challenge-rubric":
                seed_challenge_rubric()
            elif arg == "--catalog":
                seed_curriculum_and_catalog()
            elif arg == "--all":
                seed_database()
                seed_core_learning_goals()
                seed_challenge_rubric()
                seed_curriculum_and_catalog()
            elif arg == "--check":
                print_database_status()
            elif arg == "--smart":
                smart_seed()
            else:
                seed_database()
        else:
            seed_database()
