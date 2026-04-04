import { ArrowLeft, HelpCircle, UtensilsCrossed } from "lucide-react";

type Props = {
  onShowInstructions?: () => void;
};

export default function Navigation({ onShowInstructions }: Props) {
  return (
    <nav className="bg-background border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
            <UtensilsCrossed className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="text-sm md:text-xl font-bold text-primary truncate">
              <span className="hidden sm:inline">Recipe Explorer - Cooking Journey</span>
              <span className="sm:hidden">Recipe Explorer</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            {onShowInstructions && (
              <button
                onClick={onShowInstructions}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">How to Use</span>
                <span className="sm:hidden">Help</span>
              </button>
            )}
            <a
              href="/"
              className="flex items-center space-x-1 md:space-x-2 px-3 py-2 text-sm rounded-md bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Back to Portfolio</span>
              <span className="sm:hidden">Back</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
