import { useFormContext, Controller, FieldValues, Path } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>
  label: string
  type?: "text" | "email" | "password" | "date" | "number" | "tel"
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FormField<T extends FieldValues>({
  name,
  label,
  type = "text",
  placeholder,
  required,
  disabled,
  className,
}: FormFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>()
  const error = errors[name]

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? "border-red-500 focus-visible:ring-red-500/30" : ""}
        {...register(name)}
      />
      {error && <p className="text-sm text-red-500">{error.message as string}</p>}
    </div>
  )
}

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>
  label: string
  placeholder?: string
  options: { value: string; label: string }[]
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  placeholder,
  options,
  required,
  disabled,
  className,
}: FormSelectProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<T>()
  const error = errors[name]

  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value || ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger className={error ? "border-red-500 ring-red-500/30" : ""}>
              <SelectValue placeholder={placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-sm text-red-500">{error.message as string}</p>}
    </div>
  )
}

interface FormTextareaProps<T extends FieldValues> {
  name: Path<T>
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  placeholder,
  required,
  disabled,
  rows = 3,
  className,
}: FormTextareaProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>()
  const error = errors[name]

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={error ? "border-red-500 focus-visible:ring-red-500/30" : ""}
        {...register(name)}
      />
      {error && <p className="text-sm text-red-500">{error.message as string}</p>}
    </div>
  )
}

interface FormCheckboxProps<T extends FieldValues> {
  name: Path<T>
  label: string
  disabled?: boolean
  className?: string
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  disabled,
  className,
}: FormCheckboxProps<T>) {
  const { register } = useFormContext<T>()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        type="checkbox"
        id={name}
        disabled={disabled}
        className="rounded border-gray-300"
        {...register(name)}
      />
      <Label htmlFor={name}>{label}</Label>
    </div>
  )
}
