import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BookOpen, Search, ChevronDown, ChevronUp, Brain, AlertCircle } from 'lucide-react';
import { GlossaryTerm, UserProfile, StudyCard } from '../types';

interface GlossaryBrowserProps {
  glossaryTerms: GlossaryTerm[];
  userProfile: UserProfile;
  onTermSelect: (term: GlossaryTerm) => void;
  selectedTerm: GlossaryTerm | null;
  currentStudyCard?: StudyCard | null;
  showTestingSection?: boolean;
  studyCardContent?: React.ReactNode;
  onTestKnowledge?: (term: GlossaryTerm) => void;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function GlossaryBrowser({ 
  glossaryTerms, 
  userProfile, 
  onTermSelect, 
  selectedTerm,
  currentStudyCard,
  showTestingSection = false,
  studyCardContent,
  onTestKnowledge,
  isExpanded,
  onExpandedChange
}: GlossaryBrowserProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(true);
  
  // Use external state if provided, otherwise use internal state
  const isCollapsed = isExpanded !== undefined ? !isExpanded : internalIsCollapsed;
  const setIsCollapsed = onExpandedChange 
    ? (collapsed: boolean) => onExpandedChange(!collapsed)
    : setInternalIsCollapsed;
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredTerms = glossaryTerms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || term.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardContent className="p-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4 py-4 border-b bg-secondary/5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-semibold">Glossary Browser and Knowledge Tests</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2"
            >
              {isCollapsed ? (
                <>
                  <span className="text-sm">Show</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="text-sm">Hide</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {!isCollapsed && (
            <div className="space-y-6 p-4">
              <div className="text-center">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Search and explore comprehensive home lending terminology, then test your knowledge
                </p>
              </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'general', 'legal', 'financial', 'process'].map((category) => (
                <Button
                  key={category}
                  variant={categoryFilter === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(category)}
                  className="text-xs"
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.slice(0, 12).map((term) => (
              <Card 
                key={term.id}
                className={`cursor-pointer transition-all hover:shadow-md max-w-full overflow-hidden ${
                  selectedTerm?.id === term.id ? 'border-primary' : ''
                } ${userProfile.knownTerms.includes(term.id) ? 'bg-green-50' : ''}`}
                onClick={() => onTermSelect(term)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm break-words pr-2">{term.term}</h3>
                    {userProfile.knownTerms.includes(term.id) && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">Known</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs mb-2 line-clamp-2 break-words leading-relaxed">
                    {term.definition}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {term.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTerms.length > 12 && (
            <div className="text-center text-sm text-muted-foreground">
              Showing 12 of {filteredTerms.length} terms
            </div>
          )}

          {/* Selected Term Detail */}
          {selectedTerm && (
            <Card className="border-2 border-primary max-w-full overflow-hidden">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 break-words">
                    <BookOpen className="w-5 h-5 flex-shrink-0" />
                    <span className="break-words">{selectedTerm.term}</span>
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedTerm.category}
                    </Badge>
                    {userProfile.knownTerms.includes(selectedTerm.id) && (
                      <Badge variant="secondary" className="text-xs">Known</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Definition:</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed break-words">
                    {selectedTerm.definition}
                  </p>
                </div>
                
                {selectedTerm.examples && selectedTerm.examples.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">Examples:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedTerm.examples.map((example, index) => (
                        <li key={index} className="text-muted-foreground text-sm break-words">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedTerm.relatedTerms.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">Related Terms:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.relatedTerms.slice(0, 5).map((relatedId) => {
                        const relatedTerm = glossaryTerms.find(t => t.id === relatedId);
                        return relatedTerm ? (
                          <Button
                            key={relatedId}
                            variant="outline"
                            size="sm"
                            onClick={() => onTermSelect(relatedTerm)}
                            className="text-xs h-7"
                          >
                            {relatedTerm.term}
                          </Button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                {onTestKnowledge && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => onTestKnowledge(selectedTerm)}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Test Your Knowledge
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Study Cards Section */}
          {showTestingSection && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-semibold">Test Your Knowledge</h3>
              </div>
              
              {studyCardContent ? (
                <div data-study-card-section>
                  {studyCardContent}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <AlertCircle className="w-12 h-12 text-muted-foreground" />
                    <div>
                      <h4 className="font-semibold mb-2">Select a Term to Test</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose a glossary term above and click "Test Your Knowledge" to start practicing
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
            )}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
  );
}