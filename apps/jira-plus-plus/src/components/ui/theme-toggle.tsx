import { Moon, SunMedium } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "../../providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex items-center gap-2"
    >
      {theme === "dark" ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"} mode</span>
    </Button>
  );
}
