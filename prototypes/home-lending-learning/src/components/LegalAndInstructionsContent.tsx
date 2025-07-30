import React from 'react';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';

interface LegalAndInstructionsContentProps {
  showFullLegalDisclaimer?: boolean;
}

export const LegalAndInstructionsContent: React.FC<LegalAndInstructionsContentProps> = ({ 
  showFullLegalDisclaimer = false 
}) => {
  return (
    <div className="space-y-4 text-sm">
      {/* Data Source & Resources */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Data Sources</h3>
        <p className="text-blue-800 text-sm leading-relaxed mb-3">
          This information was collected and structured by Generative AI based on publicly available 
          documents from Fannie Mae and Freddie Mac. Access the original sources below:
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" asChild className="text-xs">
            <a 
              href="https://selling-guide.fanniemae.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span>Fannie Mae Selling Guide</span>
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="text-xs">
            <a 
              href="https://guide.freddiemac.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span>Freddie Mac Guide</span>
            </a>
          </Button>
        </div>
      </div>

      {showFullLegalDisclaimer && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-2">Legal Disclaimer</h3>
          <div className="space-y-3 text-orange-800">
            <p>
              <strong>EDUCATIONAL USE ONLY:</strong> The content presented is for educational purposes only and should not be relied upon as legal, financial, or professional advice.
            </p>
            
            <p>
              <strong>VERIFICATION REQUIRED:</strong> All information must be independently verified before use. The accuracy, completeness, and applicability of this content to your specific situation cannot be guaranteed.
            </p>
            
            <p>
              <strong>NO LIABILITY:</strong> The authors, developers, and all associated parties expressly disclaim any and all liability for any direct, indirect, incidental, consequential, or punitive damages arising from your access to or use of this information. Users assume all risks associated with the use of this content.
            </p>
            
            <p>
              <strong>PROFESSIONAL ADVICE:</strong> Always consult with qualified professionals (attorneys, financial advisors, mortgage specialists) before making any decisions related to home lending or financial matters.
            </p>
            
            <p className="text-xs text-orange-600 italic">
              By using this platform, you acknowledge that you have read, understood, and agree to these terms.
            </p>
          </div>
        </div>
      )}

      {!showFullLegalDisclaimer && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-orange-800 font-medium mb-1">Important Disclaimer</p>
          <p className="text-orange-700 text-xs">
            Information collected from Fannie Mae and Freddie Mac guides via GenAI. 
            Verify all information independently. No liability assumed. For educational purposes only.
          </p>
        </div>
      )}
      
      {/* Usage Instructions */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">How to Use This Platform</h3>
        
        <div className="flex gap-3">
          <div className="bg-blue-100 p-1 rounded-full flex-shrink-0 mt-0.5">
            <span className="block w-2 h-2 bg-blue-600 rounded-full"></span>
          </div>
          <div>
            <p><strong className="text-blue-600">Explore Documentation</strong></p>
            <p className="text-gray-600">View required documents, who gathers them, and which professionals review them</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-purple-100 p-1 rounded-full flex-shrink-0 mt-0.5">
            <span className="block w-2 h-2 bg-purple-600 rounded-full"></span>
          </div>
          <div>
            <p><strong className="text-purple-600">Navigate Process Flow</strong></p>
            <p className="text-gray-600">Click nodes on the flow map to understand each step of the home lending process</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-green-100 p-1 rounded-full flex-shrink-0 mt-0.5">
            <span className="block w-2 h-2 bg-green-600 rounded-full"></span>
          </div>
          <div>
            <p><strong className="text-green-600">Browse Glossary & Test Knowledge</strong></p>
            <p className="text-gray-600">Search terms and test your knowledge with interactive study cards</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-orange-100 p-1 rounded-full flex-shrink-0 mt-0.5">
            <span className="block w-2 h-2 bg-orange-600 rounded-full"></span>
          </div>
          <div>
            <p><strong className="text-orange-600">Track Progress</strong></p>
            <p className="text-gray-600">View your learning profile to see mastered terms and completed topics</p>
          </div>
        </div>
      </div>
      
      <div className="pt-3 border-t">
        <p className="text-xs text-gray-600">
          <strong>Getting Started:</strong> Begin by exploring the Documentation Overview to understand what's needed for a home loan, 
          then use the Process Flow Map to see how everything connects, and finally test your knowledge in the Glossary Browser.
        </p>
      </div>
    </div>
  );
};