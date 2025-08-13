"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Sparkles, CheckCircle, AlertCircle, Lightbulb, ArrowRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ParsedRule {
  type: "coRun" | "slotRestriction" | "loadLimit" | "phaseWindow" | "patternMatch" | "precedenceOverride"
  name: string
  description: string
  parameters: any
  confidence: number
  suggestions?: string[]
  warnings?: string[]
}

interface AIRuleConverterProps {
  dataSet: {
    clients: any[]
    workers: any[]
    tasks: any[]
  }
  onRuleCreated: (rule: ParsedRule) => void
}

export function AIRuleConverter({ dataSet, onRuleCreated }: AIRuleConverterProps) {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [progress, setProgress] = useState(0)
  const [parsedRule, setParsedRule] = useState<ParsedRule | null>(null)
  const [showExamples, setShowExamples] = useState(false)

  // Extract data context for AI processing
  const taskIds = dataSet.tasks.map((task) => task.TaskID).filter(Boolean)
  const clientGroups = [...new Set(dataSet.clients.map((client) => client.GroupTag).filter(Boolean))]
  const workerGroups = [...new Set(dataSet.workers.map((worker) => worker.WorkerGroup).filter(Boolean))]
  const skills = [
    ...new Set(
      dataSet.tasks
        .flatMap((task) => (task.RequiredSkills ? task.RequiredSkills.split(",").map((s: string) => s.trim()) : []))
        .filter(Boolean),
    ),
  ]

  const exampleRules = [
    {
      text: "Tasks T001 and T003 must run together in the same phase",
      type: "Co-Run",
      explanation: "Creates a co-run rule linking specific tasks",
    },
    {
      text: "Limit Enterprise clients to maximum 3 shared slots per phase",
      type: "Slot Restriction",
      explanation: "Restricts slot usage for a client group",
    },
    {
      text: "DataTeam workers should not exceed 4 tasks per phase",
      type: "Load Limit",
      explanation: "Sets workload limits for a worker group",
    },
    {
      text: "Task T005 can only run in phases 1, 2, or 3",
      type: "Phase Window",
      explanation: "Restricts task to specific phases",
    },
    {
      text: "All tasks starting with 'CRIT' should be prioritized",
      type: "Pattern Match",
      explanation: "Applies rules based on naming patterns",
    },
    {
      text: "High priority client rules override worker load limits",
      type: "Precedence Override",
      explanation: "Defines rule hierarchy and precedence",
    },
  ]

  const parseNaturalLanguageRule = async (input: string): Promise<ParsedRule | null> => {
    const lowercaseInput = input.toLowerCase()

    // Step 1: Identify rule type
    setProcessingStep("Analyzing rule type...")
    setProgress(20)
    await new Promise((resolve) => setTimeout(resolve, 500))

    let ruleType: ParsedRule["type"] | null = null
    let confidence = 0

    // Rule type detection patterns
    if (
      lowercaseInput.includes("together") ||
      lowercaseInput.includes("same phase") ||
      lowercaseInput.includes("co-run") ||
      lowercaseInput.includes("run with")
    ) {
      ruleType = "coRun"
      confidence = 0.9
    } else if (
      lowercaseInput.includes("limit") ||
      lowercaseInput.includes("restrict") ||
      lowercaseInput.includes("maximum") ||
      lowercaseInput.includes("max")
    ) {
      if (lowercaseInput.includes("slot") || lowercaseInput.includes("shared")) {
        ruleType = "slotRestriction"
        confidence = 0.85
      } else if (lowercaseInput.includes("load") || lowercaseInput.includes("task")) {
        ruleType = "loadLimit"
        confidence = 0.85
      }
    } else if (
      lowercaseInput.includes("phase") ||
      lowercaseInput.includes("only run in") ||
      lowercaseInput.includes("can run in")
    ) {
      ruleType = "phaseWindow"
      confidence = 0.8
    } else if (
      lowercaseInput.includes("starting with") ||
      lowercaseInput.includes("ending with") ||
      lowercaseInput.includes("pattern") ||
      lowercaseInput.includes("matching")
    ) {
      ruleType = "patternMatch"
      confidence = 0.75
    } else if (
      lowercaseInput.includes("override") ||
      lowercaseInput.includes("priority") ||
      lowercaseInput.includes("precedence")
    ) {
      ruleType = "precedenceOverride"
      confidence = 0.7
    }

    if (!ruleType) {
      return null
    }

    // Step 2: Extract entities and parameters
    setProcessingStep("Extracting rule parameters...")
    setProgress(50)
    await new Promise((resolve) => setTimeout(resolve, 600))

    const parameters: any = {}
    const suggestions: string[] = []
    const warnings: string[] = []

    switch (ruleType) {
      case "coRun":
        // Extract task IDs
        const taskMatches = input.match(/T\d+/g) || []
        const validTasks = taskMatches.filter((task) => taskIds.includes(task))
        if (validTasks.length >= 2) {
          parameters.tasks = validTasks
          confidence += 0.1
        } else {
          warnings.push("Need at least 2 valid task IDs for co-run rule")
          confidence -= 0.2
        }
        break

      case "slotRestriction":
        // Extract group and limit
        const groupMatch = clientGroups.find((group) => lowercaseInput.includes(group.toLowerCase()))
        const limitMatch = input.match(/(\d+)\s*(slot|shared)/i)
        if (groupMatch) {
          parameters.groupType = "client"
          parameters.groupName = groupMatch
          confidence += 0.1
        }
        if (limitMatch) {
          parameters.minCommonSlots = Number.parseInt(limitMatch[1])
          confidence += 0.1
        } else {
          warnings.push("Could not extract slot limit number")
        }
        break

      case "loadLimit":
        // Extract worker group and load limit
        const workerGroupMatch = workerGroups.find((group) => lowercaseInput.includes(group.toLowerCase()))
        const loadMatch = input.match(/(\d+)\s*(task|load)/i)
        if (workerGroupMatch) {
          parameters.workerGroup = workerGroupMatch
          confidence += 0.1
        } else {
          warnings.push("Could not identify worker group")
        }
        if (loadMatch) {
          parameters.maxSlotsPerPhase = Number.parseInt(loadMatch[1])
          confidence += 0.1
        }
        break

      case "phaseWindow":
        // Extract task and phases
        const taskMatch = input.match(/T\d+/)?.[0]
        const phaseMatches = input.match(/(\d+(?:\s*,\s*\d+)*|\d+\s*-\s*\d+)/g)
        if (taskMatch && taskIds.includes(taskMatch)) {
          parameters.taskId = taskMatch
          confidence += 0.1
        }
        if (phaseMatches) {
          parameters.allowedPhases = phaseMatches[0]
          confidence += 0.1
        }
        break

      case "patternMatch":
        // Extract pattern and action
        const patternMatches = [
          { pattern: /starting with ['"]([^'"]+)['"]/, field: "TaskID" },
          { pattern: /ending with ['"]([^'"]+)['"]/, field: "TaskID" },
          { pattern: /containing ['"]([^'"]+)['"]/, field: "TaskName" },
        ]

        for (const { pattern, field } of patternMatches) {
          const match = input.match(pattern)
          if (match) {
            parameters.pattern = `^${match[1]}.*` // Convert to regex
            parameters.field = field
            confidence += 0.1
            break
          }
        }

        if (lowercaseInput.includes("prioritize")) {
          parameters.action = "prioritize"
        } else if (lowercaseInput.includes("exclude")) {
          parameters.action = "exclude"
        } else {
          parameters.action = "include"
        }
        break

      case "precedenceOverride":
        // Extract override type
        if (lowercaseInput.includes("global") || lowercaseInput.includes("all")) {
          parameters.overrideType = "global"
        } else {
          parameters.overrideType = "specific"
        }
        confidence += 0.05
        break
    }

    // Step 3: Validate against data context
    setProcessingStep("Validating against data context...")
    setProgress(80)
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Add context-aware suggestions
    if (ruleType === "coRun" && parameters.tasks?.length < 2) {
      suggestions.push(`Available tasks: ${taskIds.slice(0, 5).join(", ")}${taskIds.length > 5 ? "..." : ""}`)
    }

    if (ruleType === "loadLimit" && !parameters.workerGroup) {
      suggestions.push(`Available worker groups: ${workerGroups.join(", ")}`)
    }

    // Step 4: Generate rule name and description
    setProcessingStep("Generating rule configuration...")
    setProgress(100)
    await new Promise((resolve) => setTimeout(resolve, 300))

    const ruleName = generateRuleName(ruleType, parameters, input)
    const description = input.trim()

    return {
      type: ruleType,
      name: ruleName,
      description,
      parameters,
      confidence: Math.max(0, Math.min(1, confidence)),
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  const generateRuleName = (type: string, parameters: any, originalInput: string): string => {
    switch (type) {
      case "coRun":
        return `Co-run ${parameters.tasks?.join(" & ") || "Tasks"}`
      case "slotRestriction":
        return `Limit ${parameters.groupName || "Group"} Slots`
      case "loadLimit":
        return `${parameters.workerGroup || "Worker"} Load Limit`
      case "phaseWindow":
        return `${parameters.taskId || "Task"} Phase Window`
      case "patternMatch":
        return `Pattern Rule: ${parameters.pattern || "Match"}`
      case "precedenceOverride":
        return `${parameters.overrideType === "global" ? "Global" : "Specific"} Override`
      default:
        return "Custom Rule"
    }
  }

  const handleProcessRule = async () => {
    if (!naturalLanguageInput.trim()) return

    setIsProcessing(true)
    setProgress(0)
    setParsedRule(null)

    try {
      const parsed = await parseNaturalLanguageRule(naturalLanguageInput)
      setParsedRule(parsed)
    } catch (error) {
      console.error("Error parsing rule:", error)
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setProcessingStep("")
    }
  }

  const handleCreateRule = () => {
    if (parsedRule) {
      onRuleCreated(parsedRule)
      setNaturalLanguageInput("")
      setParsedRule(null)
    }
  }

  const handleTryExample = (example: string) => {
    setNaturalLanguageInput(example)
    setParsedRule(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Rule Converter
        </CardTitle>
        <CardDescription>
          Describe your business rule in plain English, and AI will convert it to a structured configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Natural Language Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Describe your rule in plain English:</label>
            <Button variant="outline" size="sm" onClick={() => setShowExamples(!showExamples)}>
              <Lightbulb className="w-4 h-4 mr-1" />
              {showExamples ? "Hide" : "Show"} Examples
            </Button>
          </div>

          <Textarea
            placeholder="e.g., 'Tasks T001 and T003 must run together in the same phase' or 'DataTeam workers should not exceed 4 tasks per phase'"
            value={naturalLanguageInput}
            onChange={(e) => setNaturalLanguageInput(e.target.value)}
            className="min-h-[100px]"
          />

          <div className="flex gap-2">
            <Button onClick={handleProcessRule} disabled={!naturalLanguageInput.trim() || isProcessing}>
              {isProcessing ? <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> : <Brain className="w-4 h-4 mr-2" />}
              {isProcessing ? "Processing..." : "Convert to Rule"}
            </Button>
            {naturalLanguageInput && (
              <Button variant="outline" onClick={() => setNaturalLanguageInput("")}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              {processingStep}
            </p>
          </div>
        )}

        {/* Example Rules */}
        {showExamples && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Example Rules</CardTitle>
              <CardDescription className="text-xs">Click any example to try it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {exampleRules.map((example, index) => (
                <div
                  key={index}
                  className="p-3 bg-white rounded-lg border cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => handleTryExample(example.text)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">
                      {example.type}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{example.text}</p>
                  <p className="text-xs text-gray-600">{example.explanation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Parsed Rule Display */}
        {parsedRule && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                AI Parsed Rule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rule Overview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{parsedRule.type}</Badge>
                  <Badge
                    variant="outline"
                    className={
                      parsedRule.confidence > 0.8
                        ? "border-green-500 text-green-700"
                        : parsedRule.confidence > 0.6
                          ? "border-yellow-500 text-yellow-700"
                          : "border-red-500 text-red-700"
                    }
                  >
                    {Math.round(parsedRule.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="font-medium">{parsedRule.name}</p>
                <p className="text-sm text-gray-600">{parsedRule.description}</p>
              </div>

              {/* Parameters */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Extracted Parameters:</p>
                <div className="bg-white p-3 rounded border">
                  <pre className="text-xs text-gray-700">{JSON.stringify(parsedRule.parameters, null, 2)}</pre>
                </div>
              </div>

              {/* Warnings */}
              {parsedRule.warnings && parsedRule.warnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Issues found:</p>
                      {parsedRule.warnings.map((warning, index) => (
                        <p key={index} className="text-sm">
                          • {warning}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Suggestions */}
              {parsedRule.suggestions && parsedRule.suggestions.length > 0 && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Suggestions:</p>
                      {parsedRule.suggestions.map((suggestion, index) => (
                        <p key={index} className="text-sm">
                          • {suggestion}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCreateRule}
                  disabled={parsedRule.confidence < 0.5 || (parsedRule.warnings && parsedRule.warnings.length > 0)}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Create Rule
                </Button>
                <Button variant="outline" onClick={() => setParsedRule(null)}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Context Info */}
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Available Data Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <span className="font-medium">Tasks:</span> {taskIds.slice(0, 8).join(", ")}
              {taskIds.length > 8 && ` (+${taskIds.length - 8} more)`}
            </div>
            <div>
              <span className="font-medium">Client Groups:</span> {clientGroups.join(", ") || "None"}
            </div>
            <div>
              <span className="font-medium">Worker Groups:</span> {workerGroups.join(", ") || "None"}
            </div>
            <div>
              <span className="font-medium">Skills:</span> {skills.slice(0, 6).join(", ")}
              {skills.length > 6 && ` (+${skills.length - 6} more)`}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
