/**
 * AI-readiness conversion order.
 *
 * Nodes convert in stage order: INTAKE → TRANSFORMATION → DECISION → ACTION.
 * Within each stage, infrastructure/foundational nodes convert before
 * customer-facing ones.
 *
 * This replaces the previous sequential (0, 1, 2, ... 54) order.
 */
export const CONVERSION_ORDER: number[] = [
  // ── Stage 1: INTAKE (13 nodes) ──
  // Infrastructure foundations first
  49, // load-balancer
  48, // routing-logic
  9,  // rate-limiter
  8,  // cache-layer
  7,  // event-bus
  6,  // queue-handler
  // Core intake flow
  1,  // auth-gateway
  2,  // session-mgr
  0,  // intake-router
  5,  // intake-flow
  4,  // data-mapper
  3,  // form-validator
  12, // identity-verify

  // ── Stage 2: TRANSFORMATION (13 nodes) ──
  // Storage and pipeline infrastructure first
  39, // archive-svc
  44, // data-warehouse
  43, // etl-pipeline
  42, // data-extract
  // Indexing and analytics
  40, // search-index
  41, // analytics-agg
  45, // bi-connector
  // Audit and logging
  23, // audit-logger
  38, // audit-trail
  // Document processing
  14, // ocr-engine
  15, // pdf-parser
  13, // doc-classifier
  16, // data-enrichment

  // ── Stage 3: DECISION (15 nodes) ──
  // Compliance and regulatory foundations first
  24, // compliance-rule
  25, // reg-matcher
  26, // policy-engine
  33, // compliance-chk
  // Fraud and security
  36, // sanctions-chk
  35, // aml-screen
  34, // fraud-detect
  // Workflow
  18, // workflow-engine
  17, // approval-gate
  47, // alert-engine
  // Scoring and pricing (highest business logic)
  11, // credit-check
  10, // risk-scoring
  27, // eligibility
  28, // pricing-calc
  29, // fee-schedule

  // ── Stage 4: ACTION (14 nodes) ──
  // Infrastructure first
  46, // dashboard-api
  37, // report-gen
  51, // template-mgr
  // Payments
  30, // payment-proc
  31, // escrow-mgr
  32, // fund-transfer
  // Document generation
  50, // disclosure-gen
  52, // signing-svc
  22, // doc-review
  53, // delivery-track
  // Customer communications (most visible, last)
  19, // notification-svc
  20, // email-sender
  21, // sms-gateway
  54, // feedback-loop
];
