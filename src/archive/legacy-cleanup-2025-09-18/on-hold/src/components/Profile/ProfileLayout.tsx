import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProfileLayoutProps {
  children: React.ReactNode
  className?: string
}

interface ProfileHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  actions?: React.ReactNode
  className?: string
}

interface ProfileSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

interface ProfileGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3
  className?: string
}

// Main layout wrapper for profile pages
export const ProfileLayout = React.forwardRef<HTMLDivElement, ProfileLayoutProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
ProfileLayout.displayName = "ProfileLayout"

// Header component with title, back button, and actions
export const ProfileHeader = React.forwardRef<HTMLElement, ProfileHeaderProps>(
  ({ title, subtitle, onBack, actions, className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10",
        className
      )}
      {...props}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" onClick={onBack} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-primary-foreground rotate-180" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
)
ProfileHeader.displayName = "ProfileHeader"

// Content wrapper with max-width and padding
export const ProfileContent = React.forwardRef<HTMLDivElement, ProfileLayoutProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
ProfileContent.displayName = "ProfileContent"

// Section component for organizing content
export const ProfileSection = React.forwardRef<HTMLDivElement, ProfileSectionProps>(
  ({ title, description, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-6", className)}
      {...props}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-xl font-semibold">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
)
ProfileSection.displayName = "ProfileSection"

// Grid layout for form fields
export const ProfileGrid = React.forwardRef<HTMLDivElement, ProfileGridProps>(
  ({ children, columns = 1, className, ...props }, ref) => {
    const gridClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-4",
          gridClasses[columns],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ProfileGrid.displayName = "ProfileGrid"