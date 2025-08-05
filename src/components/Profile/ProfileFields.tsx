import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"

interface BaseFieldProps {
  label: string
  description?: string
  error?: string
  required?: boolean
  className?: string
}

interface InputFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "email" | "tel" | "url"
  disabled?: boolean
}

interface TextAreaFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
}

interface SelectFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
}

interface MultiSelectFieldProps extends BaseFieldProps {
  value: string[]
  onChange: (value: string[]) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  maxItems?: number
  disabled?: boolean
}

// Reusable field wrapper
const FieldWrapper: React.FC<{
  label: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}> = ({ label, description, error, required, children, className }) => (
  <div className={cn("space-y-2", className)}>
    <Label className="text-sm font-medium">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
    {children}
    {error && (
      <p className="text-xs text-destructive">{error}</p>
    )}
  </div>
)

// Input field component
export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, description, error, required, value, onChange, placeholder, type = "text", disabled, className, ...props }, ref) => (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Input
        ref={ref}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(error && "border-destructive")}
        {...props}
      />
    </FieldWrapper>
  )
)
InputField.displayName = "InputField"

// Textarea field component
export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, description, error, required, value, onChange, placeholder, rows = 3, disabled, className, ...props }, ref) => (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(error && "border-destructive")}
        {...props}
      />
    </FieldWrapper>
  )
)
TextAreaField.displayName = "TextAreaField"

// Select field component
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  description,
  error,
  required,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className
}) => (
  <FieldWrapper
    label={label}
    description={description}
    error={error}
    required={required}
    className={className}
  >
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn(error && "border-destructive")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </FieldWrapper>
)

// Multi-select field with badges
export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  description,
  error,
  required,
  value,
  onChange,
  options,
  placeholder,
  maxItems,
  disabled,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const addItem = (itemValue: string) => {
    if (!value.includes(itemValue) && (!maxItems || value.length < maxItems)) {
      onChange([...value, itemValue])
    }
  }
  
  const removeItem = (itemValue: string) => {
    onChange(value.filter(v => v !== itemValue))
  }
  
  const availableOptions = options.filter(option => !value.includes(option.value))
  
  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="space-y-2">
        {/* Selected items */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {value.map((itemValue) => {
              const option = options.find(opt => opt.value === itemValue)
              return (
                <Badge
                  key={itemValue}
                  variant="secondary"
                  className="gap-1"
                >
                  {option?.label || itemValue}
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeItem(itemValue)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              )
            })}
          </div>
        )}
        
        {/* Add new items */}
        {!disabled && availableOptions.length > 0 && (!maxItems || value.length < maxItems) && (
          <Select onValueChange={(itemValue) => { addItem(itemValue); setIsOpen(false) }}>
            <SelectTrigger className={cn("h-9", error && "border-destructive")}>
              <SelectValue placeholder={placeholder || "Auswählen..."} />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {maxItems && value.length >= maxItems && (
          <p className="text-xs text-muted-foreground">
            Maximum {maxItems} Elemente erreicht
          </p>
        )}
      </div>
    </FieldWrapper>
  )
}