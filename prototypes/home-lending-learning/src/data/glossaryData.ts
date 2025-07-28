import { GlossaryTerm } from '../types';

export const glossaryTerms: GlossaryTerm[] = [
  // Credit and Financial Terms
  {
    id: 'credit-score',
    term: 'Credit Score',
    definition: 'A numerical representation of creditworthiness, typically ranging from 300-850, used by lenders to assess lending risk.',
    category: 'financial',
    relatedTerms: ['credit-report', 'credit-history', 'fico-score'],
    flowMapNodes: ['credit-check'],
    examples: ['FICO score of 740', 'VantageScore of 680']
  },
  {
    id: 'credit-report',
    term: 'Credit Report',
    definition: 'A detailed record of an individual\'s credit history, including payment history, current debts, and credit inquiries.',
    category: 'financial',
    relatedTerms: ['credit-score', 'credit-history'],
    flowMapNodes: ['credit-check'],
    examples: ['Experian credit report', 'TransUnion report']
  },
  {
    id: 'credit-history',
    term: 'Credit History',
    definition: 'A record of how a borrower has managed credit accounts over time, including payment patterns and account management.',
    category: 'financial',
    relatedTerms: ['credit-score', 'credit-report'],
    flowMapNodes: ['credit-check'],
    examples: ['5 years of on-time payments', 'History of managing multiple credit cards']
  },
  {
    id: 'debt-to-income-ratio',
    term: 'Debt-to-Income Ratio (DTI)',
    definition: 'The percentage of monthly gross income that goes toward paying debts. Calculated as total monthly debt payments divided by gross monthly income.',
    category: 'financial',
    relatedTerms: ['income-verification', 'qualifying-ratio'],
    flowMapNodes: ['financial-assessment', 'underwriting'],
    examples: ['DTI of 28% (housing expenses)', 'Total DTI of 36% (all debts)']
  },
  {
    id: 'assets',
    term: 'Assets',
    definition: 'Financial resources owned by the borrower that can be converted to cash, including savings, investments, and retirement accounts.',
    category: 'financial',
    relatedTerms: ['liquid-assets', 'down-payment', 'reserves'],
    flowMapNodes: ['financial-assessment', 'document-verification'],
    examples: ['Bank savings account', '401(k) retirement account', 'Investment portfolio']
  },

  // Application Process Terms
  {
    id: 'pre-approval',
    term: 'Pre-Approval',
    definition: 'A preliminary assessment by a lender indicating the loan amount a borrower qualifies for based on verified financial information.',
    category: 'process',
    relatedTerms: ['pre-qualification', 'loan-estimate'],
    flowMapNodes: ['pre-approval'],
    examples: ['Pre-approved for $350,000', 'Valid for 90 days']
  },
  {
    id: 'loan-estimate',
    term: 'Loan Estimate',
    definition: 'A standardized form that provides details about the loan terms, projected payments, and estimated closing costs within 3 business days of application.',
    category: 'legal',
    relatedTerms: ['closing-disclosure', 'good-faith-estimate'],
    flowMapNodes: ['pre-approval', 'formal-application'],
    examples: ['LE received within 3 days', 'Itemized closing costs']
  },
  {
    id: 'loan-application',
    term: 'Loan Application',
    definition: 'A formal request for a mortgage loan that includes detailed information about the borrower\'s finances, employment, and the property.',
    category: 'process',
    relatedTerms: ['uniform-residential-loan-application', 'documentation'],
    flowMapNodes: ['formal-application'],
    examples: ['Fannie Mae Form 1003', 'Online application submission']
  },
  {
    id: 'uniform-residential-loan-application',
    term: 'Uniform Residential Loan Application (URLA)',
    definition: 'The standardized mortgage application form (Form 1003) used by most lenders, designed by Fannie Mae and Freddie Mac.',
    category: 'legal',
    relatedTerms: ['loan-application', 'form-1003'],
    flowMapNodes: ['formal-application'],
    examples: ['Fannie Mae Form 1003', 'Freddie Mac Form 65']
  },

  // Property and Valuation Terms
  {
    id: 'appraisal',
    term: 'Appraisal',
    definition: 'A professional assessment of a property\'s fair market value conducted by a licensed appraiser, required by the lender.',
    category: 'process',
    relatedTerms: ['appraised-value', 'comparable-sales', 'market-value'],
    flowMapNodes: ['appraisal-order'],
    examples: ['$425,000 appraised value', 'Completed within 7-10 days']
  },
  {
    id: 'appraised-value',
    term: 'Appraised Value',
    definition: 'The value of a property as determined by a professional appraiser based on comparable sales and property characteristics.',
    category: 'financial',
    relatedTerms: ['appraisal', 'market-value', 'loan-to-value-ratio'],
    flowMapNodes: ['appraisal-order', 'underwriting'],
    examples: ['Home appraised at $400,000', 'Value supports purchase price']
  },
  {
    id: 'comparable-sales',
    term: 'Comparable Sales (Comps)',
    definition: 'Recently sold properties similar to the subject property in location, size, and features, used to determine fair market value.',
    category: 'process',
    relatedTerms: ['appraisal', 'market-value'],
    flowMapNodes: ['appraisal-order'],
    examples: ['3 comps within 0.5 miles', 'Similar square footage and lot size']
  },

  // Legal and Documentation Terms
  {
    id: 'title-search',
    term: 'Title Search',
    definition: 'An examination of public records to verify legal ownership of a property and identify any liens, encumbrances, or legal issues.',
    category: 'legal',
    relatedTerms: ['title-insurance', 'lien', 'encumbrance'],
    flowMapNodes: ['title-search'],
    examples: ['Clear title search', 'Outstanding lien discovered']
  },
  {
    id: 'title-insurance',
    term: 'Title Insurance',
    definition: 'Insurance that protects the lender and/or homeowner against financial loss due to defects in the property title.',
    category: 'legal',
    relatedTerms: ['title-search', 'owners-policy', 'lenders-policy'],
    flowMapNodes: ['title-search'],
    examples: ['Lender\'s title policy', 'Owner\'s title policy']
  },
  {
    id: 'lien',
    term: 'Lien',
    definition: 'A legal claim against a property that must be satisfied before the property can be sold or refinanced.',
    category: 'legal',
    relatedTerms: ['title-search', 'encumbrance', 'judgment-lien'],
    flowMapNodes: ['title-search', 'closing'],
    examples: ['Tax lien for $5,000', 'Contractor\'s lien']
  },

  // Underwriting Terms
  {
    id: 'underwriting',
    term: 'Underwriting',
    definition: 'The process of evaluating a loan application to determine the risk of lending to a particular borrower.',
    category: 'process',
    relatedTerms: ['underwriter', 'risk-assessment', 'loan-approval'],
    flowMapNodes: ['underwriting'],
    examples: ['Automated underwriting', 'Manual underwriting review']
  },
  {
    id: 'underwriter',
    term: 'Underwriter',
    definition: 'A professional who evaluates loan applications and makes decisions about loan approval based on lending guidelines.',
    category: 'general',
    relatedTerms: ['underwriting', 'loan-approval', 'risk-assessment'],
    flowMapNodes: ['underwriting'],
    examples: ['Senior underwriter review', 'Underwriter conditions']
  },
  {
    id: 'loan-to-value-ratio',
    term: 'Loan-to-Value Ratio (LTV)',
    definition: 'The ratio of the loan amount to the appraised value or purchase price of the property, whichever is lower.',
    category: 'financial',
    relatedTerms: ['down-payment', 'appraised-value', 'risk-assessment'],
    flowMapNodes: ['underwriting'],
    examples: ['80% LTV with 20% down payment', '95% LTV with 5% down']
  },
  {
    id: 'conditional-approval',
    term: 'Conditional Approval',
    definition: 'Loan approval contingent upon the borrower meeting specific conditions before closing.',
    category: 'process',
    relatedTerms: ['loan-conditions', 'prior-to-docs', 'clear-to-close'],
    flowMapNodes: ['conditional-approval'],
    examples: ['Approved with 3 conditions', 'Conditional on income verification']
  },
  {
    id: 'loan-conditions',
    term: 'Loan Conditions',
    definition: 'Specific requirements that must be met before the loan can proceed to closing.',
    category: 'process',
    relatedTerms: ['conditional-approval', 'condition-clearance'],
    flowMapNodes: ['conditional-approval', 'condition-clearance'],
    examples: ['Updated pay stub required', 'Property repair completion']
  },

  // Closing Terms
  {
    id: 'clear-to-close',
    term: 'Clear to Close (CTC)',
    definition: 'Final approval status indicating all loan conditions have been satisfied and the loan is ready for closing.',
    category: 'process',
    relatedTerms: ['final-approval', 'closing-conditions'],
    flowMapNodes: ['clear-to-close'],
    examples: ['Received CTC notification', 'Ready to schedule closing']
  },
  {
    id: 'closing-disclosure',
    term: 'Closing Disclosure (CD)',
    definition: 'A form that provides final details about the mortgage loan, including loan terms, projected monthly payments, and closing costs.',
    category: 'legal',
    relatedTerms: ['closing-costs', 'final-loan-terms', 'loan-estimate'],
    flowMapNodes: ['closing-disclosure'],
    examples: ['CD received 3 days before closing', 'Review final terms']
  },
  {
    id: 'closing-costs',
    term: 'Closing Costs',
    definition: 'Fees and expenses paid at closing for services related to the mortgage and property transfer.',
    category: 'financial',
    relatedTerms: ['closing-disclosure', 'settlement-costs'],
    flowMapNodes: ['closing-disclosure', 'closing-meeting'],
    examples: ['Total closing costs: $8,000', 'Origination fee: $2,000']
  },
  {
    id: 'closing',
    term: 'Closing (Settlement)',
    definition: 'The final step in the mortgage process where documents are signed, funds are transferred, and ownership is transferred.',
    category: 'process',
    relatedTerms: ['settlement', 'deed', 'promissory-note'],
    flowMapNodes: ['closing-meeting'],
    examples: ['Closing scheduled for Friday', 'Title company closing']
  },
  {
    id: 'promissory-note',
    term: 'Promissory Note',
    definition: 'A legal document in which the borrower promises to repay the loan according to agreed terms.',
    category: 'legal',
    relatedTerms: ['mortgage-note', 'deed-of-trust'],
    flowMapNodes: ['closing-meeting'],
    examples: ['30-year promissory note', 'Fixed-rate note']
  },
  {
    id: 'deed',
    term: 'Deed',
    definition: 'A legal document that transfers ownership of real property from the seller to the buyer.',
    category: 'legal',
    relatedTerms: ['deed-of-trust', 'warranty-deed', 'quitclaim-deed'],
    flowMapNodes: ['closing-meeting', 'loan-funding'],
    examples: ['Warranty deed executed', 'Deed recorded at courthouse']
  },
  {
    id: 'loan-funding',
    term: 'Loan Funding',
    definition: 'The final step where the lender releases loan funds to complete the property purchase.',
    category: 'process',
    relatedTerms: ['recording', 'deed-of-trust'],
    flowMapNodes: ['loan-funding'],
    examples: ['Loan funded on Tuesday', 'Keys released after funding']
  },

  // Income and Employment Terms
  {
    id: 'income-verification',
    term: 'Income Verification',
    definition: 'The process of confirming a borrower\'s income through pay stubs, tax returns, and employment verification.',
    category: 'process',
    relatedTerms: ['employment-verification', 'pay-stubs', 'tax-returns'],
    flowMapNodes: ['financial-assessment', 'document-verification'],
    examples: ['W-2 forms for 2 years', 'Recent pay stubs']
  },
  {
    id: 'employment-verification',
    term: 'Employment Verification',
    definition: 'Confirmation of a borrower\'s current employment status, job stability, and income.',
    category: 'process',
    relatedTerms: ['income-verification', 'verification-of-employment'],
    flowMapNodes: ['document-verification'],
    examples: ['HR department verification', 'Employment letter']
  },

  // Additional Process Terms
  {
    id: 'purchase-agreement',
    term: 'Purchase Agreement',
    definition: 'A legal contract between buyer and seller outlining the terms and conditions of the property sale.',
    category: 'legal',
    relatedTerms: ['purchase-contract', 'earnest-money', 'contingencies'],
    flowMapNodes: ['purchase-agreement'],
    examples: ['Signed purchase agreement', 'Contract contingencies']
  },
  {
    id: 'earnest-money',
    term: 'Earnest Money',
    definition: 'A deposit made by the buyer to demonstrate good faith and serious intent to purchase the property.',
    category: 'financial',
    relatedTerms: ['purchase-agreement', 'good-faith-deposit'],
    flowMapNodes: ['purchase-agreement'],
    examples: ['$5,000 earnest money deposit', 'Held in escrow']
  },
  {
    id: 'contingencies',
    term: 'Contingencies',
    definition: 'Conditions in the purchase agreement that must be met for the sale to proceed.',
    category: 'legal',
    relatedTerms: ['purchase-agreement', 'home-inspection', 'financing-contingency'],
    flowMapNodes: ['purchase-agreement'],
    examples: ['Financing contingency', 'Inspection contingency']
  }
];