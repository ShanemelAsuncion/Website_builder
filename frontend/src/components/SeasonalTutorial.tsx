import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { X, Snowflake, Sun, ArrowUp, Sparkles } from "lucide-react";

interface SeasonalTutorialProps {
  season: "summer" | "winter";
  onSeasonToggle: () => void;
}

export function SeasonalTutorial({ season, onSeasonToggle }: SeasonalTutorialProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    const tutorialDismissed = localStorage.getItem("bladesnow-tutorial-dismissed");
    if (!tutorialDismissed && !hasBeenShown) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasBeenShown(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasBeenShown]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("bladesnow-tutorial-dismissed", "true");
  };

  const handleTryToggle = () => {
    onSeasonToggle();
  };

  const currentSeasonIcon = season === "summer" ? Sun : Snowflake;
  const otherSeasonIcon = season === "summer" ? Snowflake : Sun;
  const CurrentIcon = currentSeasonIcon;
  const OtherIcon = otherSeasonIcon;

  const gradientColors = season === "summer"
    ? "from-green-500/20 via-emerald-500/20 to-teal-500/20"
    : "from-blue-500/20 via-indigo-500/20 to-purple-500/20";

  const accentColor = season === "summer" ? "text-green-600" : "text-blue-600";
  const accentBg = season === "summer" ? "bg-green-500" : "bg-blue-500";

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Tutorial Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <Card className="border-0 shadow-2xl bg-background/95 backdrop-blur-xl overflow-hidden">
              {/* Header Gradient */}
              <div className={`h-2 bg-gradient-to-r ${gradientColors}`} />

              <CardContent className="p-8 space-y-6">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </Button>

                {/* Icon and Badge - Simplified animation */}
                <div className="text-center space-y-3">
                  <div className={`mx-auto w-16 h-16 ${accentBg} rounded-2xl flex items-center justify-center shadow-lg animate-pulse`}>
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>

                  <Badge variant="outline" className="mx-auto">
                    Welcome to BladeSnow Pro
                  </Badge>
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                  <h3 className="text-xl tracking-tight">
                    Discover Our Seasonal Design
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    This website transforms between summer
                    landscaping and winter snow removal themes.
                    Try the seasonal toggle to see our complete
                    service offerings!
                  </p>

                  {/* Toggle Demonstration */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Sun
                          className={`w-5 h-5 ${season === "summer" ? "text-green-500" : "text-muted-foreground"}`}
                        />
                        <span className="text-sm font-medium">
                          Summer
                        </span>
                      </div>

                      <motion.div
                        animate={{ x: [0, 5, -5, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                      >
                        <ArrowUp
                          className={`w-4 h-4 ${accentColor} rotate-45`}
                        />
                      </motion.div>

                      <div className="flex items-center space-x-2">
                        <Snowflake
                          className={`w-5 h-5 ${season === "winter" ? "text-blue-500" : "text-muted-foreground"}`}
                        />
                        <span className="text-sm font-medium">
                          Winter
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Look for the toggle in the top-right corner
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleTryToggle}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    <OtherIcon className="w-4 h-4 mr-2" />
                    Try {season === "summer" ? "Winter" : "Summer"} Mode
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                    className="w-full"
                  >
                    Continue Exploring
                  </Button>
                </div>

                {/* Current Season Indicator */}
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                    <CurrentIcon className={`w-4 h-4 ${accentColor}`} />
                    <span>Currently viewing {season} theme</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}