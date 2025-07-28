import { StudyCard } from '../types';

export const studyCards: StudyCard[] = [
  // Beginner Level - Basic Terminology
  {
    id: 'card-001',
    question: 'What is a credit score and what range do lenders typically prefer?',
    answer: 'A credit score is a numerical representation of creditworthiness, typically ranging from 300-850. Lenders usually prefer scores in the mid-700s or above for the best loan terms.',
    category: 'terminology',
    difficulty: 'beginner',
    glossaryTerms: ['credit-score'],
    flowMapNodes: ['credit-check']
  },
  {
    id: 'card-002',
    question: 'What is the debt-to-income ratio (DTI) and why is it important?',
    answer: 'DTI is the percentage of monthly gross income that goes toward paying debts. It\'s important because lenders use it to assess your ability to manage monthly payments and repay the loan. Most lenders prefer a DTI of 43% or lower.',
    category: 'terminology',
    difficulty: 'beginner',
    glossaryTerms: ['debt-to-income-ratio'],
    flowMapNodes: ['financial-assessment', 'underwriting']
  },
  {
    id: 'card-003',
    question: 'What is the difference between pre-qualification and pre-approval?',
    answer: 'Pre-qualification is an informal estimate based on unverified information, while pre-approval is a formal assessment based on verified financial documents. Pre-approval carries more weight with sellers.',
    category: 'process',
    difficulty: 'beginner',
    glossaryTerms: ['pre-approval'],
    flowMapNodes: ['pre-approval']
  },
  {
    id: 'card-004',
    question: 'What is a property appraisal and why is it required?',
    answer: 'An appraisal is a professional assessment of a property\'s fair market value conducted by a licensed appraiser. It\'s required by lenders to ensure the property value supports the loan amount.',
    category: 'process',
    difficulty: 'beginner',
    glossaryTerms: ['appraisal', 'appraised-value'],
    flowMapNodes: ['appraisal-order']
  },
  {
    id: 'card-005',
    question: 'What is title insurance and who does it protect?',
    answer: 'Title insurance protects the lender and/or homeowner against financial loss due to defects in the property title. There are typically two policies: lender\'s policy (required) and owner\'s policy (optional but recommended).',
    category: 'terminology',
    difficulty: 'beginner',
    glossaryTerms: ['title-insurance'],
    flowMapNodes: ['title-search']
  },

  // Intermediate Level - Process Understanding
  {
    id: 'card-006',
    question: 'What documents are typically required for income verification during the mortgage process?',
    answer: 'Income verification typically requires recent pay stubs (1-2 months), W-2 forms (2 years), tax returns (2 years), and employment verification. Self-employed borrowers may need additional documentation like profit/loss statements.',
    category: 'requirements',
    difficulty: 'intermediate',
    glossaryTerms: ['income-verification', 'employment-verification'],
    flowMapNodes: ['document-verification']
  },
  {
    id: 'card-007',
    question: 'What happens during the underwriting process and how long does it typically take?',
    answer: 'During underwriting, an underwriter reviews all documentation to assess lending risk, including credit, income, assets, and property value. The process typically takes several days to several weeks, depending on loan complexity.',
    category: 'process',
    difficulty: 'intermediate',
    glossaryTerms: ['underwriting', 'underwriter'],
    flowMapNodes: ['underwriting']
  },
  {
    id: 'card-008',
    question: 'What is the loan-to-value ratio (LTV) and how does it affect your loan?',
    answer: 'LTV is the ratio of the loan amount to the property value. For example, with a $400,000 home and $320,000 loan, the LTV is 80%. Higher LTV ratios typically require private mortgage insurance (PMI) and may have higher interest rates.',
    category: 'terminology',
    difficulty: 'intermediate',
    glossaryTerms: ['loan-to-value-ratio'],
    flowMapNodes: ['underwriting']
  },
  {
    id: 'card-009',
    question: 'What is conditional approval and what types of conditions might be required?',
    answer: 'Conditional approval means the loan is approved but certain conditions must be met before closing. Common conditions include updated pay stubs, bank statements, explanation letters, or property repairs.',
    category: 'process',
    difficulty: 'intermediate',
    glossaryTerms: ['conditional-approval', 'loan-conditions'],
    flowMapNodes: ['conditional-approval', 'condition-clearance']
  },
  {
    id: 'card-010',
    question: 'What is the difference between a Loan Estimate and Closing Disclosure?',
    answer: 'A Loan Estimate is provided within 3 days of application and shows estimated terms and costs. The Closing Disclosure shows final terms and costs, provided at least 3 days before closing.',
    category: 'regulations',
    difficulty: 'intermediate',
    glossaryTerms: ['loan-estimate', 'closing-disclosure'],
    flowMapNodes: ['formal-application', 'closing-disclosure']
  },

  // Advanced Level - Complex Scenarios and Regulations
  {
    id: 'card-011',
    question: 'What is the TRID rule and how does it affect the mortgage timeline?',
    answer: 'TRID (TILA-RESPA Integrated Disclosure) requires lenders to provide a Loan Estimate within 3 business days of application and a Closing Disclosure at least 3 business days before closing. This rule helps ensure borrowers have time to review loan terms.',
    category: 'regulations',
    difficulty: 'advanced',
    glossaryTerms: ['closing-disclosure', 'loan-estimate'],
    flowMapNodes: ['formal-application', 'closing-disclosure']
  },
  {
    id: 'card-012',
    question: 'What happens if the appraisal comes in lower than the purchase price?',
    answer: 'If the appraisal is lower than the purchase price, options include: 1) Buyer pays the difference in cash, 2) Seller reduces the price, 3) Both parties meet in the middle, or 4) Buyer walks away if there\'s an appraisal contingency.',
    category: 'process',
    difficulty: 'advanced',
    glossaryTerms: ['appraisal', 'appraised-value', 'contingencies'],
    flowMapNodes: ['appraisal-order', 'purchase-agreement']
  },
  {
    id: 'card-013',
    question: 'What are the key differences between conventional, FHA, VA, and USDA loans?',
    answer: 'Conventional loans are not government-backed and typically require 3-20% down. FHA loans require 3.5% down but have mortgage insurance. VA loans are for veterans with no down payment. USDA loans are for rural areas with no down payment.',
    category: 'requirements',
    difficulty: 'advanced',
    glossaryTerms: ['loan-to-value-ratio'],
    flowMapNodes: ['pre-approval', 'underwriting']
  },
  {
    id: 'card-014',
    question: 'What is automated underwriting and how does it differ from manual underwriting?',
    answer: 'Automated underwriting uses computer algorithms to quickly assess loan risk based on credit scores, DTI, and other factors. Manual underwriting involves human review and is used for complex situations or when automated systems can\'t approve the loan.',
    category: 'process',
    difficulty: 'advanced',
    glossaryTerms: ['underwriting'],
    flowMapNodes: ['underwriting']
  },
  {
    id: 'card-015',
    question: 'What is a lien and how can it affect the closing process?',
    answer: 'A lien is a legal claim against a property that must be satisfied before the property can be sold. Common types include tax liens, contractor liens, and judgment liens. Liens must typically be resolved before closing can occur.',
    category: 'terminology',
    difficulty: 'advanced',
    glossaryTerms: ['lien', 'title-search'],
    flowMapNodes: ['title-search', 'closing']
  },

  // Process Flow Cards
  {
    id: 'card-016',
    question: 'What are the main phases of the mortgage process in chronological order?',
    answer: 'The main phases are: 1) Preparation (credit check, financial assessment, pre-approval), 2) Application (house hunting, purchase agreement, formal application), 3) Processing (document verification, appraisal, title work), 4) Underwriting (review, approval/denial), 5) Closing (final approval, closing disclosure, closing meeting, funding).',
    category: 'process',
    difficulty: 'intermediate',
    glossaryTerms: ['pre-approval', 'underwriting', 'closing'],
    flowMapNodes: ['credit-check', 'formal-application', 'underwriting', 'closing-meeting']
  },
  {
    id: 'card-017',
    question: 'What is "clear to close" and what must happen before reaching this status?',
    answer: 'Clear to close (CTC) means all loan conditions have been satisfied and the loan is ready for closing. Before CTC, the borrower must satisfy all underwriting conditions, and the lender must verify final documentation.',
    category: 'process',
    difficulty: 'intermediate',
    glossaryTerms: ['clear-to-close', 'loan-conditions'],
    flowMapNodes: ['clear-to-close', 'condition-clearance']
  },
  {
    id: 'card-018',
    question: 'What documents are typically signed at closing and what do they accomplish?',
    answer: 'Key closing documents include the promissory note (loan agreement), deed of trust/mortgage (security instrument), deed (property transfer), and various disclosure forms. These documents finalize the loan and transfer property ownership.',
    category: 'process',
    difficulty: 'intermediate',
    glossaryTerms: ['promissory-note', 'deed', 'closing'],
    flowMapNodes: ['closing-meeting']
  },

  // Financial Concepts
  {
    id: 'card-019',
    question: 'What are closing costs and who typically pays them?',
    answer: 'Closing costs are fees for services related to the mortgage and property transfer, typically 2-5% of the loan amount. They include origination fees, appraisal, title insurance, and attorney fees. Both buyer and seller may have closing costs.',
    category: 'terminology',
    difficulty: 'intermediate',
    glossaryTerms: ['closing-costs'],
    flowMapNodes: ['closing-disclosure', 'closing-meeting']
  },
  {
    id: 'card-020',
    question: 'What is earnest money and what happens to it during the transaction?',
    answer: 'Earnest money is a deposit showing the buyer\'s good faith intent to purchase. It\'s typically held in escrow and applied toward the down payment or closing costs at closing. If the buyer defaults without valid reason, the seller may keep it.',
    category: 'terminology',
    difficulty: 'beginner',
    glossaryTerms: ['earnest-money'],
    flowMapNodes: ['purchase-agreement']
  }
];