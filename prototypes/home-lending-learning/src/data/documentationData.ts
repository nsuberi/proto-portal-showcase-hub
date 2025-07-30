import { DocumentRequirement, ProcessPersona } from '../types';

export const processPersonas: ProcessPersona[] = [
  {
    id: 'loan-officer',
    title: 'Loan Officer',
    description: 'Your primary contact who guides you through the application process and collects initial documentation',
    responsibilities: [
      'Reviews your financial situation',
      'Helps determine loan options',
      'Collects initial application documents',
      'Issues pre-approval letters'
    ],
    reviewsDocuments: ['credit-report', 'income-docs', 'asset-statements', 'employment-verification'],
    processStages: ['pre-approval', 'formal-application']
  },
  {
    id: 'loan-processor',
    title: 'Loan Processor',
    description: 'Behind-the-scenes professional who verifies all your documentation and coordinates third-party services',
    responsibilities: [
      'Verifies all submitted documents',
      'Orders property appraisal',
      'Coordinates title search',
      'Prepares file for underwriting'
    ],
    reviewsDocuments: ['bank-statements', 'tax-returns', 'pay-stubs', 'insurance-docs'],
    processStages: ['document-verification', 'appraisal-order', 'title-search']
  },
  {
    id: 'underwriter',
    title: 'Underwriter',
    description: 'The decision maker who assesses risk and determines if your loan meets lending guidelines',
    responsibilities: [
      'Reviews complete loan file',
      'Assesses creditworthiness',
      'Evaluates property value vs loan amount',
      'Issues approval, conditional approval, or denial'
    ],
    reviewsDocuments: ['all-documents'],
    processStages: ['underwriting', 'conditional-approval', 'condition-clearance']
  },
  {
    id: 'appraiser',
    title: 'Property Appraiser',
    description: 'Independent professional who determines the fair market value of the property',
    responsibilities: [
      'Inspects the property',
      'Compares to similar recent sales',
      'Determines fair market value',
      'Documents property condition'
    ],
    reviewsDocuments: ['property-info', 'purchase-agreement'],
    processStages: ['appraisal-order']
  },
  {
    id: 'title-officer',
    title: 'Title Officer',
    description: 'Ensures clear property ownership and handles legal aspects of the property transfer',
    responsibilities: [
      'Searches public records for liens',
      'Verifies legal ownership',
      'Issues title insurance',
      'Prepares legal documents'
    ],
    reviewsDocuments: ['property-deed', 'lien-records'],
    processStages: ['title-search']
  },
  {
    id: 'closing-agent',
    title: 'Closing Agent',
    description: 'Facilitates the final transaction and ensures all documents are properly executed',
    responsibilities: [
      'Prepares closing documents',
      'Explains loan terms',
      'Collects signatures',
      'Distributes funds'
    ],
    reviewsDocuments: ['closing-disclosure', 'loan-documents', 'insurance-policies'],
    processStages: ['closing-disclosure', 'closing-meeting', 'loan-funding']
  }
];

export const documentRequirements: DocumentRequirement[] = [
  // Documents YOU provide
  {
    id: 'credit-authorization',
    name: 'Credit Check Authorization',
    description: 'Permission for lenders to pull your credit report',
    category: 'borrower-provided',
    requiredFor: ['pre-approval', 'formal-application'],
    reviewedBy: ['loan-officer'],
    whenNeeded: 'At the very beginning of the process',
    tips: 'This allows lenders to check your credit score and history'
  },
  {
    id: 'income-docs',
    name: 'Income Documentation',
    description: 'Proof of your income through pay stubs, W-2s, or tax returns',
    category: 'borrower-provided',
    requiredFor: ['pre-approval', 'document-verification'],
    reviewedBy: ['loan-officer', 'loan-processor', 'underwriter'],
    whenNeeded: 'For pre-approval and final verification',
    tips: 'Have 2 years of tax returns and 2 months of pay stubs ready'
  },
  {
    id: 'bank-statements',
    name: 'Bank Statements',
    description: '2-3 months of statements showing your assets and down payment funds',
    category: 'borrower-provided',
    requiredFor: ['financial-assessment', 'document-verification'],
    reviewedBy: ['loan-processor', 'underwriter'],
    whenNeeded: 'During document verification',
    tips: 'Avoid large unexplained deposits or transfers before applying'
  },
  {
    id: 'employment-verification',
    name: 'Employment Verification',
    description: 'Letter from employer confirming job status and income',
    category: 'borrower-provided',
    requiredFor: ['document-verification'],
    reviewedBy: ['loan-processor', 'underwriter'],
    whenNeeded: 'During processing',
    tips: 'Lender may contact your employer directly'
  },
  {
    id: 'tax-returns',
    name: 'Tax Returns',
    description: '2 years of complete federal tax returns with all schedules',
    category: 'borrower-provided',
    requiredFor: ['document-verification'],
    reviewedBy: ['loan-processor', 'underwriter'],
    whenNeeded: 'During document verification',
    tips: 'Include all pages and schedules, not just the first page'
  },
  {
    id: 'asset-statements',
    name: 'Asset Statements',
    description: 'Documentation of retirement accounts, investments, and other assets',
    category: 'borrower-provided',
    requiredFor: ['financial-assessment', 'document-verification'],
    reviewedBy: ['loan-officer', 'underwriter'],
    whenNeeded: 'For pre-approval and verification',
    tips: 'Shows reserves and additional financial strength'
  },
  
  // Documents gathered by PROFESSIONALS
  {
    id: 'credit-report',
    name: 'Credit Report',
    description: 'Detailed credit history from major credit bureaus',
    category: 'professional-obtained',
    requiredFor: ['credit-check', 'underwriting'],
    reviewedBy: ['loan-officer', 'underwriter'],
    whenNeeded: 'Pulled at application and before closing',
    tips: 'Check your credit report for errors before applying'
  },
  {
    id: 'appraisal-report',
    name: 'Property Appraisal',
    description: 'Professional assessment of property value',
    category: 'professional-obtained',
    requiredFor: ['appraisal-order', 'underwriting'],
    reviewedBy: ['underwriter'],
    whenNeeded: 'After offer accepted, during processing',
    tips: 'Property must appraise at or above purchase price'
  },
  {
    id: 'title-report',
    name: 'Title Search Report',
    description: 'Research showing property ownership history and any liens',
    category: 'professional-obtained',
    requiredFor: ['title-search', 'underwriting'],
    reviewedBy: ['underwriter', 'closing-agent'],
    whenNeeded: 'During processing phase',
    tips: 'Ensures clear ownership transfer'
  },
  {
    id: 'flood-certification',
    name: 'Flood Zone Determination',
    description: 'Determines if property is in a flood zone requiring insurance',
    category: 'professional-obtained',
    requiredFor: ['processing', 'underwriting'],
    reviewedBy: ['underwriter'],
    whenNeeded: 'During processing',
    tips: 'May require flood insurance if in flood zone'
  },
  
  // Documents created during the PROCESS
  {
    id: 'loan-estimate',
    name: 'Loan Estimate',
    description: 'Standardized form showing estimated loan terms and costs',
    category: 'process-generated',
    requiredFor: ['pre-approval', 'formal-application'],
    reviewedBy: ['borrower'],
    whenNeeded: 'Within 3 days of application',
    tips: 'Compare estimates from multiple lenders'
  },
  {
    id: 'purchase-agreement',
    name: 'Purchase Agreement',
    description: 'Contract between buyer and seller with property details and terms',
    category: 'process-generated',
    requiredFor: ['purchase-agreement', 'formal-application'],
    reviewedBy: ['loan-processor', 'appraiser', 'underwriter'],
    whenNeeded: 'When offer is accepted',
    tips: 'Include financing contingency to protect your earnest money'
  },
  {
    id: 'closing-disclosure',
    name: 'Closing Disclosure',
    description: 'Final loan terms and closing costs, must match Loan Estimate',
    category: 'process-generated',
    requiredFor: ['closing-disclosure', 'closing-meeting'],
    reviewedBy: ['borrower', 'closing-agent'],
    whenNeeded: 'At least 3 days before closing',
    tips: 'Review carefully and compare to Loan Estimate'
  }
];