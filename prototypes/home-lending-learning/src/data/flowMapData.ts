import { FlowMapNode } from '../types';

export const flowMapNodes: FlowMapNode[] = [
  // Preparation Phase (left to right within category)
  {
    id: 'credit-check',
    title: 'Credit Score Review',
    description: 'Borrower reviews their credit score and credit history before applying',
    category: 'preparation',
    position: { x: 100, y: 100 },
    connections: ['pre-approval'], // Can be done in parallel with financial assessment
    glossaryTerms: ['credit-score', 'credit-report', 'credit-history']
  },
  {
    id: 'financial-assessment',
    title: 'Financial Assessment',
    description: 'Borrower evaluates their income, debts, and assets to determine affordability',
    category: 'preparation',
    position: { x: 200, y: 100 },
    connections: ['pre-approval'], // Can be done in parallel with credit check
    glossaryTerms: ['debt-to-income-ratio', 'assets', 'income-verification']
  },
  {
    id: 'pre-approval',
    title: 'Pre-Approval Application',
    description: 'Borrower submits initial application to get pre-approved for a loan amount',
    category: 'preparation',
    position: { x: 300, y: 100 },
    connections: ['house-hunting'],
    glossaryTerms: ['pre-approval', 'loan-estimate', 'good-faith-estimate']
  },

  // Application Phase (left to right within category)
  {
    id: 'house-hunting',
    title: 'House Hunting',
    description: 'Borrower searches for and selects a property within their pre-approved amount',
    category: 'application',
    position: { x: 400, y: 100 },
    connections: ['purchase-agreement'],
    glossaryTerms: ['purchase-price', 'home-inspection', 'market-value']
  },
  {
    id: 'purchase-agreement',
    title: 'Purchase Agreement',
    description: 'Borrower signs a purchase agreement with the seller',
    category: 'application',
    position: { x: 500, y: 100 },
    connections: ['formal-application'],
    glossaryTerms: ['purchase-agreement', 'earnest-money', 'contingencies']
  },
  {
    id: 'formal-application',
    title: 'Formal Loan Application',
    description: 'Borrower submits complete loan application with all required documentation',
    category: 'application',
    position: { x: 600, y: 100 },
    connections: ['document-verification', 'appraisal-order', 'title-search'], // These can start in parallel
    glossaryTerms: ['loan-application', 'uniform-residential-loan-application', 'documentation']
  },

  // Processing Phase (left to right within category)
  {
    id: 'document-verification',
    title: 'Document Verification',
    description: 'Lender verifies all submitted documents and requests additional information if needed',
    category: 'processing',
    position: { x: 700, y: 100 },
    connections: ['underwriting'], // All processing steps feed into underwriting
    glossaryTerms: ['income-verification', 'employment-verification', 'bank-statements']
  },
  {
    id: 'appraisal-order',
    title: 'Property Appraisal',
    description: 'Lender orders professional appraisal to determine property value',
    category: 'processing',
    position: { x: 800, y: 100 },
    connections: ['underwriting'], // Can be done in parallel with other processing steps
    glossaryTerms: ['appraisal', 'appraised-value', 'comparable-sales']
  },
  {
    id: 'title-search',
    title: 'Title Search & Insurance',
    description: 'Title company conducts search and provides title insurance',
    category: 'processing',
    position: { x: 900, y: 100 },
    connections: ['underwriting'], // Can be done in parallel with other processing steps
    glossaryTerms: ['title-search', 'title-insurance', 'lien']
  },

  // Underwriting Phase (left to right within category)
  {
    id: 'underwriting',
    title: 'Underwriting Review',
    description: 'Underwriter reviews all documentation and makes lending decision',
    category: 'underwriting',
    position: { x: 1000, y: 100 },
    connections: ['conditional-approval', 'loan-denial'], // Two possible outcomes
    glossaryTerms: ['underwriting', 'underwriter', 'loan-to-value-ratio', 'risk-assessment']
  },
  {
    id: 'conditional-approval',
    title: 'Conditional Approval',
    description: 'Loan approved with conditions that must be met before closing',
    category: 'underwriting',
    position: { x: 1100, y: 100 },
    connections: ['condition-clearance'],
    glossaryTerms: ['conditional-approval', 'loan-conditions', 'prior-to-docs']
  },
  {
    id: 'loan-denial',
    title: 'Loan Denial',
    description: 'Loan application is denied due to failure to meet lending criteria',
    category: 'underwriting',
    position: { x: 1200, y: 100 },
    connections: [], // END OF ROAD - No further connections, process stops here
    glossaryTerms: ['loan-denial', 'adverse-action-notice', 'denial-reasons']
  },
  {
    id: 'condition-clearance',
    title: 'Condition Clearance',
    description: 'Borrower provides additional documentation to satisfy loan conditions',
    category: 'underwriting',
    position: { x: 1300, y: 100 },
    connections: ['clear-to-close'],
    glossaryTerms: ['loan-conditions', 'condition-clearance', 'supplemental-documentation']
  },

  // Closing Phase (left to right within category)
  {
    id: 'clear-to-close',
    title: 'Clear to Close',
    description: 'All conditions met, loan is approved and ready for closing',
    category: 'closing',
    position: { x: 1400, y: 100 },
    connections: ['closing-disclosure'],
    glossaryTerms: ['clear-to-close', 'final-approval', 'closing-conditions']
  },
  {
    id: 'closing-disclosure',
    title: 'Closing Disclosure',
    description: 'Borrower receives and reviews final loan terms and closing costs',
    category: 'closing',
    position: { x: 1500, y: 100 },
    connections: ['closing-meeting'], // Must happen before closing meeting
    glossaryTerms: ['closing-disclosure', 'closing-costs', 'final-loan-terms']
  },
  {
    id: 'closing-meeting',
    title: 'Closing Meeting',
    description: 'Final signatures, funds transfer, and property ownership transfer',
    category: 'closing',
    position: { x: 1600, y: 100 },
    connections: ['loan-funding'],
    glossaryTerms: ['closing', 'settlement', 'deed', 'promissory-note']
  },
  {
    id: 'loan-funding',
    title: 'Loan Funding',
    description: 'Lender funds the loan and borrower takes ownership of the property',
    category: 'closing',
    position: { x: 1700, y: 100 },
    connections: [], // Final step in the process
    glossaryTerms: ['loan-funding', 'recording', 'deed-of-trust']
  }
];