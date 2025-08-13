"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw, Zap, Brain } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ValidationResult {
  type: "error" | "warning" | "success"
  category: string
  message: string
  location?: string
  suggestion?: string
  severity?: "critical" | "high" | "medium" | "low"
}

interface ValidationPanelProps {
  dataSet: {
    clients: any[]
    workers: any[]
    tasks: any[]
  }
  validationResults: ValidationResult[]
  onValidationChange: (results: ValidationResult[]) => void
}

export function ValidationPanel({ dataSet, validationResults, onValidationChange }: ValidationPanelProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationProgress, setValidationProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")

  const parseArrayField = (field: any): any[] => {
    if (!field) return []
    if (Array.isArray(field)) return field
    if (typeof field === "string") {
      try {
        // Try parsing as JSON array
        if (field.startsWith("[") && field.endsWith("]")) {
          return JSON.parse(field)
        }
        // Try parsing as comma-separated values
        return field.split(",").map((item) => item.trim())
      } catch {
        return []
      }
    }
    return []
  }

  const parseJsonField = (field: any): any => {
    if (!field) return {}
    if (typeof field === "object") return field
    if (typeof field === "string") {
      try {
        return JSON.parse(field)
      } catch {
        return null
      }
    }
    return {}
  }

  const runValidation = async () => {
    setIsValidating(true)
    setValidationProgress(0)

    const results: ValidationResult[] = []

    const validationSteps = [
      "Checking required columns...",
      "Validating data types and formats...",
      "Checking for duplicate IDs...",
      "Validating value ranges...",
      "Checking JSON fields...",
      "Validating cross-references...",
      "Analyzing skill coverage...",
      "Checking worker capacity...",
      "Validating phase constraints...",
      "Running AI-powered insights...",
      "Finalizing results...",
    ]

    for (let i = 0; i < validationSteps.length; i++) {
      setCurrentStep(validationSteps[i])
      await new Promise((resolve) => setTimeout(resolve, 300))
      setValidationProgress(((i + 1) / validationSteps.length) * 100)

      // Run specific validations for each step
      switch (i) {
        case 0:
          validateRequiredColumns(results)
          break
        case 1:
          validateDataTypes(results)
          break
        case 2:
          validateDuplicateIds(results)
          break
        case 3:
          validateValueRanges(results)
          break
        case 4:
          validateJsonFields(results)
          break
        case 5:
          validateCrossReferences(results)
          break
        case 6:
          validateSkillCoverage(results)
          break
        case 7:
          validateWorkerCapacity(results)
          break
        case 8:
          validatePhaseConstraints(results)
          break
        case 9:
          generateAiInsights(results)
          break
      }
    }

    // Add success messages if no critical errors
    const criticalErrors = results.filter((r) => r.type === "error" && r.severity === "critical").length
    if (criticalErrors === 0) {
      results.unshift({
        type: "success",
        category: "Data Quality",
        message: "All critical validations passed successfully",
        severity: "low",
      })
    }

    onValidationChange(results)
    setIsValidating(false)
    setCurrentStep("")
  }

  // 1. Required Columns Validation
  const validateRequiredColumns = (results: ValidationResult[]) => {
    const requiredColumns = {
      clients: ["ClientID", "ClientName", "PriorityLevel"],
      workers: ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase"],
      tasks: ["TaskID", "TaskName", "Duration", "RequiredSkills"],
    }

    Object.entries(requiredColumns).forEach(([type, required]) => {
      const data = dataSet[type as keyof typeof dataSet]
      if (data.length > 0) {
        const columns = Object.keys(data[0])
        required.forEach((col) => {
          if (!columns.includes(col)) {
            results.push({
              type: "error",
              category: "Missing Columns",
              message: `Required column '${col}' is missing in ${type}`,
              location: type,
              suggestion: `Add the '${col}' column to your ${type} data`,
              severity: "critical",
            })
          }
        })
      }
    })
  }

  // 2. Data Types and Malformed Lists
  const validateDataTypes = (results: ValidationResult[]) => {
    // Validate AvailableSlots format
    dataSet.workers.forEach((worker, index) => {
      if (worker.AvailableSlots) {
        const slots = parseArrayField(worker.AvailableSlots)
        const invalidSlots = slots.filter((slot) => isNaN(Number(slot)) || Number(slot) < 1)
        if (invalidSlots.length > 0) {
          results.push({
            type: "error",
            category: "Malformed Data",
            message: `Invalid AvailableSlots format for worker ${worker.WorkerID || index}: ${invalidSlots.join(", ")}`,
            location: `workers[${index}]`,
            suggestion: "AvailableSlots should be numeric phase numbers (e.g., [1,2,3])",
            severity: "high",
          })
        }
      }
    })

    // Validate PreferredPhases format
    dataSet.tasks.forEach((task, index) => {
      if (task.PreferredPhases) {
        const phases = parseArrayField(task.PreferredPhases)
        const invalidPhases = phases.filter((phase) => isNaN(Number(phase)) || Number(phase) < 1)
        if (invalidPhases.length > 0) {
          results.push({
            type: "error",
            category: "Malformed Data",
            message: `Invalid PreferredPhases format for task ${task.TaskID || index}: ${invalidPhases.join(", ")}`,
            location: `tasks[${index}]`,
            suggestion: "PreferredPhases should be numeric phase numbers or ranges",
            severity: "high",
          })
        }
      }
    })
  }

  // 3. Duplicate IDs
  const validateDuplicateIds = (results: ValidationResult[]) => {
    const checkDuplicates = (data: any[], idField: string, type: string) => {
      const ids = data.map((row) => row[idField]).filter(Boolean)
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
      if (duplicates.length > 0) {
        results.push({
          type: "error",
          category: "Duplicate IDs",
          message: `Duplicate ${idField}s found in ${type}: ${[...new Set(duplicates)].join(", ")}`,
          location: type,
          suggestion: "Ensure all IDs are unique within each dataset",
          severity: "critical",
        })
      }
    }

    checkDuplicates(dataSet.clients, "ClientID", "clients")
    checkDuplicates(dataSet.workers, "WorkerID", "workers")
    checkDuplicates(dataSet.tasks, "TaskID", "tasks")
  }

  // 4. Value Range Validation
  const validateValueRanges = (results: ValidationResult[]) => {
    // Validate priority levels (1-5)
    dataSet.clients.forEach((client, index) => {
      const priority = Number.parseInt(client.PriorityLevel)
      if (isNaN(priority) || priority < 1 || priority > 5) {
        results.push({
          type: "error",
          category: "Invalid Range",
          message: `Invalid PriorityLevel '${client.PriorityLevel}' for client ${client.ClientID || index}`,
          location: `clients[${index}]`,
          suggestion: "PriorityLevel must be between 1 and 5",
          severity: "high",
        })
      }
    })

    // Validate task durations (≥1)
    dataSet.tasks.forEach((task, index) => {
      const duration = Number.parseInt(task.Duration)
      if (isNaN(duration) || duration < 1) {
        results.push({
          type: "error",
          category: "Invalid Range",
          message: `Invalid Duration '${task.Duration}' for task ${task.TaskID || index}`,
          location: `tasks[${index}]`,
          suggestion: "Duration must be a positive number (≥1)",
          severity: "high",
        })
      }
    })

    // Validate MaxLoadPerPhase
    dataSet.workers.forEach((worker, index) => {
      const maxLoad = Number.parseInt(worker.MaxLoadPerPhase)
      if (isNaN(maxLoad) || maxLoad < 1) {
        results.push({
          type: "error",
          category: "Invalid Range",
          message: `Invalid MaxLoadPerPhase '${worker.MaxLoadPerPhase}' for worker ${worker.WorkerID || index}`,
          location: `workers[${index}]`,
          suggestion: "MaxLoadPerPhase must be a positive number",
          severity: "high",
        })
      }
    })
  }

  // 5. JSON Field Validation
  const validateJsonFields = (results: ValidationResult[]) => {
    dataSet.clients.forEach((client, index) => {
      if (client.AttributesJSON) {
        const parsed = parseJsonField(client.AttributesJSON)
        if (parsed === null) {
          results.push({
            type: "error",
            category: "Broken JSON",
            message: `Invalid JSON in AttributesJSON for client ${client.ClientID || index}`,
            location: `clients[${index}]`,
            suggestion: "Ensure AttributesJSON contains valid JSON format",
            severity: "medium",
          })
        }
      }
    })
  }

  // 6. Cross-Reference Validation
  const validateCrossReferences = (results: ValidationResult[]) => {
    const taskIds = new Set(dataSet.tasks.map((task) => task.TaskID).filter(Boolean))

    // Check client requested task references
    dataSet.clients.forEach((client, index) => {
      if (client.RequestedTaskIDs) {
        const requestedIds = client.RequestedTaskIDs.split(",").map((id: string) => id.trim())
        requestedIds.forEach((taskId: string) => {
          if (taskId && !taskIds.has(taskId)) {
            results.push({
              type: "error",
              category: "Invalid Reference",
              message: `Client ${client.ClientID || index} references non-existent task '${taskId}'`,
              location: `clients[${index}]`,
              suggestion: `Ensure task '${taskId}' exists in the tasks dataset`,
              severity: "high",
            })
          }
        })
      }
    })
  }

  // 7. Skill Coverage Matrix
  const validateSkillCoverage = (results: ValidationResult[]) => {
    // Get all required skills from tasks
    const allRequiredSkills = new Set<string>()
    dataSet.tasks.forEach((task) => {
      if (task.RequiredSkills) {
        const skills = task.RequiredSkills.split(",").map((s: string) => s.trim())
        skills.forEach((skill) => allRequiredSkills.add(skill))
      }
    })

    // Get all available skills from workers
    const allAvailableSkills = new Set<string>()
    dataSet.workers.forEach((worker) => {
      if (worker.Skills) {
        const skills = worker.Skills.split(",").map((s: string) => s.trim())
        skills.forEach((skill) => allAvailableSkills.add(skill))
      }
    })

    // Check for uncovered skills
    const uncoveredSkills = [...allRequiredSkills].filter((skill) => !allAvailableSkills.has(skill))
    if (uncoveredSkills.length > 0) {
      results.push({
        type: "error",
        category: "Skill Coverage",
        message: `Required skills not covered by any worker: ${uncoveredSkills.join(", ")}`,
        suggestion: "Add workers with these skills or update task requirements",
        severity: "critical",
      })
    }
  }

  // 8. Worker Capacity Validation
  const validateWorkerCapacity = (results: ValidationResult[]) => {
    dataSet.workers.forEach((worker, index) => {
      const availableSlots = parseArrayField(worker.AvailableSlots)
      const maxLoad = Number.parseInt(worker.MaxLoadPerPhase) || 0

      if (availableSlots.length > 0 && maxLoad > 0) {
        // Check if worker can handle their max load across available phases
        const totalCapacity = availableSlots.length * maxLoad
        if (totalCapacity === 0) {
          results.push({
            type: "warning",
            category: "Worker Capacity",
            message: `Worker ${worker.WorkerID || index} has no effective capacity`,
            location: `workers[${index}]`,
            suggestion: "Ensure worker has both available slots and positive max load per phase",
            severity: "medium",
          })
        }
      }
    })
  }

  // 9. Phase Constraints Validation
  const validatePhaseConstraints = (results: ValidationResult[]) => {
    // Calculate phase-slot saturation
    const phaseCapacity: { [phase: number]: number } = {}
    const phaseDemand: { [phase: number]: number } = {}

    // Calculate total worker capacity per phase
    dataSet.workers.forEach((worker) => {
      const slots = parseArrayField(worker.AvailableSlots)
      const maxLoad = Number.parseInt(worker.MaxLoadPerPhase) || 0
      slots.forEach((phase) => {
        const phaseNum = Number(phase)
        if (!isNaN(phaseNum)) {
          phaseCapacity[phaseNum] = (phaseCapacity[phaseNum] || 0) + maxLoad
        }
      })
    })

    // Calculate demand per phase from tasks
    dataSet.tasks.forEach((task) => {
      const duration = Number.parseInt(task.Duration) || 0
      const preferredPhases = parseArrayField(task.PreferredPhases)
      if (preferredPhases.length > 0) {
        preferredPhases.forEach((phase) => {
          const phaseNum = Number(phase)
          if (!isNaN(phaseNum)) {
            phaseDemand[phaseNum] = (phaseDemand[phaseNum] || 0) + duration
          }
        })
      }
    })

    // Check for oversaturated phases
    Object.keys(phaseDemand).forEach((phase) => {
      const phaseNum = Number(phase)
      const demand = phaseDemand[phaseNum] || 0
      const capacity = phaseCapacity[phaseNum] || 0
      if (demand > capacity) {
        results.push({
          type: "warning",
          category: "Phase Saturation",
          message: `Phase ${phase} is oversaturated: demand (${demand}) exceeds capacity (${capacity})`,
          suggestion: "Consider redistributing tasks or adding more worker capacity for this phase",
          severity: "high",
        })
      }
    })
  }

  // 10. AI-Powered Insights
  const generateAiInsights = (results: ValidationResult[]) => {
    // Analyze workload distribution
    if (dataSet.workers.length > 0 && dataSet.tasks.length > 0) {
      const avgTasksPerWorker = dataSet.tasks.length / dataSet.workers.length
      if (avgTasksPerWorker > 5) {
        results.push({
          type: "warning",
          category: "AI Insights",
          message: `High task-to-worker ratio detected (${avgTasksPerWorker.toFixed(1)} tasks per worker)`,
          suggestion: "Consider adding more workers or reducing task scope",
          severity: "medium",
        })
      }
    }

    // Analyze skill distribution
    const skillFrequency: { [skill: string]: number } = {}
    dataSet.tasks.forEach((task) => {
      if (task.RequiredSkills) {
        const skills = task.RequiredSkills.split(",").map((s: string) => s.trim())
        skills.forEach((skill) => {
          skillFrequency[skill] = (skillFrequency[skill] || 0) + 1
        })
      }
    })

    const mostDemandedSkill = Object.entries(skillFrequency).sort(([, a], [, b]) => b - a)[0]
    if (mostDemandedSkill && mostDemandedSkill[1] > dataSet.tasks.length * 0.5) {
      results.push({
        type: "warning",
        category: "AI Insights",
        message: `Skill '${mostDemandedSkill[0]}' is required by ${mostDemandedSkill[1]} tasks (${((mostDemandedSkill[1] / dataSet.tasks.length) * 100).toFixed(0)}%)`,
        suggestion: "Ensure adequate workers with this critical skill are available",
        severity: "medium",
      })
    }

    // Priority distribution analysis
    const priorityDistribution: { [priority: number]: number } = {}
    dataSet.clients.forEach((client) => {
      const priority = Number.parseInt(client.PriorityLevel) || 0
      priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1
    })

    const highPriorityClients = (priorityDistribution[4] || 0) + (priorityDistribution[5] || 0)
    if (highPriorityClients > dataSet.clients.length * 0.7) {
      results.push({
        type: "warning",
        category: "AI Insights",
        message: `${highPriorityClients} clients (${((highPriorityClients / dataSet.clients.length) * 100).toFixed(0)}%) have high priority (4-5)`,
        suggestion: "Consider reviewing priority assignments to ensure proper resource allocation",
        severity: "low",
      })
    }
  }

  useEffect(() => {
    if (dataSet.clients.length > 0 || dataSet.workers.length > 0 || dataSet.tasks.length > 0) {
      runValidation()
    }
  }, [dataSet])

  const errorCount = validationResults.filter((r) => r.type === "error").length
  const warningCount = validationResults.filter((r) => r.type === "warning").length
  const successCount = validationResults.filter((r) => r.type === "success").length

  const criticalErrors = validationResults.filter((r) => r.type === "error" && r.severity === "critical")
  const highErrors = validationResults.filter((r) => r.type === "error" && r.severity === "high")
  const mediumIssues = validationResults.filter((r) => r.severity === "medium")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Validation Engine
        </CardTitle>
        <CardDescription>Comprehensive data validation with AI-powered insights and recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Controls */}
        <div className="flex items-center justify-between">
          <Button onClick={runValidation} disabled={isValidating} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? "animate-spin" : ""}`} />
            {isValidating ? "Validating..." : "Re-validate"}
          </Button>

          <div className="flex gap-2">
            {errorCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errorCount} errors
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {warningCount} warnings
              </Badge>
            )}
            {successCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200">
                <CheckCircle className="w-3 h-3" />
                {successCount} passed
              </Badge>
            )}
          </div>
        </div>

        {/* Validation Progress */}
        {isValidating && (
          <div className="space-y-2">
            <Progress value={validationProgress} className="h-2" />
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {currentStep}
            </p>
          </div>
        )}

        {/* Validation Results */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({validationResults.length})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({criticalErrors.length})</TabsTrigger>
            <TabsTrigger value="high">High ({highErrors.length})</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 max-h-96 overflow-y-auto">
            {validationResults.map((result, index) => (
              <ValidationResultCard key={index} result={result} />
            ))}
            {validationResults.length === 0 && !isValidating && <EmptyValidationState />}
          </TabsContent>

          <TabsContent value="critical" className="space-y-3 max-h-96 overflow-y-auto">
            {criticalErrors.map((result, index) => (
              <ValidationResultCard key={index} result={result} />
            ))}
            {criticalErrors.length === 0 && (
              <div className="text-center py-4 text-green-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">No critical errors found!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="high" className="space-y-3 max-h-96 overflow-y-auto">
            {highErrors.map((result, index) => (
              <ValidationResultCard key={index} result={result} />
            ))}
            {highErrors.length === 0 && (
              <div className="text-center py-4 text-green-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">No high-priority errors found!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-3 max-h-96 overflow-y-auto">
            {validationResults
              .filter((r) => r.category === "AI Insights")
              .map((result, index) => (
                <ValidationResultCard key={index} result={result} />
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function ValidationResultCard({ result }: { result: ValidationResult }) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50"
      case "high":
        return "border-orange-500 bg-orange-50"
      case "medium":
        return "border-yellow-500 bg-yellow-50"
      default:
        return ""
    }
  }

  return (
    <Alert
      variant={result.type === "error" ? "destructive" : "default"}
      className={`${
        result.type === "success"
          ? "border-green-200 bg-green-50"
          : result.type === "warning"
            ? "border-yellow-200 bg-yellow-50"
            : ""
      } ${getSeverityColor(result.severity)}`}
    >
      {result.type === "error" && <AlertCircle className="h-4 w-4" />}
      {result.type === "warning" && <AlertCircle className="h-4 w-4 text-yellow-600" />}
      {result.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
      <AlertDescription>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {result.category}
            </Badge>
            {result.location && (
              <Badge variant="secondary" className="text-xs">
                {result.location}
              </Badge>
            )}
            {result.severity && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  result.severity === "critical"
                    ? "border-red-500 text-red-700"
                    : result.severity === "high"
                      ? "border-orange-500 text-orange-700"
                      : "border-yellow-500 text-yellow-700"
                }`}
              >
                {result.severity}
              </Badge>
            )}
          </div>
          <p className="font-medium">{result.message}</p>
          {result.suggestion && (
            <p className="text-sm text-gray-600 italic flex items-start gap-1">
              <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {result.suggestion}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

function EmptyValidationState() {
  return (
    <div className="text-center py-8 text-gray-500">
      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="font-medium">No validation results yet</p>
      <p className="text-sm">Upload data to see comprehensive validation results</p>
    </div>
  )
}
