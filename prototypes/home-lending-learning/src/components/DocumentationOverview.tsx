import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Info,
  User,
  Building,
  FileCheck,
  AlertCircle,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { ProcessPersona, DocumentRequirement } from '../types';

interface DocumentationOverviewProps {
  personas: ProcessPersona[];
  documents: DocumentRequirement[];
  onPersonaClick?: (persona: ProcessPersona) => void;
  onDocumentClick?: (document: DocumentRequirement) => void;
}

export const DocumentationOverview: React.FC<DocumentationOverviewProps> = ({
  personas,
  documents,
  onPersonaClick,
  onDocumentClick
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'borrower-provided' | 'professional-obtained' | 'process-generated'>('all');
  const [selectedPersona, setSelectedPersona] = useState<ProcessPersona | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'borrower-provided':
        return <User className="w-4 h-4" />;
      case 'professional-obtained':
        return <Building className="w-4 h-4" />;
      case 'process-generated':
        return <FileCheck className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'borrower-provided':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'professional-obtained':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'process-generated':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'borrower-provided':
        return 'You Provide';
      case 'professional-obtained':
        return 'Professionals Gather';
      case 'process-generated':
        return 'Process Creates';
      default:
        return category;
    }
  };

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  const getPersonaDocuments = (persona: ProcessPersona) => {
    return documents.filter(doc => 
      doc.reviewedBy.includes(persona.id) || 
      (persona.id === 'underwriter' && doc.reviewedBy.includes('all-documents'))
    );
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Understanding the Home Loan Documentation Process</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          See what documents you'll need to provide, what professionals gather for you, and who reviews everything behind the scenes
        </p>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {documents.filter(d => d.category === 'borrower-provided').length}
                </p>
                <p className="text-sm text-blue-700">Documents You Provide</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {documents.filter(d => d.category === 'professional-obtained').length}
                </p>
                <p className="text-sm text-purple-700">Gathered by Professionals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {personas.length}
                </p>
                <p className="text-sm text-green-700">Behind-the-Scenes Reviewers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behind the Scenes Personas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Who Reviews Your Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                  selectedPersona?.id === persona.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => {
                  setSelectedPersona(persona);
                  onPersonaClick?.(persona);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-1">{persona.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{persona.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      <span>Reviews {getPersonaDocuments(persona).length} document types</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>

          {selectedPersona && (
            <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
              <h5 className="font-semibold mb-2">{selectedPersona.title} Responsibilities:</h5>
              <ul className="space-y-1 mb-3">
                {selectedPersona.responsibilities.map((resp, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Active during:</span>{' '}
                {selectedPersona.processStages.join(', ')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Categories Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Documents ({documents.length})
        </Button>
        <Button
          variant={selectedCategory === 'borrower-provided' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('borrower-provided')}
          className="flex items-center gap-2"
        >
          <User className="w-3 h-3" />
          You Provide ({documents.filter(d => d.category === 'borrower-provided').length})
        </Button>
        <Button
          variant={selectedCategory === 'professional-obtained' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('professional-obtained')}
          className="flex items-center gap-2"
        >
          <Building className="w-3 h-3" />
          Professionals Gather ({documents.filter(d => d.category === 'professional-obtained').length})
        </Button>
        <Button
          variant={selectedCategory === 'process-generated' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('process-generated')}
          className="flex items-center gap-2"
        >
          <FileCheck className="w-3 h-3" />
          Process Creates ({documents.filter(d => d.category === 'process-generated').length})
        </Button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <Card 
            key={doc.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onDocumentClick?.(doc)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base flex items-start gap-2">
                  {getCategoryIcon(doc.category)}
                  <span className="break-words">{doc.name}</span>
                </CardTitle>
              </div>
              <Badge className={`${getCategoryColor(doc.category)} text-xs`}>
                {getCategoryLabel(doc.category)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{doc.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">When needed:</p>
                    <p className="text-xs text-muted-foreground">{doc.whenNeeded}</p>
                  </div>
                </div>
                
                {doc.tips && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Tip:</p>
                      <p className="text-xs text-muted-foreground">{doc.tips}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Reviewed by: {doc.reviewedBy.map(r => {
                    const persona = personas.find(p => p.id === r);
                    return persona?.title || r;
                  }).join(', ')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};