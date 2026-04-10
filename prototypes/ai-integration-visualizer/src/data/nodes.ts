import type { NodeDataModel } from "../types";

/**
 * All 55 node data models with before/after transformations and pattern narratives.
 * Organized by pipeline stage: INTAKE -> TRANSFORMATION -> DECISION -> ACTION.
 */
export const NODE_MODELS: NodeDataModel[] = [
  // ══════════════════════════════════════════════
  // Stage 1: INTAKE (13 nodes)
  // ══════════════════════════════════════════════

  // load-balancer (49)
  {
    nodeId: 49, label: "load-balancer", stage: "intake", conversionOrder: 0,
    before: {
      summary: "Round-robin traffic distribution across fixed server pool",
      inputFields: [{ name: "request", type: "object" }, { name: "server_pool", type: "string[]" }],
      outputFields: [{ name: "target_server", type: "string" }, { name: "response", type: "object" }],
      logic: "Cycles through server list sequentially, no awareness of load or request type.",
      pain: "Hot spots during peak traffic. No awareness of downstream capacity.",
    },
    after: {
      summary: "Adaptive load distribution using real-time health and request classification",
      inputFields: [{ name: "request", type: "object" }, { name: "server_pool", type: "string[]" }, { name: "server_health", type: "object", isNew: true }],
      outputFields: [{ name: "target_server", type: "string" }, { name: "response", type: "object" }, { name: "routing_latency_ms", type: "number", isNew: true }],
      logic: "Classifies request complexity and routes to servers with matching capacity headroom.",
      gain: "40% reduction in p99 latency. Auto-scales routing during traffic spikes.",
    },
    patterns: {
      embedded: { action: "Replace round-robin with adaptive routing inside the existing load balancer service." },
      connected: { action: "Load balancer supports integration infrastructure by routing AI moon traffic alongside brownfield requests." },
      independent: { action: "New traffic management layer built from scratch with ML-native routing." },
    },
  },

  // routing-logic (48)
  {
    nodeId: 48, label: "routing-logic", stage: "intake", conversionOrder: 1,
    before: {
      summary: "Static configuration table mapping request types to processing queues",
      inputFields: [{ name: "request_type", type: "string" }, { name: "source_channel", type: "string" }],
      outputFields: [{ name: "queue_name", type: "string" }, { name: "priority", type: "number" }],
      logic: "Lookup request_type in config table, return hardcoded queue assignment and priority.",
      pain: "Config table has 200+ entries maintained manually. New request types require code deploys.",
    },
    after: {
      summary: "Intent-classified routing with dynamic queue assignment",
      inputFields: [{ name: "request_type", type: "string" }, { name: "source_channel", type: "string" }, { name: "request_context", type: "object", isNew: true }],
      outputFields: [{ name: "queue_name", type: "string" }, { name: "priority", type: "number" }, { name: "routing_confidence", type: "number", isNew: true }],
      logic: "NLP classifier determines intent from request context, assigns queue dynamically. Falls back to config table if confidence < 0.85.",
      gain: "New request types auto-route without config changes. Self-documenting routing decisions.",
    },
    patterns: {
      embedded: { action: "Replace config table lookup with intent classifier inside the routing service." },
      connected: { action: "Routing service supports integration infrastructure by directing API traffic between brownfield and AI moon." },
      independent: { action: "New routing layer built from scratch with ML-first request classification." },
    },
  },

  // rate-limiter (9)
  {
    nodeId: 9, label: "rate-limiter", stage: "intake", conversionOrder: 2,
    before: {
      summary: "Fixed-window rate limiting with per-client token buckets",
      inputFields: [{ name: "client_id", type: "string" }, { name: "endpoint", type: "string" }],
      outputFields: [{ name: "allowed", type: "boolean" }, { name: "remaining_tokens", type: "number" }],
      logic: "Each client gets N tokens per minute per endpoint. Tokens replenish on fixed window boundary.",
      pain: "Legitimate burst traffic gets throttled. Sophisticated abuse patterns bypass simple token counts.",
    },
    after: {
      summary: "Adaptive rate limiting with behavioral pattern detection",
      inputFields: [{ name: "client_id", type: "string" }, { name: "endpoint", type: "string" }, { name: "request_pattern", type: "object", isNew: true }],
      outputFields: [{ name: "allowed", type: "boolean" }, { name: "remaining_tokens", type: "number" }, { name: "threat_score", type: "number", isNew: true }],
      logic: "ML model scores request patterns against known abuse signatures. Legitimate bursts get temporary limit elevation.",
      gain: "95% fewer false-positive throttles for legitimate clients. Catches novel abuse patterns in real time.",
    },
    patterns: {
      embedded: { action: "Replace fixed token bucket with adaptive rate limiter inside existing service." },
      connected: { action: "Rate limiter supports integration infrastructure by managing API call quotas for AI moon traffic." },
      independent: { action: "New API gateway built from scratch with ML-native traffic management." },
    },
  },

  // cache-layer (8)
  {
    nodeId: 8, label: "cache-layer", stage: "intake", conversionOrder: 3,
    before: {
      summary: "TTL-based key-value cache with fixed expiration policies",
      inputFields: [{ name: "cache_key", type: "string" }, { name: "ttl_seconds", type: "number" }],
      outputFields: [{ name: "cached_value", type: "object" }, { name: "hit", type: "boolean" }],
      logic: "Store values with fixed TTL. Evict on expiration or LRU when memory pressure hits threshold.",
      pain: "Static TTLs mean stale data for fast-changing refs and wasted refreshes for stable data.",
    },
    after: {
      summary: "Predictive caching with adaptive TTL based on access patterns",
      inputFields: [{ name: "cache_key", type: "string" }, { name: "ttl_seconds", type: "number" }, { name: "access_history", type: "object", isNew: true }],
      outputFields: [{ name: "cached_value", type: "object" }, { name: "hit", type: "boolean" }, { name: "predicted_staleness", type: "number", isNew: true }],
      logic: "ML model predicts optimal TTL per key based on historical access patterns and update frequency.",
      gain: "30% improvement in cache hit rate. Stale-data incidents reduced by 80%.",
    },
    patterns: {
      embedded: { action: "Replace fixed TTL with predictive caching logic inside existing cache layer." },
      connected: { action: "Cache layer supports integration infrastructure by caching AI moon responses for repeated queries." },
      independent: { action: "New caching tier built from scratch with ML-native eviction policies." },
    },
  },

  // event-bus (7)
  {
    nodeId: 7, label: "event-bus", stage: "intake", conversionOrder: 4,
    before: {
      summary: "Topic-based pub/sub with static subscription routing",
      inputFields: [{ name: "event_type", type: "string" }, { name: "payload", type: "object" }],
      outputFields: [{ name: "delivery_status", type: "string" }, { name: "subscriber_count", type: "number" }],
      logic: "Publish event to all subscribers registered for that topic. No filtering, no prioritization.",
      pain: "Noisy subscribers get overwhelmed. No way to prioritize critical events over informational ones.",
    },
    after: {
      summary: "Smart event routing with content-based filtering and priority inference",
      inputFields: [{ name: "event_type", type: "string" }, { name: "payload", type: "object" }, { name: "event_urgency", type: "string", isNew: true }],
      outputFields: [{ name: "delivery_status", type: "string" }, { name: "subscriber_count", type: "number" }, { name: "priority_routing", type: "boolean", isNew: true }],
      logic: "Classifier infers event urgency from payload content. High-priority events skip queue, others batch for efficiency.",
      gain: "Critical events delivered 5x faster. Subscriber message volume reduced 60% via smart filtering.",
    },
    patterns: {
      embedded: { action: "Replace static topic routing with content-based smart routing inside the event bus." },
      connected: { action: "Event bus emits domain events to AI moon for real-time processing and enrichment.", integrationWork: "Add event stream endpoint for AI moon subscription.", apiEmits: [{ name: "domain_event_stream", type: "object" }], apiReceives: [{ name: "enriched_event", type: "object" }] },
      independent: { action: "New event-driven architecture built from scratch with ML-native event classification." },
    },
  },

  // queue-handler (6)
  {
    nodeId: 6, label: "queue-handler", stage: "intake", conversionOrder: 5,
    before: {
      summary: "FIFO queue processing with fixed worker pool",
      inputFields: [{ name: "message", type: "object" }, { name: "queue_name", type: "string" }],
      outputFields: [{ name: "processed", type: "boolean" }, { name: "worker_id", type: "string" }],
      logic: "Messages processed in order received. Fixed number of workers per queue. Dead letter queue after 3 retries.",
      pain: "Priority messages wait behind bulk jobs. Worker allocation doesn't adapt to queue depth.",
    },
    after: {
      summary: "Priority-aware queue processing with elastic worker scaling",
      inputFields: [{ name: "message", type: "object" }, { name: "queue_name", type: "string" }, { name: "message_priority", type: "number", isNew: true }],
      outputFields: [{ name: "processed", type: "boolean" }, { name: "worker_id", type: "string" }, { name: "queue_wait_ms", type: "number", isNew: true }],
      logic: "ML model scores message priority. Workers auto-scale based on predicted queue depth. Priority messages preempt bulk processing.",
      gain: "Priority messages processed 10x faster. Worker utilization improved 45% through predictive scaling.",
    },
    patterns: {
      embedded: { action: "Replace FIFO processing with priority-aware queue handler inside existing service." },
      connected: { action: "Queue handler routes AI-bound messages to moon processing pipeline.", integrationWork: "Add queue routing rules for AI moon destination.", apiEmits: [{ name: "queued_message", type: "object" }], apiReceives: [{ name: "processing_result", type: "object" }] },
      independent: { action: "New message processing platform built from scratch with ML-native prioritization." },
    },
  },

  // auth-gateway (1)
  {
    nodeId: 1, label: "auth-gateway", stage: "intake", conversionOrder: 6,
    before: {
      summary: "Static credential validation with role-based access control",
      inputFields: [{ name: "credentials", type: "object" }, { name: "requested_resource", type: "string" }],
      outputFields: [{ name: "session_token", type: "string" }, { name: "authorized", type: "boolean" }],
      logic: "Validate credentials against user store. Check role-permission matrix for resource access.",
      pain: "Role explosion as org grows. No awareness of behavioral anomalies or context-based risk.",
    },
    after: {
      summary: "Adaptive authentication with behavioral risk scoring",
      inputFields: [{ name: "credentials", type: "object" }, { name: "requested_resource", type: "string" }, { name: "login_context", type: "object", isNew: true }],
      outputFields: [{ name: "session_token", type: "string" }, { name: "authorized", type: "boolean" }, { name: "risk_level", type: "string", isNew: true }],
      logic: "ML model scores login context (device, location, time, behavior) against user baseline. Elevated risk triggers step-up authentication.",
      gain: "Account takeover attempts caught 3x more often. Trusted users get frictionless access.",
    },
    patterns: {
      embedded: { action: "Replace static RBAC with adaptive auth inside the existing gateway." },
      connected: { action: "Auth gateway sends login context to AI moon for risk scoring, receives risk assessment back.", integrationWork: "Add /api/v2/auth-risk endpoint to auth service.", apiEmits: [{ name: "login_context_bundle", type: "object" }], apiReceives: [{ name: "risk_assessment", type: "object" }] },
      independent: { action: "New identity platform built from scratch with ML-native risk-based authentication." },
    },
  },

  // session-mgr (2)
  {
    nodeId: 2, label: "session-mgr", stage: "intake", conversionOrder: 7,
    before: {
      summary: "Fixed-timeout session management with server-side state",
      inputFields: [{ name: "session_token", type: "string" }, { name: "action", type: "string" }],
      outputFields: [{ name: "session_valid", type: "boolean" }, { name: "session_data", type: "object" }],
      logic: "Sessions expire after fixed idle timeout. All session state stored server-side in Redis.",
      pain: "Users get logged out during legitimate long tasks. No context about user intent or engagement.",
    },
    after: {
      summary: "Adaptive session management with engagement-aware timeouts",
      inputFields: [{ name: "session_token", type: "string" }, { name: "action", type: "string" }, { name: "engagement_signals", type: "object", isNew: true }],
      outputFields: [{ name: "session_valid", type: "boolean" }, { name: "session_data", type: "object" }, { name: "timeout_adjusted", type: "boolean", isNew: true }],
      logic: "ML model predicts user engagement from interaction patterns. Active users get extended sessions; idle sessions expire faster.",
      gain: "70% fewer forced logouts during active work. Security improved with faster idle expiry.",
    },
    patterns: {
      embedded: { action: "Replace fixed timeouts with adaptive session logic inside existing session manager." },
      connected: { action: "Session manager sends engagement signals to AI moon for timeout prediction.", integrationWork: "Add engagement telemetry endpoint.", apiEmits: [{ name: "session_telemetry", type: "object" }], apiReceives: [{ name: "timeout_recommendation", type: "object" }] },
      independent: { action: "New session platform built from scratch with ML-native engagement tracking." },
    },
  },

  // intake-router (0)
  {
    nodeId: 0, label: "intake-router", stage: "intake", conversionOrder: 8,
    before: {
      summary: "Static regex-based routing table mapping URL patterns to handler queues",
      inputFields: [{ name: "path", type: "string" }, { name: "method", type: "string" }, { name: "headers", type: "object" }],
      outputFields: [{ name: "queue_name", type: "string" }, { name: "priority", type: "number" }],
      logic: "Match path against 200+ regex rules, assign to queue by first match. Priority is hardcoded per queue.",
      pain: "Regex rules accumulate over years. No one knows which are active. Routing errors cause silent misdelivery.",
    },
    after: {
      summary: "Intent-classified routing with fallback to rules",
      inputFields: [{ name: "path", type: "string" }, { name: "method", type: "string" }, { name: "headers", type: "object" }, { name: "request_body_preview", type: "string", isNew: true }],
      outputFields: [{ name: "queue_name", type: "string" }, { name: "priority", type: "number" }, { name: "confidence", type: "number", isNew: true }, { name: "routing_reason", type: "string", isNew: true }],
      logic: "NLP classifier reads request metadata + body preview to determine intent. Routes by intent with confidence score. Falls back to regex if confidence < 0.85.",
      gain: "Self-documenting routing. Misdelivery rate drops. New request types auto-categorize without rule authoring.",
    },
    patterns: {
      embedded: { action: "Replace regex routing table with intent classifier inside the existing routing service." },
      connected: { action: "Old router emits request metadata to AI moon for intent classification, receives routing decision back.", integrationWork: "Add /api/v2/classify-intent endpoint to routing service.", apiEmits: [{ name: "request_metadata", type: "object" }], apiReceives: [{ name: "route_decision", type: "object" }] },
      independent: { action: "New intake gateway built from scratch with ML-first routing. Old router continues unchanged." },
    },
  },

  // intake-flow (5)
  {
    nodeId: 5, label: "intake-flow", stage: "intake", conversionOrder: 9,
    before: {
      summary: "Hardcoded multi-step intake orchestration with fixed step sequence",
      inputFields: [{ name: "application_data", type: "object" }, { name: "step_number", type: "number" }],
      outputFields: [{ name: "next_step", type: "number" }, { name: "validation_result", type: "object" }],
      logic: "Each application follows the same fixed sequence of intake steps regardless of product or applicant.",
      pain: "Simple applications go through unnecessary steps. Complex ones miss needed validations.",
    },
    after: {
      summary: "Adaptive intake orchestration that customizes step sequence per application",
      inputFields: [{ name: "application_data", type: "object" }, { name: "step_number", type: "number" }, { name: "applicant_profile", type: "object", isNew: true }],
      outputFields: [{ name: "next_step", type: "number" }, { name: "validation_result", type: "object" }, { name: "steps_remaining", type: "number", isNew: true }],
      logic: "ML model predicts which steps are needed based on application type and applicant profile. Skips unnecessary steps, adds needed ones.",
      gain: "Average intake time reduced 35%. Application completeness improved because complex cases get extra validation.",
    },
    patterns: {
      embedded: { action: "Replace fixed step sequence with adaptive orchestration inside existing intake flow service." },
      connected: { action: "Intake flow sends application context to AI moon, receives optimized step sequence.", integrationWork: "Add /api/v2/optimize-flow endpoint.", apiEmits: [{ name: "application_context", type: "object" }], apiReceives: [{ name: "optimized_steps", type: "object" }] },
      independent: { action: "New intake platform built from scratch with ML-native flow optimization." },
    },
  },

  // data-mapper (4)
  {
    nodeId: 4, label: "data-mapper", stage: "intake", conversionOrder: 10,
    before: {
      summary: "Static XSLT/JSON transformation rules mapping external formats to internal schema",
      inputFields: [{ name: "source_data", type: "object" }, { name: "source_format", type: "string" }],
      outputFields: [{ name: "canonical_record", type: "object" }, { name: "mapping_errors", type: "string[]" }],
      logic: "Apply format-specific transformation template. Log fields that don't map. Reject records with required field gaps.",
      pain: "New data sources require weeks of mapping work. Schema changes break existing mappings silently.",
    },
    after: {
      summary: "AI-assisted schema mapping with automatic format detection and field inference",
      inputFields: [{ name: "source_data", type: "object" }, { name: "source_format", type: "string" }, { name: "schema_hints", type: "object", isNew: true }],
      outputFields: [{ name: "canonical_record", type: "object" }, { name: "mapping_errors", type: "string[]" }, { name: "mapping_confidence", type: "number", isNew: true }],
      logic: "ML model infers field mappings from data shape and content. Auto-detects format changes and suggests mapping updates.",
      gain: "New data source onboarding in hours not weeks. Schema drift detected automatically.",
    },
    patterns: {
      embedded: { action: "Replace static XSLT/JSON templates with ML-assisted mapping inside existing mapper." },
      connected: { action: "Data mapper sends unmapped fields to AI moon for inference, receives mapping suggestions.", integrationWork: "Add /api/v2/infer-mapping endpoint.", apiEmits: [{ name: "unmapped_fields", type: "object" }], apiReceives: [{ name: "mapping_suggestions", type: "object" }] },
      independent: { action: "New data integration platform built from scratch with ML-native schema inference." },
    },
  },

  // form-validator (3)
  {
    nodeId: 3, label: "form-validator", stage: "intake", conversionOrder: 11,
    before: {
      summary: "Regex and range-check field validation with hardcoded rules",
      inputFields: [{ name: "form_data", type: "object" }, { name: "form_type", type: "string" }],
      outputFields: [{ name: "valid", type: "boolean" }, { name: "errors", type: "string[]" }],
      logic: "Apply regex patterns and range checks per field. Return all failing fields. No cross-field validation.",
      pain: "Rules miss semantic errors (valid format, wrong content). No cross-field consistency checks.",
    },
    after: {
      summary: "Semantic field validation with cross-field consistency checking",
      inputFields: [{ name: "form_data", type: "object" }, { name: "form_type", type: "string" }, { name: "submission_context", type: "object", isNew: true }],
      outputFields: [{ name: "valid", type: "boolean" }, { name: "errors", type: "string[]" }, { name: "suggestions", type: "string[]", isNew: true }],
      logic: "ML model validates field content semantically and checks cross-field consistency. Suggests corrections for common errors.",
      gain: "Catches 40% more data quality issues. User-friendly suggestions reduce form abandonment.",
    },
    patterns: {
      embedded: { action: "Replace regex validation with semantic validation inside existing form validator." },
      connected: { action: "Form validator sends ambiguous fields to AI moon for semantic analysis.", integrationWork: "Add /api/v2/validate-semantic endpoint.", apiEmits: [{ name: "form_fields", type: "object" }], apiReceives: [{ name: "semantic_validation", type: "object" }] },
      independent: { action: "New form processing platform built from scratch with ML-native validation." },
    },
  },

  // identity-verify (12)
  {
    nodeId: 12, label: "identity-verify", stage: "intake", conversionOrder: 12,
    before: {
      summary: "Third-party API call for identity verification with pass/fail result",
      inputFields: [{ name: "applicant_name", type: "string" }, { name: "ssn", type: "string" }, { name: "dob", type: "string" }],
      outputFields: [{ name: "verified", type: "boolean" }, { name: "match_score", type: "number" }],
      logic: "Send PII to external identity provider. Accept if match score > 80. Reject otherwise with manual review queue.",
      pain: "Single-vendor dependency. No fallback when provider is down. Binary pass/fail misses partial matches.",
    },
    after: {
      summary: "Multi-source identity verification with confidence-weighted consensus",
      inputFields: [{ name: "applicant_name", type: "string" }, { name: "ssn", type: "string" }, { name: "dob", type: "string" }, { name: "document_scan", type: "binary", isNew: true }],
      outputFields: [{ name: "verified", type: "boolean" }, { name: "match_score", type: "number" }, { name: "confidence_breakdown", type: "object", isNew: true }],
      logic: "ML ensemble combines multiple verification sources with OCR document scan. Weighted consensus scoring with explainable confidence breakdown.",
      gain: "99.5% verification accuracy vs 94% before. Multi-source resilience eliminates single-vendor downtime.",
    },
    patterns: {
      embedded: { action: "Replace single-vendor call with multi-source verification ensemble inside existing service." },
      connected: { action: "Identity service sends applicant data to AI moon for enhanced verification, receives enriched result.", integrationWork: "Add /api/v2/verify-enhanced endpoint with document upload.", apiEmits: [{ name: "identity_bundle", type: "object" }], apiReceives: [{ name: "enhanced_verification", type: "object" }] },
      independent: { action: "New identity platform built from scratch with ML-native multi-source verification." },
    },
  },

  // ══════════════════════════════════════════════
  // Stage 2: TRANSFORMATION (13 nodes)
  // ══════════════════════════════════════════════

  // archive-svc (39)
  {
    nodeId: 39, label: "archive-svc", stage: "transform", conversionOrder: 13,
    before: {
      summary: "Time-based archival moving records to cold storage after fixed retention period",
      inputFields: [{ name: "record_id", type: "string" }, { name: "record_age_days", type: "number" }],
      outputFields: [{ name: "archived", type: "boolean" }, { name: "storage_tier", type: "string" }],
      logic: "Move records older than 90 days to cold storage. No awareness of record importance or access patterns.",
      pain: "Frequently accessed historical records get archived, requiring slow retrieval. Rarely accessed recent records waste hot storage.",
    },
    after: {
      summary: "Access-pattern-aware archival with intelligent tiering",
      inputFields: [{ name: "record_id", type: "string" }, { name: "record_age_days", type: "number" }, { name: "access_frequency", type: "number", isNew: true }],
      outputFields: [{ name: "archived", type: "boolean" }, { name: "storage_tier", type: "string" }, { name: "predicted_next_access", type: "string", isNew: true }],
      logic: "ML model predicts future access probability per record. High-access records stay hot regardless of age.",
      gain: "60% reduction in cold-retrieval latency. Storage costs reduced 25% through intelligent tiering.",
    },
    patterns: {
      embedded: { action: "Replace time-based archival with ML-driven tiering inside existing archive service." },
      connected: { action: "Archive service sends access metadata to AI moon for tiering predictions.", integrationWork: "Add access telemetry stream.", apiEmits: [{ name: "record_metadata", type: "object" }], apiReceives: [{ name: "tiering_recommendation", type: "object" }] },
      independent: { action: "New storage management platform built from scratch with ML-native data lifecycle." },
    },
  },

  // data-warehouse (44)
  {
    nodeId: 44, label: "data-warehouse", stage: "transform", conversionOrder: 14,
    before: {
      summary: "Traditional star-schema data warehouse with scheduled batch loads",
      inputFields: [{ name: "source_data", type: "object" }, { name: "load_schedule", type: "string" }],
      outputFields: [{ name: "loaded_rows", type: "number" }, { name: "load_status", type: "string" }],
      logic: "Nightly ETL batch loads data into star-schema tables. Queries run against yesterday's data.",
      pain: "Data is always at least 24 hours stale. Schema changes require expensive migration projects.",
    },
    after: {
      summary: "Streaming data warehouse with AI-optimized query patterns and real-time ingestion",
      inputFields: [{ name: "source_data", type: "object" }, { name: "load_schedule", type: "string" }, { name: "stream_events", type: "object[]", isNew: true }],
      outputFields: [{ name: "loaded_rows", type: "number" }, { name: "load_status", type: "string" }, { name: "data_freshness_ms", type: "number", isNew: true }],
      logic: "Streaming ingestion with ML-optimized materialized views that auto-adapt to query patterns.",
      gain: "Real-time data freshness. Query performance improves automatically as usage patterns evolve.",
    },
    patterns: {
      embedded: { action: "Replace batch ETL with streaming ingestion and adaptive views inside existing warehouse." },
      connected: { action: "Data warehouse streams change events to AI moon for real-time feature computation.", integrationWork: "Add CDC stream endpoint for AI feature store.", apiEmits: [{ name: "change_events", type: "object[]" }], apiReceives: [{ name: "computed_features", type: "object" }] },
      independent: { action: "New analytics lakehouse built from scratch with ML-native streaming architecture." },
    },
  },

  // etl-pipeline (43)
  {
    nodeId: 43, label: "etl-pipeline", stage: "transform", conversionOrder: 15,
    before: {
      summary: "Scheduled batch ETL jobs with hardcoded transformation rules",
      inputFields: [{ name: "source_tables", type: "string[]" }, { name: "transform_config", type: "object" }],
      outputFields: [{ name: "rows_processed", type: "number" }, { name: "errors", type: "string[]" }],
      logic: "Run transformation rules sequentially on each source table. Log errors and continue. No data quality checks.",
      pain: "Silent data quality degradation. Failed transforms discovered days later in downstream reports.",
    },
    after: {
      summary: "Self-healing ETL with anomaly detection and automatic quality gates",
      inputFields: [{ name: "source_tables", type: "string[]" }, { name: "transform_config", type: "object" }, { name: "quality_thresholds", type: "object", isNew: true }],
      outputFields: [{ name: "rows_processed", type: "number" }, { name: "errors", type: "string[]" }, { name: "quality_score", type: "number", isNew: true }],
      logic: "ML monitors data distributions during transformation. Anomalies trigger automatic rollback and alert. Quality gates block bad data from reaching warehouse.",
      gain: "Data quality issues caught in minutes not days. Zero silent data corruption incidents.",
    },
    patterns: {
      embedded: { action: "Replace batch transforms with self-healing pipeline inside existing ETL jobs." },
      connected: { action: "ETL pipeline sends data quality metrics to AI moon for anomaly analysis.", integrationWork: "Add quality metrics stream.", apiEmits: [{ name: "transform_metrics", type: "object" }], apiReceives: [{ name: "anomaly_alerts", type: "object" }] },
      independent: { action: "New data pipeline platform built from scratch with ML-native quality assurance." },
    },
  },

  // data-extract (42)
  {
    nodeId: 42, label: "data-extract", stage: "transform", conversionOrder: 16,
    before: {
      summary: "SQL-based data extraction with fixed query templates",
      inputFields: [{ name: "source_system", type: "string" }, { name: "query_template", type: "string" }],
      outputFields: [{ name: "extracted_data", type: "object[]" }, { name: "row_count", type: "number" }],
      logic: "Execute parameterized SQL queries against source systems on schedule. Extract full tables or incremental by timestamp.",
      pain: "Query templates are brittle. Source schema changes break extractions without warning.",
    },
    after: {
      summary: "Adaptive extraction with schema change detection and query optimization",
      inputFields: [{ name: "source_system", type: "string" }, { name: "query_template", type: "string" }, { name: "schema_version", type: "string", isNew: true }],
      outputFields: [{ name: "extracted_data", type: "object[]" }, { name: "row_count", type: "number" }, { name: "schema_drift_detected", type: "boolean", isNew: true }],
      logic: "ML monitors source schemas for drift. Auto-adapts queries when compatible changes detected. Alerts on breaking changes.",
      gain: "Zero extraction failures from schema drift. Query optimization reduces source system load 30%.",
    },
    patterns: {
      embedded: { action: "Replace fixed SQL templates with adaptive extraction inside existing data extract service." },
      connected: { action: "Data extract sends schema metadata to AI moon for drift detection.", integrationWork: "Add schema monitoring endpoint.", apiEmits: [{ name: "schema_snapshot", type: "object" }], apiReceives: [{ name: "drift_analysis", type: "object" }] },
      independent: { action: "New data integration platform built from scratch with ML-native schema management." },
    },
  },

  // search-index (40)
  {
    nodeId: 40, label: "search-index", stage: "transform", conversionOrder: 17,
    before: {
      summary: "Keyword-based full-text search index with manual relevance tuning",
      inputFields: [{ name: "query", type: "string" }, { name: "filters", type: "object" }],
      outputFields: [{ name: "results", type: "object[]" }, { name: "total_hits", type: "number" }],
      logic: "TF-IDF scoring with manually boosted fields. Exact match preferred over fuzzy.",
      pain: "Poor recall for semantic queries. Users must know exact terminology to find relevant records.",
    },
    after: {
      summary: "Semantic search with vector embeddings and hybrid retrieval",
      inputFields: [{ name: "query", type: "string" }, { name: "filters", type: "object" }, { name: "search_intent", type: "string", isNew: true }],
      outputFields: [{ name: "results", type: "object[]" }, { name: "total_hits", type: "number" }, { name: "semantic_relevance", type: "number[]", isNew: true }],
      logic: "Hybrid retrieval combining keyword BM25 with vector similarity. Re-ranker model scores semantic relevance.",
      gain: "Search relevance improved 50%. Users find records using natural language instead of exact terms.",
    },
    patterns: {
      embedded: { action: "Replace keyword index with hybrid vector+keyword search inside existing search service." },
      connected: { action: "Search service sends queries to AI moon for semantic expansion and re-ranking.", integrationWork: "Add /api/v2/semantic-search endpoint.", apiEmits: [{ name: "search_query", type: "object" }], apiReceives: [{ name: "reranked_results", type: "object" }] },
      independent: { action: "New search platform built from scratch with ML-native semantic retrieval." },
    },
  },

  // analytics-agg (41)
  {
    nodeId: 41, label: "analytics-agg", stage: "transform", conversionOrder: 18,
    before: {
      summary: "Scheduled batch aggregation of metrics into pre-defined rollup tables",
      inputFields: [{ name: "metric_type", type: "string" }, { name: "time_window", type: "string" }],
      outputFields: [{ name: "aggregated_value", type: "number" }, { name: "dimension_breakdown", type: "object" }],
      logic: "Run GROUP BY queries on raw data at scheduled intervals. Store results in rollup tables for dashboards.",
      pain: "New dimensions require schema changes and reprocessing. Real-time views impossible.",
    },
    after: {
      summary: "Streaming aggregation with auto-discovered dimensions and anomaly flagging",
      inputFields: [{ name: "metric_type", type: "string" }, { name: "time_window", type: "string" }, { name: "auto_dimensions", type: "boolean", isNew: true }],
      outputFields: [{ name: "aggregated_value", type: "number" }, { name: "dimension_breakdown", type: "object" }, { name: "anomaly_flag", type: "boolean", isNew: true }],
      logic: "Streaming aggregation discovers interesting dimension combinations automatically. Flags statistical anomalies in real time.",
      gain: "Real-time metrics. Auto-discovered insights that analysts would have missed.",
    },
    patterns: {
      embedded: { action: "Replace batch aggregation with streaming analytics inside existing service." },
      connected: { action: "Analytics sends metric streams to AI moon for anomaly detection and insight discovery.", integrationWork: "Add metrics stream endpoint.", apiEmits: [{ name: "metric_stream", type: "object" }], apiReceives: [{ name: "anomaly_insights", type: "object" }] },
      independent: { action: "New analytics platform built from scratch with ML-native streaming aggregation." },
    },
  },

  // bi-connector (45)
  {
    nodeId: 45, label: "bi-connector", stage: "transform", conversionOrder: 19,
    before: {
      summary: "JDBC/ODBC connector exposing warehouse tables to BI tools",
      inputFields: [{ name: "connection_string", type: "string" }, { name: "query", type: "string" }],
      outputFields: [{ name: "result_set", type: "object[]" }, { name: "metadata", type: "object" }],
      logic: "Pass-through SQL proxy between BI tools and data warehouse. No optimization or caching.",
      pain: "Heavy BI queries compete with production workloads. No query optimization for BI access patterns.",
    },
    after: {
      summary: "Intelligent BI connector with query optimization and predictive caching",
      inputFields: [{ name: "connection_string", type: "string" }, { name: "query", type: "string" }, { name: "user_context", type: "object", isNew: true }],
      outputFields: [{ name: "result_set", type: "object[]" }, { name: "metadata", type: "object" }, { name: "cache_hit", type: "boolean", isNew: true }],
      logic: "ML predicts common query patterns per user. Pre-computes and caches results. Rewrites inefficient queries.",
      gain: "BI dashboard load time reduced 70%. Warehouse query load reduced 50% through smart caching.",
    },
    patterns: {
      embedded: { action: "Replace pass-through connector with intelligent caching connector inside existing service." },
      connected: { action: "BI connector routes AI-enhanced queries through moon for enriched analytics.", integrationWork: "Add predictive query endpoint.", apiEmits: [{ name: "query_pattern", type: "object" }], apiReceives: [{ name: "optimized_query", type: "object" }] },
      independent: { action: "New BI serving layer built from scratch with ML-native query optimization." },
    },
  },

  // audit-logger (23)
  {
    nodeId: 23, label: "audit-logger", stage: "transform", conversionOrder: 20,
    before: {
      summary: "Append-only structured logging of all system actions to audit table",
      inputFields: [{ name: "action", type: "string" }, { name: "actor", type: "string" }, { name: "resource", type: "string" }],
      outputFields: [{ name: "log_id", type: "string" }, { name: "timestamp", type: "string" }],
      logic: "Write structured log entry for every system action. No analysis, no alerting, just storage.",
      pain: "Audit logs are write-only. Finding patterns requires manual SQL analysis across millions of records.",
    },
    after: {
      summary: "Intelligent audit logging with real-time pattern detection and compliance tagging",
      inputFields: [{ name: "action", type: "string" }, { name: "actor", type: "string" }, { name: "resource", type: "string" }, { name: "action_context", type: "object", isNew: true }],
      outputFields: [{ name: "log_id", type: "string" }, { name: "timestamp", type: "string" }, { name: "compliance_tags", type: "string[]", isNew: true }],
      logic: "ML auto-tags log entries with applicable compliance categories. Detects unusual access patterns in real time.",
      gain: "Compliance queries answered in seconds not hours. Suspicious access patterns detected immediately.",
    },
    patterns: {
      embedded: { action: "Replace append-only logger with intelligent audit system inside existing service." },
      connected: { action: "Audit logger streams events to AI moon for pattern analysis.", integrationWork: "Add audit event stream.", apiEmits: [{ name: "audit_event", type: "object" }], apiReceives: [{ name: "pattern_alert", type: "object" }] },
      independent: { action: "New audit platform built from scratch with ML-native compliance monitoring." },
    },
  },

  // audit-trail (38)
  {
    nodeId: 38, label: "audit-trail", stage: "transform", conversionOrder: 21,
    before: {
      summary: "Immutable append-only record of all data changes with before/after snapshots",
      inputFields: [{ name: "record_id", type: "string" }, { name: "change_type", type: "string" }, { name: "before_state", type: "object" }, { name: "after_state", type: "object" }],
      outputFields: [{ name: "trail_id", type: "string" }, { name: "change_hash", type: "string" }],
      logic: "Capture before/after state for every data mutation. Hash chain ensures immutability.",
      pain: "Trail grows endlessly. No way to query for meaningful change patterns or summarize change history.",
    },
    after: {
      summary: "Smart audit trail with change summarization and lineage tracking",
      inputFields: [{ name: "record_id", type: "string" }, { name: "change_type", type: "string" }, { name: "before_state", type: "object" }, { name: "after_state", type: "object" }],
      outputFields: [{ name: "trail_id", type: "string" }, { name: "change_hash", type: "string" }, { name: "change_summary", type: "string", isNew: true }, { name: "lineage_graph", type: "object", isNew: true }],
      logic: "ML generates natural-language change summaries. Builds data lineage graph showing how records evolved.",
      gain: "Auditors can understand change history at a glance. Full data lineage for regulatory compliance.",
    },
    patterns: {
      embedded: { action: "Add ML summarization and lineage tracking to existing audit trail service." },
      connected: { action: "Audit trail sends change events to AI moon for summarization.", integrationWork: "Add change event stream.", apiEmits: [{ name: "change_event", type: "object" }], apiReceives: [{ name: "change_summary", type: "object" }] },
      independent: { action: "New data lineage platform built from scratch with ML-native change tracking." },
    },
  },

  // ocr-engine (14)
  {
    nodeId: 14, label: "ocr-engine", stage: "transform", conversionOrder: 22,
    before: {
      summary: "Template-based OCR extracting text from known document layouts",
      inputFields: [{ name: "document_image", type: "binary" }, { name: "template_id", type: "string" }],
      outputFields: [{ name: "extracted_text", type: "string" }, { name: "field_values", type: "object" }],
      logic: "Match document against layout template. Extract text from predefined zones. OCR each zone separately.",
      pain: "New document layouts require manual template creation. Handwritten or skewed documents fail silently.",
    },
    after: {
      summary: "Vision-model OCR with layout-agnostic extraction and handwriting support",
      inputFields: [{ name: "document_image", type: "binary" }, { name: "template_id", type: "string" }],
      outputFields: [{ name: "extracted_text", type: "string" }, { name: "field_values", type: "object" }, { name: "extraction_confidence", type: "number", isNew: true }, { name: "layout_detected", type: "string", isNew: true }],
      logic: "Vision model detects document layout automatically. Extracts structured fields regardless of formatting. Handles handwriting.",
      gain: "Supports any document layout without templates. Handwritten document accuracy from 40% to 95%.",
    },
    patterns: {
      embedded: { action: "Replace template OCR with vision-model extraction inside existing OCR service." },
      connected: { action: "OCR service sends document images to AI moon for advanced extraction.", integrationWork: "Add /api/v2/extract-document endpoint.", apiEmits: [{ name: "document_image", type: "binary" }], apiReceives: [{ name: "structured_extraction", type: "object" }] },
      independent: { action: "New document intelligence platform built from scratch with vision-model OCR." },
    },
  },

  // pdf-parser (15)
  {
    nodeId: 15, label: "pdf-parser", stage: "transform", conversionOrder: 23,
    before: {
      summary: "Rule-based PDF parsing extracting tables and text from structured PDFs",
      inputFields: [{ name: "pdf_document", type: "binary" }, { name: "parser_config", type: "object" }],
      outputFields: [{ name: "pages", type: "object[]" }, { name: "tables", type: "object[]" }],
      logic: "Detect text blocks and tables by position rules. Extract content page by page.",
      pain: "Complex layouts with multi-column text or nested tables extract incorrectly. Scanned PDFs unsupported.",
    },
    after: {
      summary: "ML-powered PDF understanding with semantic structure detection",
      inputFields: [{ name: "pdf_document", type: "binary" }, { name: "parser_config", type: "object" }],
      outputFields: [{ name: "pages", type: "object[]" }, { name: "tables", type: "object[]" }, { name: "document_structure", type: "object", isNew: true }, { name: "key_value_pairs", type: "object", isNew: true }],
      logic: "Vision model understands document structure semantically. Extracts key-value pairs, tables, and hierarchies from any PDF.",
      gain: "Complex PDF accuracy from 60% to 95%. Handles scanned, multi-column, and nested layouts.",
    },
    patterns: {
      embedded: { action: "Replace rule-based parser with ML document understanding inside existing service." },
      connected: { action: "PDF parser sends documents to AI moon for semantic extraction.", integrationWork: "Add /api/v2/parse-semantic endpoint.", apiEmits: [{ name: "pdf_content", type: "binary" }], apiReceives: [{ name: "semantic_structure", type: "object" }] },
      independent: { action: "New document understanding platform built from scratch with ML-native parsing." },
    },
  },

  // doc-classifier (13)
  {
    nodeId: 13, label: "doc-classifier", stage: "transform", conversionOrder: 24,
    before: {
      summary: "Keyword-matching document classification into predefined categories",
      inputFields: [{ name: "document_text", type: "string" }, { name: "filename", type: "string" }],
      outputFields: [{ name: "category", type: "string" }, { name: "sub_category", type: "string" }],
      logic: "Match keywords and filename patterns against category rules. Default to 'Other' if no match.",
      pain: "30% of documents classified as 'Other'. New document types require manual rule creation.",
    },
    after: {
      summary: "ML document classification with multi-label support and confidence scoring",
      inputFields: [{ name: "document_text", type: "string" }, { name: "filename", type: "string" }, { name: "document_metadata", type: "object", isNew: true }],
      outputFields: [{ name: "category", type: "string" }, { name: "sub_category", type: "string" }, { name: "confidence", type: "number", isNew: true }, { name: "secondary_categories", type: "string[]", isNew: true }],
      logic: "Fine-tuned classifier model with multi-label output. New document types learned from human corrections.",
      gain: "'Other' category reduced from 30% to 3%. Classifier improves continuously from corrections.",
    },
    patterns: {
      embedded: { action: "Replace keyword matching with ML classifier inside existing document classification service." },
      connected: { action: "Doc classifier sends document content to AI moon for classification.", integrationWork: "Add /api/v2/classify-document endpoint.", apiEmits: [{ name: "document_content", type: "object" }], apiReceives: [{ name: "classification_result", type: "object" }] },
      independent: { action: "New document intelligence platform built from scratch with ML-native classification." },
    },
  },

  // data-enrichment (16)
  {
    nodeId: 16, label: "data-enrichment", stage: "transform", conversionOrder: 25,
    before: {
      summary: "Rule-based data enrichment appending third-party data via API lookups",
      inputFields: [{ name: "record", type: "object" }, { name: "enrichment_rules", type: "object" }],
      outputFields: [{ name: "enriched_record", type: "object" }, { name: "sources_consulted", type: "string[]" }],
      logic: "For each record, call configured third-party APIs to append additional data fields.",
      pain: "Fixed enrichment rules don't adapt to data context. Expensive API calls for low-value enrichments.",
    },
    after: {
      summary: "Intelligent enrichment that selects data sources based on record context and value prediction",
      inputFields: [{ name: "record", type: "object" }, { name: "enrichment_rules", type: "object" }, { name: "enrichment_budget", type: "number", isNew: true }],
      outputFields: [{ name: "enriched_record", type: "object" }, { name: "sources_consulted", type: "string[]" }, { name: "enrichment_value_score", type: "number", isNew: true }],
      logic: "ML model predicts which enrichments add the most value per record. Allocates API budget to highest-ROI lookups.",
      gain: "Enrichment API costs reduced 40% while data quality improved. High-value records get deeper enrichment.",
    },
    patterns: {
      embedded: { action: "Replace fixed enrichment rules with ML-driven source selection inside existing service." },
      connected: { action: "Data enrichment sends records to AI moon for intelligent source selection.", integrationWork: "Add /api/v2/enrich-smart endpoint.", apiEmits: [{ name: "record_context", type: "object" }], apiReceives: [{ name: "enrichment_plan", type: "object" }] },
      independent: { action: "New data enrichment platform built from scratch with ML-native source optimization." },
    },
  },

  // ══════════════════════════════════════════════
  // Stage 3: DECISION (15 nodes)
  // ══════════════════════════════════════════════

  // compliance-rule (24)
  {
    nodeId: 24, label: "compliance-rule", stage: "decide", conversionOrder: 26,
    before: {
      summary: "Static compliance rule engine evaluating transactions against hardcoded regulations",
      inputFields: [{ name: "transaction", type: "object" }, { name: "rule_set", type: "string" }],
      outputFields: [{ name: "compliant", type: "boolean" }, { name: "violations", type: "string[]" }],
      logic: "Evaluate each transaction against static rule conditions. Flag violations for manual review.",
      pain: "Rules lag regulatory changes by months. False positives overwhelm compliance teams.",
    },
    after: {
      summary: "Adaptive compliance engine with regulation-aware rule generation",
      inputFields: [{ name: "transaction", type: "object" }, { name: "rule_set", type: "string" }, { name: "regulatory_context", type: "object", isNew: true }],
      outputFields: [{ name: "compliant", type: "boolean" }, { name: "violations", type: "string[]" }, { name: "confidence", type: "number", isNew: true }, { name: "regulatory_citation", type: "string", isNew: true }],
      logic: "NLP model monitors regulatory updates and auto-generates draft rules. ML reduces false positives by learning from review outcomes.",
      gain: "Regulatory update response time from months to days. False positives reduced 65%.",
    },
    patterns: {
      embedded: { action: "Replace static rule engine with adaptive compliance system inside existing service." },
      connected: { action: "Compliance engine sends transactions to AI moon for enhanced evaluation.", integrationWork: "Add /api/v2/evaluate-compliance endpoint.", apiEmits: [{ name: "transaction_bundle", type: "object" }], apiReceives: [{ name: "compliance_result", type: "object" }] },
      independent: { action: "New compliance platform built from scratch with ML-native regulatory tracking." },
    },
  },

  // reg-matcher (25)
  {
    nodeId: 25, label: "reg-matcher", stage: "decide", conversionOrder: 27,
    before: {
      summary: "Lookup table matching transactions to applicable regulatory frameworks",
      inputFields: [{ name: "transaction_type", type: "string" }, { name: "jurisdiction", type: "string" }],
      outputFields: [{ name: "applicable_regulations", type: "string[]" }, { name: "reporting_requirements", type: "string[]" }],
      logic: "Cross-reference transaction type and jurisdiction in regulation mapping table.",
      pain: "Mapping table is manually maintained. New products or jurisdictions take weeks to add.",
    },
    after: {
      summary: "ML-powered regulatory matching with cross-jurisdiction analysis",
      inputFields: [{ name: "transaction_type", type: "string" }, { name: "jurisdiction", type: "string" }, { name: "transaction_details", type: "object", isNew: true }],
      outputFields: [{ name: "applicable_regulations", type: "string[]" }, { name: "reporting_requirements", type: "string[]" }, { name: "match_confidence", type: "number", isNew: true }],
      logic: "NLP model matches transaction characteristics to regulatory texts. Auto-identifies new regulations from regulatory feeds.",
      gain: "New jurisdiction coverage in hours not weeks. Catches regulatory applicability that human maintainers miss.",
    },
    patterns: {
      embedded: { action: "Replace lookup table with NLP regulatory matching inside existing service." },
      connected: { action: "Reg matcher sends transaction context to AI moon for regulatory analysis.", integrationWork: "Add /api/v2/match-regulations endpoint.", apiEmits: [{ name: "transaction_context", type: "object" }], apiReceives: [{ name: "regulatory_match", type: "object" }] },
      independent: { action: "New regulatory intelligence platform built from scratch with NLP-native matching." },
    },
  },

  // policy-engine (26)
  {
    nodeId: 26, label: "policy-engine", stage: "decide", conversionOrder: 28,
    before: {
      summary: "Rule-based policy engine enforcing organizational constraints via if/else trees",
      inputFields: [{ name: "request", type: "object" }, { name: "policy_domain", type: "string" }],
      outputFields: [{ name: "allowed", type: "boolean" }, { name: "policy_violations", type: "string[]" }],
      logic: "Evaluate request against nested if/else policy trees. Return all violated policies.",
      pain: "Policy trees have thousands of branches. Conflicting policies produce inconsistent decisions.",
    },
    after: {
      summary: "Conflict-aware policy engine with natural-language policy authoring",
      inputFields: [{ name: "request", type: "object" }, { name: "policy_domain", type: "string" }, { name: "policy_context", type: "object", isNew: true }],
      outputFields: [{ name: "allowed", type: "boolean" }, { name: "policy_violations", type: "string[]" }, { name: "conflict_warnings", type: "string[]", isNew: true }],
      logic: "ML detects conflicting policies before enforcement. Business users author policies in natural language, model translates to rules.",
      gain: "Policy conflicts detected before deployment. Business teams author policies without engineering support.",
    },
    patterns: {
      embedded: { action: "Replace if/else trees with conflict-aware policy engine inside existing service." },
      connected: { action: "Policy engine sends requests to AI moon for conflict detection and NL policy evaluation.", integrationWork: "Add /api/v2/evaluate-policy endpoint.", apiEmits: [{ name: "policy_request", type: "object" }], apiReceives: [{ name: "policy_evaluation", type: "object" }] },
      independent: { action: "New policy management platform built from scratch with NLP-native policy authoring." },
    },
  },

  // compliance-chk (33)
  {
    nodeId: 33, label: "compliance-chk", stage: "decide", conversionOrder: 29,
    before: {
      summary: "Checkpoint-based compliance verification at key workflow stages",
      inputFields: [{ name: "workflow_state", type: "object" }, { name: "checkpoint_id", type: "string" }],
      outputFields: [{ name: "passed", type: "boolean" }, { name: "blocking_issues", type: "string[]" }],
      logic: "At each checkpoint, verify all required conditions are met before allowing workflow to proceed.",
      pain: "Checks are binary pass/fail. No risk-based prioritization of blocking issues.",
    },
    after: {
      summary: "Risk-weighted compliance verification with adaptive checkpoint requirements",
      inputFields: [{ name: "workflow_state", type: "object" }, { name: "checkpoint_id", type: "string" }, { name: "risk_profile", type: "object", isNew: true }],
      outputFields: [{ name: "passed", type: "boolean" }, { name: "blocking_issues", type: "string[]" }, { name: "risk_adjusted_score", type: "number", isNew: true }],
      logic: "ML weights compliance checks by risk level. Low-risk workflows get streamlined checks; high-risk get enhanced scrutiny.",
      gain: "Low-risk workflows complete 50% faster. High-risk workflows get deeper compliance coverage.",
    },
    patterns: {
      embedded: { action: "Replace binary checkpoints with risk-weighted verification inside existing service." },
      connected: { action: "Compliance check sends workflow state to AI moon for risk-adjusted evaluation.", integrationWork: "Add /api/v2/check-compliance endpoint.", apiEmits: [{ name: "workflow_context", type: "object" }], apiReceives: [{ name: "risk_evaluation", type: "object" }] },
      independent: { action: "New compliance orchestration platform built from scratch with risk-native checks." },
    },
  },

  // sanctions-chk (36)
  {
    nodeId: 36, label: "sanctions-chk", stage: "decide", conversionOrder: 30,
    before: {
      summary: "Exact and fuzzy name matching against sanctions and embargo lists",
      inputFields: [{ name: "entity_name", type: "string" }, { name: "country", type: "string" }],
      outputFields: [{ name: "match_found", type: "boolean" }, { name: "matched_entries", type: "object[]" }],
      logic: "Run Levenshtein distance matching against OFAC, EU, UN sanctions lists. Flag matches above threshold.",
      pain: "High false-positive rate from common name matches. Transliteration variations cause false negatives.",
    },
    after: {
      summary: "Entity-resolution-based sanctions screening with contextual disambiguation",
      inputFields: [{ name: "entity_name", type: "string" }, { name: "country", type: "string" }, { name: "entity_context", type: "object", isNew: true }],
      outputFields: [{ name: "match_found", type: "boolean" }, { name: "matched_entries", type: "object[]" }, { name: "disambiguation_score", type: "number", isNew: true }],
      logic: "Entity resolution model uses name, context, and relationship data to disambiguate matches. Handles transliterations and aliases.",
      gain: "False positives reduced 70%. Catches alias-based evasion that fuzzy matching misses.",
    },
    patterns: {
      embedded: { action: "Replace fuzzy name matching with entity resolution inside existing sanctions service." },
      connected: { action: "Sanctions service sends entity data to AI moon for enhanced screening.", integrationWork: "Add /api/v2/screen-entity endpoint.", apiEmits: [{ name: "entity_bundle", type: "object" }], apiReceives: [{ name: "screening_result", type: "object" }] },
      independent: { action: "New sanctions screening platform built from scratch with ML-native entity resolution." },
    },
  },

  // aml-screen (35)
  {
    nodeId: 35, label: "aml-screen", stage: "decide", conversionOrder: 31,
    before: {
      summary: "Rule-based AML screening with threshold-triggered alerts",
      inputFields: [{ name: "transaction", type: "object" }, { name: "customer_id", type: "string" }],
      outputFields: [{ name: "alert_triggered", type: "boolean" }, { name: "alert_type", type: "string" }],
      logic: "Flag transactions exceeding dollar thresholds or matching predefined patterns (structuring, layering).",
      pain: "95% of alerts are false positives. Sophisticated laundering patterns bypass simple thresholds.",
    },
    after: {
      summary: "Network-analysis AML screening with behavioral pattern detection",
      inputFields: [{ name: "transaction", type: "object" }, { name: "customer_id", type: "string" }, { name: "network_context", type: "object", isNew: true }],
      outputFields: [{ name: "alert_triggered", type: "boolean" }, { name: "alert_type", type: "string" }, { name: "network_risk_score", type: "number", isNew: true }],
      logic: "Graph-based model analyzes transaction networks for laundering patterns. Behavioral model detects anomalous customer activity.",
      gain: "False positive rate reduced from 95% to 30%. Catches network-based laundering schemes.",
    },
    patterns: {
      embedded: { action: "Replace threshold rules with network-analysis AML inside existing screening service." },
      connected: { action: "AML service sends transaction networks to AI moon for graph analysis.", integrationWork: "Add /api/v2/analyze-network endpoint.", apiEmits: [{ name: "transaction_network", type: "object" }], apiReceives: [{ name: "network_analysis", type: "object" }] },
      independent: { action: "New AML platform built from scratch with graph-native network analysis." },
    },
  },

  // fraud-detect (34)
  {
    nodeId: 34, label: "fraud-detect", stage: "decide", conversionOrder: 32,
    before: {
      summary: "Rule-based fraud detection with static pattern matching",
      inputFields: [{ name: "transaction", type: "object" }, { name: "device_info", type: "object" }],
      outputFields: [{ name: "fraud_score", type: "number" }, { name: "fraud_indicators", type: "string[]" }],
      logic: "Match transaction attributes against known fraud patterns. Score based on number of matching rules.",
      pain: "New fraud patterns take weeks to codify. Adaptive fraudsters learn to avoid known rules.",
    },
    after: {
      summary: "Real-time ML fraud detection with adaptive pattern learning",
      inputFields: [{ name: "transaction", type: "object" }, { name: "device_info", type: "object" }, { name: "behavioral_profile", type: "object", isNew: true }],
      outputFields: [{ name: "fraud_score", type: "number" }, { name: "fraud_indicators", type: "string[]" }, { name: "model_version", type: "string", isNew: true }],
      logic: "Ensemble ML model scores transactions in real time. Updates daily from confirmed fraud cases. Behavioral profiling detects account takeover.",
      gain: "Fraud detection rate up 40%. New fraud patterns caught within hours not weeks.",
    },
    patterns: {
      embedded: { action: "Replace rule-based detection with ML ensemble inside existing fraud service." },
      connected: { action: "Fraud service sends transaction context to AI moon for ML scoring.", integrationWork: "Add /api/v2/score-fraud endpoint.", apiEmits: [{ name: "transaction_context", type: "object" }], apiReceives: [{ name: "fraud_score_result", type: "object" }] },
      independent: { action: "New fraud detection platform built from scratch with ML-native pattern learning." },
    },
  },

  // workflow-engine (18)
  {
    nodeId: 18, label: "workflow-engine", stage: "decide", conversionOrder: 33,
    before: {
      summary: "BPMN-based workflow engine executing fixed process definitions",
      inputFields: [{ name: "process_id", type: "string" }, { name: "trigger_event", type: "object" }],
      outputFields: [{ name: "workflow_state", type: "string" }, { name: "next_tasks", type: "string[]" }],
      logic: "Execute BPMN process definition step by step. Human tasks route to assigned roles. No runtime optimization.",
      pain: "Process changes require developer involvement. No way to optimize based on actual execution data.",
    },
    after: {
      summary: "Adaptive workflow engine with process mining and optimization",
      inputFields: [{ name: "process_id", type: "string" }, { name: "trigger_event", type: "object" }, { name: "execution_history", type: "object", isNew: true }],
      outputFields: [{ name: "workflow_state", type: "string" }, { name: "next_tasks", type: "string[]" }, { name: "optimization_suggestion", type: "string", isNew: true }],
      logic: "Process mining model analyzes execution history. Suggests step reordering, parallel execution, and bottleneck elimination.",
      gain: "Average process completion time reduced 30%. Bottlenecks identified automatically.",
    },
    patterns: {
      embedded: { action: "Replace static BPMN execution with adaptive workflow engine inside existing service." },
      connected: { action: "Workflow engine sends execution data to AI moon for process mining.", integrationWork: "Add /api/v2/optimize-workflow endpoint.", apiEmits: [{ name: "execution_data", type: "object" }], apiReceives: [{ name: "optimization_plan", type: "object" }] },
      independent: { action: "New workflow platform built from scratch with ML-native process optimization." },
    },
  },

  // approval-gate (17)
  {
    nodeId: 17, label: "approval-gate", stage: "decide", conversionOrder: 34,
    before: {
      summary: "Role-based approval routing with fixed escalation paths",
      inputFields: [{ name: "request", type: "object" }, { name: "approval_type", type: "string" }],
      outputFields: [{ name: "approved", type: "boolean" }, { name: "approver", type: "string" }],
      logic: "Route to approver by role hierarchy. Escalate after timeout. All requests of same type get same treatment.",
      pain: "Low-risk requests wait in the same queue as high-risk ones. Approval bottlenecks slow everything.",
    },
    after: {
      summary: "Risk-based approval routing with auto-approval for low-risk requests",
      inputFields: [{ name: "request", type: "object" }, { name: "approval_type", type: "string" }, { name: "risk_assessment", type: "object", isNew: true }],
      outputFields: [{ name: "approved", type: "boolean" }, { name: "approver", type: "string" }, { name: "auto_approved", type: "boolean", isNew: true }],
      logic: "ML model scores request risk. Low-risk requests auto-approve. Medium-risk routes to available approver. High-risk escalates.",
      gain: "60% of approvals automated. Average approval time from 4 hours to 15 minutes.",
    },
    patterns: {
      embedded: { action: "Replace fixed routing with risk-based approval inside existing approval gate." },
      connected: { action: "Approval gate sends requests to AI moon for risk scoring before routing.", integrationWork: "Add /api/v2/assess-approval endpoint.", apiEmits: [{ name: "approval_request", type: "object" }], apiReceives: [{ name: "risk_assessment", type: "object" }] },
      independent: { action: "New approval platform built from scratch with ML-native risk-based routing." },
    },
  },

  // alert-engine (47)
  {
    nodeId: 47, label: "alert-engine", stage: "decide", conversionOrder: 35,
    before: {
      summary: "Threshold-based alerting with static rules and fixed recipient routing",
      inputFields: [{ name: "metric_name", type: "string" }, { name: "metric_value", type: "number" }],
      outputFields: [{ name: "alert_fired", type: "boolean" }, { name: "recipients", type: "string[]" }],
      logic: "Fire alert when metric crosses static threshold. Route to configured recipients.",
      pain: "Alert fatigue from noisy thresholds. Legitimate anomalies buried in false alarms.",
    },
    after: {
      summary: "Anomaly-based alerting with intelligent deduplication and root-cause correlation",
      inputFields: [{ name: "metric_name", type: "string" }, { name: "metric_value", type: "number" }, { name: "metric_context", type: "object", isNew: true }],
      outputFields: [{ name: "alert_fired", type: "boolean" }, { name: "recipients", type: "string[]" }, { name: "root_cause", type: "string", isNew: true }],
      logic: "ML model detects anomalies using dynamic baselines. Correlates related alerts into single incident with root-cause analysis.",
      gain: "Alert volume reduced 80%. Root cause identified automatically for correlated incidents.",
    },
    patterns: {
      embedded: { action: "Replace threshold alerts with anomaly detection inside existing alert engine." },
      connected: { action: "Alert engine sends metric streams to AI moon for anomaly detection.", integrationWork: "Add /api/v2/detect-anomaly endpoint.", apiEmits: [{ name: "metric_stream", type: "object" }], apiReceives: [{ name: "anomaly_detection", type: "object" }] },
      independent: { action: "New observability platform built from scratch with ML-native anomaly detection." },
    },
  },

  // credit-check (11)
  {
    nodeId: 11, label: "credit-check", stage: "decide", conversionOrder: 36,
    before: {
      summary: "Single-bureau credit pull with hardcoded scoring interpretation",
      inputFields: [{ name: "applicant_ssn", type: "string" }, { name: "applicant_name", type: "string" }],
      outputFields: [{ name: "credit_score", type: "number" }, { name: "credit_tier", type: "string" }],
      logic: "Pull credit report from primary bureau. Map score to tier using fixed brackets (750+=excellent, 700-749=good, etc.).",
      pain: "Single-bureau view misses important signals. Fixed brackets don't adapt to market conditions.",
    },
    after: {
      summary: "Multi-bureau credit analysis with alternative data and dynamic tier calibration",
      inputFields: [{ name: "applicant_ssn", type: "string" }, { name: "applicant_name", type: "string" }, { name: "alternative_data_consent", type: "boolean", isNew: true }],
      outputFields: [{ name: "credit_score", type: "number" }, { name: "credit_tier", type: "string" }, { name: "composite_score", type: "number", isNew: true }, { name: "credit_factors", type: "object", isNew: true }],
      logic: "Multi-bureau pull with ML-weighted composite. Incorporates alternative data (rent, utilities) with consent. Tiers calibrated quarterly.",
      gain: "15% more applicants qualify with alternative data. More accurate risk stratification.",
    },
    patterns: {
      embedded: { action: "Replace single-bureau pull with multi-source credit analysis inside existing service." },
      connected: { action: "Credit service sends applicant data to AI moon for composite scoring.", integrationWork: "Add /api/v2/composite-credit endpoint.", apiEmits: [{ name: "applicant_data", type: "object" }], apiReceives: [{ name: "composite_credit", type: "object" }] },
      independent: { action: "New credit assessment platform built from scratch with ML-native multi-source scoring." },
    },
  },

  // risk-scoring (10)
  {
    nodeId: 10, label: "risk-scoring", stage: "decide", conversionOrder: 37,
    before: {
      summary: "Rules-based risk score using hardcoded thresholds",
      inputFields: [{ name: "credit_score", type: "number" }, { name: "income", type: "number" }, { name: "debt_ratio", type: "number" }, { name: "employment_years", type: "number" }],
      outputFields: [{ name: "risk_tier", type: "enum(low|medium|high)" }, { name: "risk_score", type: "number" }],
      logic: "If credit_score > 720 AND debt_ratio < 0.36 AND employment_years > 2 then low. Else cascading if/else.",
      pain: "Static thresholds miss nuance. Manual updates lag market changes by months. No explanation for denials.",
    },
    after: {
      summary: "ML model scoring with explainable feature importance",
      inputFields: [{ name: "credit_score", type: "number" }, { name: "income", type: "number" }, { name: "debt_ratio", type: "number" }, { name: "employment_years", type: "number" }, { name: "behavioral_signals", type: "object", isNew: true }, { name: "market_context", type: "object", isNew: true }],
      outputFields: [{ name: "risk_tier", type: "enum(low|medium|high)" }, { name: "risk_score", type: "number" }, { name: "feature_importance", type: "object", isNew: true }, { name: "confidence", type: "number", isNew: true }, { name: "explanation", type: "string", isNew: true }],
      logic: "Gradient-boosted model trained on 5-year outcomes. Incorporates behavioral signals and market conditions. Outputs SHAP values.",
      gain: "20% better default prediction. Real-time model updates. Auditable explanations satisfy regulatory requirements.",
    },
    patterns: {
      embedded: { action: "Replace hardcoded scoring logic with ML model endpoint inside the existing risk service." },
      connected: { action: "Old risk service sends applicant data bundle to AI moon, receives enriched risk result with explanations.", integrationWork: "Add /api/v2/risk-assess endpoint; old service must serialize applicant context.", apiEmits: [{ name: "applicant_bundle", type: "object" }], apiReceives: [{ name: "ml_risk_result", type: "object" }] },
      independent: { action: "New risk platform built from scratch with ML-native scoring. Old system keeps its hardcoded rules." },
    },
  },

  // eligibility (27)
  {
    nodeId: 27, label: "eligibility", stage: "decide", conversionOrder: 38,
    before: {
      summary: "Decision tree determining product eligibility from applicant attributes",
      inputFields: [{ name: "applicant_profile", type: "object" }, { name: "product_id", type: "string" }],
      outputFields: [{ name: "eligible", type: "boolean" }, { name: "reason", type: "string" }],
      logic: "Walk decision tree: check income, credit, residency, product-specific requirements sequentially.",
      pain: "Hard binary decisions miss near-eligible applicants. No suggestion of alternative products.",
    },
    after: {
      summary: "Continuous eligibility scoring with product recommendation",
      inputFields: [{ name: "applicant_profile", type: "object" }, { name: "product_id", type: "string" }, { name: "product_catalog", type: "object", isNew: true }],
      outputFields: [{ name: "eligible", type: "boolean" }, { name: "reason", type: "string" }, { name: "eligibility_score", type: "number", isNew: true }, { name: "alternative_products", type: "string[]", isNew: true }],
      logic: "ML scores eligibility as a continuous value. Recommends alternative products for near-eligible applicants.",
      gain: "12% increase in successful product matches. Applicants find suitable products instead of getting rejected.",
    },
    patterns: {
      embedded: { action: "Replace decision tree with continuous scoring inside existing eligibility service." },
      connected: { action: "Eligibility service sends applicant profile to AI moon for scoring and product matching.", integrationWork: "Add /api/v2/score-eligibility endpoint.", apiEmits: [{ name: "applicant_profile", type: "object" }], apiReceives: [{ name: "eligibility_result", type: "object" }] },
      independent: { action: "New product matching platform built from scratch with ML-native eligibility scoring." },
    },
  },

  // pricing-calc (28)
  {
    nodeId: 28, label: "pricing-calc", stage: "decide", conversionOrder: 39,
    before: {
      summary: "Rate-sheet lookup calculating pricing from risk tier and product parameters",
      inputFields: [{ name: "risk_tier", type: "string" }, { name: "product_id", type: "string" }, { name: "loan_amount", type: "number" }],
      outputFields: [{ name: "interest_rate", type: "number" }, { name: "apr", type: "number" }],
      logic: "Look up base rate from rate sheet. Apply product-specific adjustments and margin.",
      pain: "Rate sheets updated monthly. No competitive pricing intelligence. Pricing doesn't optimize for business goals.",
    },
    after: {
      summary: "Dynamic pricing with market-aware optimization and competitive intelligence",
      inputFields: [{ name: "risk_tier", type: "string" }, { name: "product_id", type: "string" }, { name: "loan_amount", type: "number" }, { name: "market_rates", type: "object", isNew: true }],
      outputFields: [{ name: "interest_rate", type: "number" }, { name: "apr", type: "number" }, { name: "competitive_position", type: "string", isNew: true }],
      logic: "ML model optimizes pricing considering risk, market rates, competitive landscape, and business volume goals.",
      gain: "Revenue per loan increased 8% while maintaining competitive positioning.",
    },
    patterns: {
      embedded: { action: "Replace rate-sheet lookup with dynamic pricing inside existing calculator." },
      connected: { action: "Pricing service sends loan parameters to AI moon for optimized pricing.", integrationWork: "Add /api/v2/optimize-pricing endpoint.", apiEmits: [{ name: "pricing_context", type: "object" }], apiReceives: [{ name: "optimized_pricing", type: "object" }] },
      independent: { action: "New pricing platform built from scratch with ML-native market optimization." },
    },
  },

  // fee-schedule (29)
  {
    nodeId: 29, label: "fee-schedule", stage: "decide", conversionOrder: 40,
    before: {
      summary: "Static fee schedule applying fixed fees based on product and transaction type",
      inputFields: [{ name: "product_id", type: "string" }, { name: "transaction_type", type: "string" }],
      outputFields: [{ name: "fee_amount", type: "number" }, { name: "fee_description", type: "string" }],
      logic: "Lookup fee in product-specific fee table. Apply flat or percentage-based fee.",
      pain: "Fee tables are product-specific and inconsistent. No visibility into fee competitiveness.",
    },
    after: {
      summary: "Dynamic fee optimization with customer lifetime value consideration",
      inputFields: [{ name: "product_id", type: "string" }, { name: "transaction_type", type: "string" }, { name: "customer_value", type: "object", isNew: true }],
      outputFields: [{ name: "fee_amount", type: "number" }, { name: "fee_description", type: "string" }, { name: "waiver_eligible", type: "boolean", isNew: true }],
      logic: "ML model recommends fee adjustments based on customer value and competitive positioning. Auto-identifies waiver-eligible customers.",
      gain: "Customer retention improved 5% through intelligent fee management. Fee revenue maintained through better pricing.",
    },
    patterns: {
      embedded: { action: "Replace static fee table with dynamic fee optimization inside existing service." },
      connected: { action: "Fee service sends customer context to AI moon for fee optimization.", integrationWork: "Add /api/v2/optimize-fees endpoint.", apiEmits: [{ name: "fee_context", type: "object" }], apiReceives: [{ name: "fee_recommendation", type: "object" }] },
      independent: { action: "New fee management platform built from scratch with ML-native pricing optimization." },
    },
  },

  // ══════════════════════════════════════════════
  // Stage 4: ACTION (14 nodes)
  // ══════════════════════════════════════════════

  // dashboard-api (46)
  {
    nodeId: 46, label: "dashboard-api", stage: "act", conversionOrder: 41,
    before: {
      summary: "REST API serving pre-aggregated dashboard data from materialized views",
      inputFields: [{ name: "dashboard_id", type: "string" }, { name: "date_range", type: "object" }],
      outputFields: [{ name: "chart_data", type: "object[]" }, { name: "summary_metrics", type: "object" }],
      logic: "Query materialized views and return pre-computed chart data. No real-time capability.",
      pain: "Dashboards show yesterday's data. No predictive insights. Adding new charts requires backend changes.",
    },
    after: {
      summary: "Real-time dashboard API with predictive analytics and natural-language querying",
      inputFields: [{ name: "dashboard_id", type: "string" }, { name: "date_range", type: "object" }, { name: "natural_language_query", type: "string", isNew: true }],
      outputFields: [{ name: "chart_data", type: "object[]" }, { name: "summary_metrics", type: "object" }, { name: "predictions", type: "object", isNew: true }, { name: "insights", type: "string[]", isNew: true }],
      logic: "Real-time streaming aggregation. NL query interface generates custom charts. ML generates predictive trends and anomaly insights.",
      gain: "Real-time dashboards with predictive trends. Users create custom views via natural language.",
    },
    patterns: {
      embedded: { action: "Replace static dashboard API with real-time predictive API inside existing service." },
      connected: { action: "Dashboard API sends query context to AI moon for predictions and NL interpretation.", integrationWork: "Add /api/v2/dashboard-predict endpoint.", apiEmits: [{ name: "dashboard_context", type: "object" }], apiReceives: [{ name: "predictive_data", type: "object" }] },
      independent: { action: "New analytics dashboard platform built from scratch with ML-native predictive visualization." },
    },
  },

  // report-gen (37)
  {
    nodeId: 37, label: "report-gen", stage: "act", conversionOrder: 42,
    before: {
      summary: "Template-based report generation filling data into fixed layouts",
      inputFields: [{ name: "report_type", type: "string" }, { name: "parameters", type: "object" }],
      outputFields: [{ name: "report_document", type: "binary" }, { name: "page_count", type: "number" }],
      logic: "Select report template. Query data sources. Merge data into template placeholders. Render to PDF.",
      pain: "New report types take weeks to develop. Reports are static snapshots with no narrative explanation.",
    },
    after: {
      summary: "AI-generated reports with narrative insights and dynamic layout",
      inputFields: [{ name: "report_type", type: "string" }, { name: "parameters", type: "object" }, { name: "audience", type: "string", isNew: true }],
      outputFields: [{ name: "report_document", type: "binary" }, { name: "page_count", type: "number" }, { name: "executive_summary", type: "string", isNew: true }],
      logic: "LLM generates narrative insights from data. Dynamic layout adapts to content. Audience-appropriate language and detail level.",
      gain: "Report generation time from weeks to minutes. Executive summaries save readers 80% of review time.",
    },
    patterns: {
      embedded: { action: "Replace template-merge with AI report generation inside existing service." },
      connected: { action: "Report service sends data context to AI moon for narrative generation.", integrationWork: "Add /api/v2/generate-narrative endpoint.", apiEmits: [{ name: "report_data", type: "object" }], apiReceives: [{ name: "narrative_content", type: "object" }] },
      independent: { action: "New reporting platform built from scratch with LLM-native narrative generation." },
    },
  },

  // template-mgr (51)
  {
    nodeId: 51, label: "template-mgr", stage: "act", conversionOrder: 43,
    before: {
      summary: "Static template repository managing document and communication templates",
      inputFields: [{ name: "template_id", type: "string" }, { name: "version", type: "number" }],
      outputFields: [{ name: "template_content", type: "string" }, { name: "merge_fields", type: "string[]" }],
      logic: "Retrieve versioned template by ID. List required merge fields. No content adaptation.",
      pain: "Templates are one-size-fits-all. Maintaining jurisdiction-specific variants is manual and error-prone.",
    },
    after: {
      summary: "Dynamic template system with context-adaptive content blocks",
      inputFields: [{ name: "template_id", type: "string" }, { name: "version", type: "number" }, { name: "context", type: "object", isNew: true }],
      outputFields: [{ name: "template_content", type: "string" }, { name: "merge_fields", type: "string[]" }, { name: "adapted_sections", type: "string[]", isNew: true }],
      logic: "ML selects and adapts template sections based on context (jurisdiction, audience, product). Dynamic content blocks replace static variants.",
      gain: "Template variant count reduced 80%. Context-appropriate content generated automatically.",
    },
    patterns: {
      embedded: { action: "Replace static template repo with dynamic template system inside existing service." },
      connected: { action: "Template manager sends context to AI moon for content adaptation.", integrationWork: "Add /api/v2/adapt-template endpoint.", apiEmits: [{ name: "template_context", type: "object" }], apiReceives: [{ name: "adapted_template", type: "object" }] },
      independent: { action: "New content management platform built from scratch with ML-native template adaptation." },
    },
  },

  // payment-proc (30)
  {
    nodeId: 30, label: "payment-proc", stage: "act", conversionOrder: 44,
    before: {
      summary: "Fixed-routing payment processing through predetermined payment rails",
      inputFields: [{ name: "payment_amount", type: "number" }, { name: "payment_method", type: "string" }, { name: "recipient", type: "object" }],
      outputFields: [{ name: "transaction_id", type: "string" }, { name: "status", type: "string" }],
      logic: "Route payment through configured payment rail for the method type. Retry on failure with same rail.",
      pain: "No optimization of payment rails for cost or speed. Failed payments retry the same failing path.",
    },
    after: {
      summary: "Intelligent payment routing optimizing for cost, speed, and success rate",
      inputFields: [{ name: "payment_amount", type: "number" }, { name: "payment_method", type: "string" }, { name: "recipient", type: "object" }, { name: "urgency", type: "string", isNew: true }],
      outputFields: [{ name: "transaction_id", type: "string" }, { name: "status", type: "string" }, { name: "rail_selected", type: "string", isNew: true }, { name: "cost_savings", type: "number", isNew: true }],
      logic: "ML model selects optimal payment rail considering cost, speed, success probability, and recipient characteristics.",
      gain: "Payment processing costs reduced 15%. Failed payment recovery rate improved 30%.",
    },
    patterns: {
      embedded: { action: "Replace fixed routing with intelligent payment optimization inside existing service." },
      connected: { action: "Payment service sends transaction context to AI moon for optimal rail selection.", integrationWork: "Add /api/v2/optimize-payment endpoint.", apiEmits: [{ name: "payment_context", type: "object" }], apiReceives: [{ name: "routing_recommendation", type: "object" }] },
      independent: { action: "New payment platform built from scratch with ML-native rail optimization." },
    },
  },

  // escrow-mgr (31)
  {
    nodeId: 31, label: "escrow-mgr", stage: "act", conversionOrder: 45,
    before: {
      summary: "Manual escrow account management with fixed disbursement schedules",
      inputFields: [{ name: "escrow_id", type: "string" }, { name: "action", type: "string" }],
      outputFields: [{ name: "balance", type: "number" }, { name: "next_disbursement", type: "string" }],
      logic: "Track deposits and disbursements against fixed schedule. Manual intervention for exceptions.",
      pain: "Exceptions require manual processing. No prediction of shortfalls or surplus.",
    },
    after: {
      summary: "Predictive escrow management with automated exception handling",
      inputFields: [{ name: "escrow_id", type: "string" }, { name: "action", type: "string" }, { name: "payment_history", type: "object", isNew: true }],
      outputFields: [{ name: "balance", type: "number" }, { name: "next_disbursement", type: "string" }, { name: "shortfall_prediction", type: "object", isNew: true }],
      logic: "ML predicts escrow shortfalls/surplus based on payment patterns. Auto-adjusts contributions and handles exceptions.",
      gain: "Manual exception handling reduced 75%. Shortfalls predicted and prevented proactively.",
    },
    patterns: {
      embedded: { action: "Replace manual escrow management with predictive system inside existing service." },
      connected: { action: "Escrow service sends account data to AI moon for shortfall prediction.", integrationWork: "Add /api/v2/predict-escrow endpoint.", apiEmits: [{ name: "escrow_data", type: "object" }], apiReceives: [{ name: "escrow_prediction", type: "object" }] },
      independent: { action: "New escrow platform built from scratch with ML-native predictive management." },
    },
  },

  // fund-transfer (32)
  {
    nodeId: 32, label: "fund-transfer", stage: "act", conversionOrder: 46,
    before: {
      summary: "Batch-processed fund transfers executed on scheduled settlement windows",
      inputFields: [{ name: "from_account", type: "string" }, { name: "to_account", type: "string" }, { name: "amount", type: "number" }],
      outputFields: [{ name: "transfer_id", type: "string" }, { name: "settlement_date", type: "string" }],
      logic: "Queue transfers for next settlement window. Process in batch during off-hours.",
      pain: "Transfers take 1-3 business days. No real-time capability. Urgent transfers require manual override.",
    },
    after: {
      summary: "Intelligent fund transfer with real-time routing and predictive settlement",
      inputFields: [{ name: "from_account", type: "string" }, { name: "to_account", type: "string" }, { name: "amount", type: "number" }, { name: "urgency", type: "string", isNew: true }],
      outputFields: [{ name: "transfer_id", type: "string" }, { name: "settlement_date", type: "string" }, { name: "estimated_arrival", type: "string", isNew: true }],
      logic: "ML selects fastest available transfer rail. Predicts settlement timing. Urgent transfers route through real-time rails.",
      gain: "Average settlement time reduced from 2 days to same-day. Real-time transfers available for urgent needs.",
    },
    patterns: {
      embedded: { action: "Replace batch settlement with intelligent routing inside existing transfer service." },
      connected: { action: "Transfer service sends context to AI moon for optimal routing.", integrationWork: "Add /api/v2/optimize-transfer endpoint.", apiEmits: [{ name: "transfer_context", type: "object" }], apiReceives: [{ name: "routing_plan", type: "object" }] },
      independent: { action: "New transfer platform built from scratch with ML-native real-time settlement." },
    },
  },

  // disclosure-gen (50)
  {
    nodeId: 50, label: "disclosure-gen", stage: "act", conversionOrder: 47,
    before: {
      summary: "Template-merge disclosure generation using static Word templates",
      inputFields: [{ name: "applicant_data", type: "object" }, { name: "loan_terms", type: "object" }, { name: "template_id", type: "string" }],
      outputFields: [{ name: "pdf_document", type: "binary" }, { name: "disclosure_type", type: "string" }],
      logic: "Select template by ID, merge applicant data into placeholders, render to PDF.",
      pain: "Template updates take weeks through legal review. Disclosures are generic. Merge field errors cause compliance issues.",
    },
    after: {
      summary: "AI-assembled disclosures with regulatory-aware content selection",
      inputFields: [{ name: "applicant_data", type: "object" }, { name: "loan_terms", type: "object" }, { name: "template_id", type: "string" }, { name: "jurisdiction", type: "string", isNew: true }, { name: "applicant_profile", type: "object", isNew: true }],
      outputFields: [{ name: "pdf_document", type: "binary" }, { name: "disclosure_type", type: "string" }, { name: "plain_language_summary", type: "string", isNew: true }, { name: "readability_score", type: "number", isNew: true }, { name: "regulatory_citations", type: "string[]", isNew: true }],
      logic: "LLM selects and assembles disclosure sections based on jurisdiction and applicant profile. Generates plain-language summaries.",
      gain: "Jurisdiction-specific disclosures in minutes not weeks. Plain-language summaries improve customer comprehension.",
    },
    patterns: {
      embedded: { action: "Replace template-merge logic with AI-assembled disclosure pipeline inside existing document service." },
      connected: { action: "Old document service sends template context to AI moon, receives assembled disclosure with summaries.", integrationWork: "Add /api/v2/assemble-disclosure endpoint; old service must pass jurisdiction context.", apiEmits: [{ name: "disclosure_context", type: "object" }], apiReceives: [{ name: "assembled_disclosure", type: "object" }] },
      independent: { action: "New disclosure platform built from scratch with LLM-native document assembly." },
    },
  },

  // signing-svc (52)
  {
    nodeId: 52, label: "signing-svc", stage: "act", conversionOrder: 48,
    before: {
      summary: "Sequential e-signature workflow routing documents to signers in fixed order",
      inputFields: [{ name: "document_id", type: "string" }, { name: "signers", type: "object[]" }],
      outputFields: [{ name: "signing_status", type: "string" }, { name: "completion_date", type: "string" }],
      logic: "Route document to each signer in sequence. Wait for completion before sending to next. Reminder emails on schedule.",
      pain: "Sequential signing causes delays. No prediction of when documents will complete.",
    },
    after: {
      summary: "Intelligent signing orchestration with parallel routing and completion prediction",
      inputFields: [{ name: "document_id", type: "string" }, { name: "signers", type: "object[]" }, { name: "signer_behavior", type: "object", isNew: true }],
      outputFields: [{ name: "signing_status", type: "string" }, { name: "completion_date", type: "string" }, { name: "predicted_completion", type: "string", isNew: true }],
      logic: "ML identifies which signers can sign in parallel. Predicts completion time. Smart reminders timed to signer behavior patterns.",
      gain: "Average signing time reduced 45%. Completion predictions accurate within 4 hours.",
    },
    patterns: {
      embedded: { action: "Replace sequential routing with intelligent orchestration inside existing signing service." },
      connected: { action: "Signing service sends signer data to AI moon for completion prediction and routing.", integrationWork: "Add /api/v2/optimize-signing endpoint.", apiEmits: [{ name: "signing_context", type: "object" }], apiReceives: [{ name: "signing_plan", type: "object" }] },
      independent: { action: "New signing platform built from scratch with ML-native orchestration." },
    },
  },

  // doc-review (22)
  {
    nodeId: 22, label: "doc-review", stage: "act", conversionOrder: 49,
    before: {
      summary: "Manual document review queue with round-robin assignment to reviewers",
      inputFields: [{ name: "document_id", type: "string" }, { name: "review_type", type: "string" }],
      outputFields: [{ name: "review_status", type: "string" }, { name: "reviewer", type: "string" }],
      logic: "Assign documents to next available reviewer in rotation. All documents get same treatment.",
      pain: "Expert reviewers get simple documents. Complex documents get assigned to junior staff. No pre-screening.",
    },
    after: {
      summary: "AI-assisted document review with complexity-based assignment and pre-screening",
      inputFields: [{ name: "document_id", type: "string" }, { name: "review_type", type: "string" }, { name: "document_complexity", type: "object", isNew: true }],
      outputFields: [{ name: "review_status", type: "string" }, { name: "reviewer", type: "string" }, { name: "ai_pre_review", type: "object", isNew: true }],
      logic: "ML scores document complexity. Routes to appropriately skilled reviewer. AI pre-screens and highlights key areas.",
      gain: "Review time reduced 40%. Expert reviewers focused on genuinely complex documents.",
    },
    patterns: {
      embedded: { action: "Replace round-robin assignment with intelligent routing inside existing review service." },
      connected: { action: "Review service sends documents to AI moon for pre-screening and complexity scoring.", integrationWork: "Add /api/v2/pre-review endpoint.", apiEmits: [{ name: "document_content", type: "object" }], apiReceives: [{ name: "pre_review_result", type: "object" }] },
      independent: { action: "New document review platform built from scratch with ML-native pre-screening." },
    },
  },

  // delivery-track (53)
  {
    nodeId: 53, label: "delivery-track", stage: "act", conversionOrder: 50,
    before: {
      summary: "Status-tracking for document delivery with manual confirmation",
      inputFields: [{ name: "document_id", type: "string" }, { name: "delivery_method", type: "string" }],
      outputFields: [{ name: "delivery_status", type: "string" }, { name: "confirmed", type: "boolean" }],
      logic: "Track delivery status via provider APIs. Flag unconfirmed deliveries after timeout for manual follow-up.",
      pain: "No prediction of delivery failures. Manual follow-up for unconfirmed deliveries.",
    },
    after: {
      summary: "Predictive delivery tracking with proactive failure prevention",
      inputFields: [{ name: "document_id", type: "string" }, { name: "delivery_method", type: "string" }, { name: "recipient_history", type: "object", isNew: true }],
      outputFields: [{ name: "delivery_status", type: "string" }, { name: "confirmed", type: "boolean" }, { name: "failure_risk", type: "number", isNew: true }],
      logic: "ML predicts delivery failure risk from recipient history and method characteristics. Proactively switches methods for high-risk deliveries.",
      gain: "Delivery failure rate reduced 60%. Proactive method switching prevents most failures.",
    },
    patterns: {
      embedded: { action: "Replace passive tracking with predictive delivery management inside existing service." },
      connected: { action: "Delivery tracker sends context to AI moon for failure prediction.", integrationWork: "Add /api/v2/predict-delivery endpoint.", apiEmits: [{ name: "delivery_context", type: "object" }], apiReceives: [{ name: "delivery_prediction", type: "object" }] },
      independent: { action: "New delivery platform built from scratch with ML-native predictive tracking." },
    },
  },

  // notification-svc (19)
  {
    nodeId: 19, label: "notification-svc", stage: "act", conversionOrder: 51,
    before: {
      summary: "Event-triggered notifications with static channel and timing rules",
      inputFields: [{ name: "event_type", type: "string" }, { name: "recipient_id", type: "string" }],
      outputFields: [{ name: "notification_id", type: "string" }, { name: "channel", type: "string" }],
      logic: "Map event type to notification template and channel. Send immediately. No personalization.",
      pain: "Notification fatigue from over-sending. No awareness of recipient preferences or optimal timing.",
    },
    after: {
      summary: "Personalized notification orchestration with optimal timing and channel selection",
      inputFields: [{ name: "event_type", type: "string" }, { name: "recipient_id", type: "string" }, { name: "recipient_preferences", type: "object", isNew: true }],
      outputFields: [{ name: "notification_id", type: "string" }, { name: "channel", type: "string" }, { name: "send_time", type: "string", isNew: true }],
      logic: "ML selects optimal channel and timing per recipient. Batches low-priority notifications. Personalizes content tone.",
      gain: "Notification engagement rate up 35%. Opt-out rate reduced 50% through intelligent timing.",
    },
    patterns: {
      embedded: { action: "Replace static notification rules with personalized orchestration inside existing service." },
      connected: { action: "Notification service sends context to AI moon for channel/timing optimization.", integrationWork: "Add /api/v2/optimize-notification endpoint.", apiEmits: [{ name: "notification_context", type: "object" }], apiReceives: [{ name: "delivery_plan", type: "object" }] },
      independent: { action: "New notification platform built from scratch with ML-native personalized delivery." },
    },
  },

  // email-sender (20)
  {
    nodeId: 20, label: "email-sender", stage: "act", conversionOrder: 52,
    before: {
      summary: "Template-based email sender with static content and fixed scheduling",
      inputFields: [{ name: "template_id", type: "string" }, { name: "recipient", type: "string" }, { name: "merge_data", type: "object" }],
      outputFields: [{ name: "sent", type: "boolean" }, { name: "message_id", type: "string" }],
      logic: "Merge data into email template. Send immediately via SMTP. No personalization beyond merge fields.",
      pain: "Generic emails have low engagement. No A/B testing. No send-time optimization.",
    },
    after: {
      summary: "AI-personalized email with dynamic content, subject optimization, and send-time prediction",
      inputFields: [{ name: "template_id", type: "string" }, { name: "recipient", type: "string" }, { name: "merge_data", type: "object" }, { name: "recipient_profile", type: "object", isNew: true }],
      outputFields: [{ name: "sent", type: "boolean" }, { name: "message_id", type: "string" }, { name: "personalization_applied", type: "string[]", isNew: true }],
      logic: "LLM personalizes email content and subject line. ML predicts optimal send time per recipient.",
      gain: "Email open rates up 25%. Click-through rates up 40% from personalized content.",
    },
    patterns: {
      embedded: { action: "Replace template email with AI-personalized email inside existing sender service." },
      connected: { action: "Email service sends context to AI moon for content personalization.", integrationWork: "Add /api/v2/personalize-email endpoint.", apiEmits: [{ name: "email_context", type: "object" }], apiReceives: [{ name: "personalized_content", type: "object" }] },
      independent: { action: "New communications platform built from scratch with LLM-native email personalization." },
    },
  },

  // sms-gateway (21)
  {
    nodeId: 21, label: "sms-gateway", stage: "act", conversionOrder: 53,
    before: {
      summary: "Template-based SMS sending with character-limited message templates",
      inputFields: [{ name: "template_id", type: "string" }, { name: "phone_number", type: "string" }, { name: "merge_data", type: "object" }],
      outputFields: [{ name: "sent", type: "boolean" }, { name: "message_sid", type: "string" }],
      logic: "Merge data into 160-character template. Send via carrier gateway. No reply handling.",
      pain: "Fixed templates are impersonal. No conversational capability. No smart timing.",
    },
    after: {
      summary: "Conversational SMS with AI-generated responses and intelligent timing",
      inputFields: [{ name: "template_id", type: "string" }, { name: "phone_number", type: "string" }, { name: "merge_data", type: "object" }, { name: "conversation_history", type: "object[]", isNew: true }],
      outputFields: [{ name: "sent", type: "boolean" }, { name: "message_sid", type: "string" }, { name: "conversation_state", type: "string", isNew: true }],
      logic: "LLM generates contextual SMS responses within character limits. Handles multi-turn conversations. Smart send timing.",
      gain: "SMS response rate up 45%. Two-way conversations resolve customer questions without phone calls.",
    },
    patterns: {
      embedded: { action: "Replace template SMS with conversational AI inside existing gateway service." },
      connected: { action: "SMS gateway sends conversation context to AI moon for response generation.", integrationWork: "Add /api/v2/generate-sms endpoint.", apiEmits: [{ name: "sms_context", type: "object" }], apiReceives: [{ name: "generated_message", type: "object" }] },
      independent: { action: "New messaging platform built from scratch with LLM-native conversational SMS." },
    },
  },

  // feedback-loop (54)
  {
    nodeId: 54, label: "feedback-loop", stage: "act", conversionOrder: 54,
    before: {
      summary: "Survey-based feedback collection with manual analysis and reporting",
      inputFields: [{ name: "customer_id", type: "string" }, { name: "survey_type", type: "string" }],
      outputFields: [{ name: "response_collected", type: "boolean" }, { name: "nps_score", type: "number" }],
      logic: "Send standard survey at fixed touchpoints. Aggregate NPS monthly. Manual thematic analysis quarterly.",
      pain: "Low response rates. Insights arrive months after customer experience. No real-time feedback action.",
    },
    after: {
      summary: "Real-time sentiment analysis with automated feedback routing and continuous improvement",
      inputFields: [{ name: "customer_id", type: "string" }, { name: "survey_type", type: "string" }, { name: "interaction_context", type: "object", isNew: true }],
      outputFields: [{ name: "response_collected", type: "boolean" }, { name: "nps_score", type: "number" }, { name: "sentiment", type: "string", isNew: true }, { name: "themes", type: "string[]", isNew: true }, { name: "action_items", type: "string[]", isNew: true }],
      logic: "NLP analyzes feedback in real time. Auto-routes negative sentiment for immediate response. Identifies themes and generates action items.",
      gain: "Negative feedback response time from weeks to hours. Continuous improvement loop closes the gap between feedback and action.",
    },
    patterns: {
      embedded: { action: "Replace survey-based collection with real-time sentiment analysis inside existing service." },
      connected: { action: "Feedback service sends customer responses to AI moon for sentiment analysis and action routing.", integrationWork: "Add /api/v2/analyze-feedback endpoint.", apiEmits: [{ name: "feedback_data", type: "object" }], apiReceives: [{ name: "sentiment_analysis", type: "object" }] },
      independent: { action: "New customer experience platform built from scratch with NLP-native feedback intelligence." },
    },
  },
];

const nodeMap = new Map<number, NodeDataModel>();
for (const m of NODE_MODELS) {
  nodeMap.set(m.nodeId, m);
}

export function getNodeModel(nodeId: number): NodeDataModel | undefined {
  return nodeMap.get(nodeId);
}
