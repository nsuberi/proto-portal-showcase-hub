import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, BookOpen, CheckCircle, Brain } from 'lucide-react';
import { FlowMapNode, GlossaryTerm } from '../types';
import { CATEGORIES } from '../constants';

interface NodeDetailPopupProps {
  node: FlowMapNode;
  glossaryTerms: GlossaryTerm[];
  knownTerms: string[];
  onClose: () => void;
  onTermClick: (term: GlossaryTerm) => void;
  onTestKnowledge: (term: GlossaryTerm) => void;
}

export function NodeDetailPopup({ node, glossaryTerms, knownTerms, onClose, onTermClick, onTestKnowledge }: NodeDetailPopupProps) {
  const nodeGlossaryTerms = node.glossaryTerms
    .map(termId => glossaryTerms.find(term => term.id === termId))
    .filter(Boolean) as GlossaryTerm[];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{node.title}</CardTitle>
            <Badge className={CATEGORIES[node.category].bgClass}>
              {CATEGORIES[node.category].label}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <p className="text-muted-foreground mb-6">{node.description}</p>
          
          {nodeGlossaryTerms.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Key Terms
              </h3>
              <div className="space-y-3">
                {nodeGlossaryTerms.map((term) => {
                  const isKnown = knownTerms.includes(term.id);
                  
                  return (
                    <Card 
                      key={term.id}
                      className={`transition-all ${
                        isKnown 
                          ? 'border-green-200 bg-green-50/50' 
                          : 'cursor-pointer hover:shadow-md border-orange-200 bg-orange-50/20'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{term.term}</h4>
                            {isKnown && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          {!isKnown && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onTestKnowledge(term)}
                              className="ml-2 text-xs h-7"
                            >
                              <Brain className="h-3 w-3 mr-1" />
                              Test Knowledge
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {term.definition}
                        </p>
                        {isKnown && (
                          <Badge variant="secondary" className="text-xs">
                            Known
                          </Badge>
                        )}
                        {!isKnown && (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                            Study this term
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTermClick(term)}
                          className="mt-2 text-xs h-6 p-1"
                        >
                          View details
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          
          {node.connections.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Next Steps</h3>
              <p className="text-sm text-muted-foreground">
                This step connects to: {node.connections.length} other step{node.connections.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}