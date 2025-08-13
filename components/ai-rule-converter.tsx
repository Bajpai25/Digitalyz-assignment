"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Sparkles, CheckCircle, AlertCircle, Lightbulb, ArrowRight, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ParsedRule {
  type: "coRun" | "slotRestriction" | "loadLimit" | "phaseWindow" | "patternMatch" | "precedenceOverride"
  name: string
  description: string
  parameters: any
  confidence: number
  suggestions?: string[]
  warnings?: string[]
  aiEnhanced?: boolean
}

interface AIRuleConverterProps {
  dataSet: {
    clients: any[]
    workers: any[]
    tasks: any[]
  }
  onRuleCreated: (rule: ParsedRule) => void
  geminiApiKey?: string
}

export function AIRuleConverter({ dataSet, onRuleCreated, geminiApiKey }: AIRuleConverterProps) {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [progress, setProgress] = useState(0)
  const [parsedRule, setParsedRule] = useState<ParsedRule | null>(null)
  const [showExamples, setShowExamples] = useState(false)
  const [useGemini, setUseGemini] = useState(false)

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

  const callGeminiAPI = async (input: string): Promise<ParsedRule | null> => {
    if (!geminiApiKey) throw new Error("Gemini API key not configured")

    const dataContext = {
      taskIds: taskIds.slice(0, 20),
      clientGroups,
      workerGroups,
      skills: skills.slice(0, 20),
      sampleTasks: dataSet.tasks.slice(0, 5),
      sampleClients: dataSet.clients.slice(0, 3),
      sampleWorkers: dataSet.workers.slice(0, 3),
    }

    const prompt = `
You are an AI assistant specialized in converting natural language business rules into structured resource allocation configurations.

Available Data Context:
- Task IDs: ${taskIds.join(", ")}
- Client Groups: ${clientGroups.join(", ")}
- Worker Groups: ${workerGroups.join(", ")}
- Available Skills: ${skills.join(", ")}

Sample Data:
${JSON.stringify(dataContext, null, 2)}

User's Natural Language Rule: "${input}"

Please analyze this rule and return a JSON response with the following structure:
{
  "type": "coRun|slotRestriction|loadLimit|phaseWindow|patternMatch|precedenceOverride",
  "name": "Generated rule name",
  "description": "User's original input",
  "parameters": {
    // Rule-specific parameters based on type
  },
  "confidence": 0.0-1.0,
  "suggestions": ["Optional array of suggestions"],
  "warnings": ["Optional array of warnings"],
  "aiEnhanced": true
}

Rule Types and Parameters:
1. coRun: { tasks: ["T001", "T002"] }
2. slotRestriction: { groupType: "client|worker", groupName: "GroupName", minCommonSlots: number }
3. loadLimit: { workerGroup: "GroupName", maxSlotsPerPhase: number }
4. phaseWindow: { taskId: "T001", allowedPhases: "1,2,3" }
5. patternMatch: { pattern: "regex", field: "TaskID|TaskName", action: "prioritize|exclude|include|flag" }
6. precedenceOverride: { overrideType: "global|specific|priority|client|worker" }

Focus on:
- Extracting the correct rule type
- Identifying valid entities from the available data
- Providing high confidence scores for clear rules
- Adding warnings for ambiguous or invalid references
- Suggesting improvements or alternatives
`

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        apiKey: geminiApiKey,
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const responseText = data.response

    // Parse JSON from Gemini response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsedResponse = JSON.parse(jsonMatch[0])
        return {
          ...parsedResponse,
          aiEnhanced: true,
        }
      } catch (error) {
        console.error("Failed to parse Gemini JSON response:", error)
        return null
      }
    }

    return null
  }

  const parseNaturalLanguageRule = async (input: string): Promise<ParsedRule | null> => {
    const lowercaseInput = input.toLowerCase()

    // Step 1: Enhanced rule type identification with confidence scoring
    setProcessingStep("Analyzing rule type with AI...")
    setProgress(20)
    await new Promise((resolve) => setTimeout(resolve, 500))

    let ruleType: ParsedRule["type"] | null = null
    let confidence = 0

    // Enhanced rule type detection with weighted patterns
    const rulePatterns = [
      {
        type: "coRun" as const,
        patterns: [
          { regex: /(?:together|same phase|co-run|run with|simultaneously)/i, weight: 0.9 },
          { regex: /(?:must run|should run|need to run).*(?:together|with)/i, weight: 0.8 },
          { regex: /(?:link|connect|pair|group).*tasks/i, weight: 0.7 },
        ],
      },
      {
        type: "slotRestriction" as const,
        patterns: [
          { regex: /(?:limit|restrict|maximum|max).*(?:slot|shared)/i, weight: 0.85 },
          { regex: /(?:no more than|at most).*(?:slot|shared)/i, weight: 0.8 },
          { regex: /(?:cap|ceiling).*(?:slot|allocation)/i, weight: 0.75 },
        ],
      },
      {
        type: "loadLimit" as const,
        patterns: [
          { regex: /(?:limit|restrict|maximum|max).*(?:load|task|work)/i, weight: 0.85 },
          { regex: /(?:no more than|at most).*(?:task|work|load)/i, weight: 0.8 },
          { regex: /(?:capacity|workload).*(?:limit|restriction)/i, weight: 0.75 },
        ],
      },
      {
        type: "phaseWindow" as const,
        patterns: [
          { regex: /(?:only run in|can run in|restricted to).*phase/i, weight: 0.8 },
          { regex: /(?:phase|timing).*(?:window|constraint|restriction)/i, weight: 0.75 },
          { regex: /(?:during|in).*(?:phase|period|time)/i, weight: 0.7 },
        ],
      },
      {
        type: "patternMatch" as const,
        patterns: [
          { regex: /(?:starting with|ending with|containing|matching)/i, weight: 0.75 },
          { regex: /(?:pattern|regex|wildcard|template)/i, weight: 0.8 },
          { regex: /(?:all.*that|tasks.*like|names.*containing)/i, weight: 0.7 },
        ],
      },
      {
        type: "precedenceOverride" as const,
        patterns: [
          { regex: /(?:override|precedence|priority|hierarchy)/i, weight: 0.7 },
          { regex: /(?:takes precedence|overrides|supersedes)/i, weight: 0.8 },
          { regex: /(?:global|specific).*(?:rule|override)/i, weight: 0.75 },
        ],
      },
    ]

    // Find best matching rule type
    let bestMatch = { type: null as ParsedRule["type"] | null, confidence: 0 }

    rulePatterns.forEach(({ type, patterns }) => {
      let typeConfidence = 0
      patterns.forEach(({ regex, weight }) => {
        if (regex.test(input)) {
          typeConfidence = Math.max(typeConfidence, weight)
        }
      })

      if (typeConfidence > bestMatch.confidence) {
        bestMatch = { type, confidence: typeConfidence }
      }
    })

    ruleType = bestMatch.type
    confidence = bestMatch.confidence

    if (!ruleType) {
      return null
    }

    // Step 2: Enhanced entity extraction with context validation
    setProcessingStep("Extracting parameters with context validation...")
    setProgress(50)
    await new Promise((resolve) => setTimeout(resolve, 600))

    const parameters: any = {}
    const suggestions: string[] = []
    const warnings: string[] = []

    // Enhanced parameter extraction based on rule type
    switch (ruleType) {
      case "coRun":
        // Enhanced task ID extraction with validation
        const taskMatches = input.match(/T\d+/g) || []
        const taskNameMatches = input.match(/(?:task|tasks)\s+([A-Z]\w+(?:\s+\w+)*)/gi) || []

        const validTasks = taskMatches.filter((task) => taskIds.includes(task))
        const validTaskNames = taskNameMatches
          .map((match) => match.replace(/^tasks?\s+/i, ""))
          .filter((name) => dataSet.tasks.some((task) => task.TaskName?.toLowerCase().includes(name.toLowerCase())))

        if (validTasks.length >= 2) {
          parameters.tasks = validTasks
          confidence += 0.1
        } else if (validTaskNames.length >= 2) {
          parameters.taskNames = validTaskNames
          suggestions.push("Consider using specific Task IDs (e.g., T001, T002) for more precise matching")
          confidence += 0.05
        } else {
          warnings.push("Need at least 2 valid task identifiers for co-run rule")
          confidence -= 0.2
        }
        break

      case "slotRestriction":
        // Enhanced group and limit extraction
        const groupMatch =
          clientGroups.find((group) => lowercaseInput.includes(group.toLowerCase())) ||
          workerGroups.find((group) => lowercaseInput.includes(group.toLowerCase()))

        const limitPatterns = [
          /(?:maximum|max|limit|restrict.*to|no more than|at most)\s+(\d+)/i,
          /(\d+)\s+(?:slot|shared|maximum|max)/i,
        ]

        let limitMatch = null
        for (const pattern of limitPatterns) {
          limitMatch = input.match(pattern)
          if (limitMatch) break
        }

        if (groupMatch) {
          parameters.groupType = clientGroups.includes(groupMatch) ? "client" : "worker"
          parameters.groupName = groupMatch
          confidence += 0.1
        } else {
          suggestions.push(`Available groups: ${[...clientGroups, ...workerGroups].join(", ")}`)
        }

        if (limitMatch) {
          parameters.minCommonSlots = Number.parseInt(limitMatch[1])
          confidence += 0.1
        } else {
          warnings.push("Could not extract slot limit number")
          confidence -= 0.1
        }
        break

      case "loadLimit":
        // Enhanced worker group and load limit extraction
        const workerGroupMatch = workerGroups.find((group) => lowercaseInput.includes(group.toLowerCase()))

        const loadPatterns = [
          /(?:maximum|max|limit|no more than|at most)\s+(\d+)\s+(?:task|work|load)/i,
          /(\d+)\s+(?:task|work|load).*(?:maximum|max|limit)/i,
          /(?:exceed|more than)\s+(\d+)/i,
        ]

        let loadMatch = null
        for (const pattern of loadPatterns) {
          loadMatch = input.match(pattern)
          if (loadMatch) break
        }

        if (workerGroupMatch) {
          parameters.workerGroup = workerGroupMatch
          confidence += 0.1
        } else {
          warnings.push("Could not identify worker group")
          suggestions.push(`Available worker groups: ${workerGroups.join(", ")}`)
        }

        if (loadMatch) {
          parameters.maxSlotsPerPhase = Number.parseInt(loadMatch[1])
          confidence += 0.1
        } else {
          warnings.push("Could not extract load limit number")
        }
        break

      case "phaseWindow":
        // Enhanced task and phase extraction
        const taskMatch = input.match(/T\d+/)?.[0]
        const phasePatterns = [
          /(?:phase|phases)\s+([\d,\s]+(?:\s+(?:and|or)\s+\d+)*)/i,
          /(?:in|during)\s+(?:phase|phases)\s+([\d,\s-]+)/i,
          /(\d+(?:\s*[-,]\s*\d+)*)/g,
        ]

        let phaseMatches = null
        for (const pattern of phasePatterns) {
          phaseMatches = input.match(pattern)
          if (phaseMatches) break
        }

        if (taskMatch && taskIds.includes(taskMatch)) {
          parameters.taskId = taskMatch
          confidence += 0.1
        } else {
          warnings.push("Could not identify valid task ID")
          suggestions.push(`Available tasks: ${taskIds.slice(0, 5).join(", ")}`)
        }

        if (phaseMatches) {
          parameters.allowedPhases = phaseMatches[1] || phaseMatches[0]
          confidence += 0.1
        } else {
          warnings.push("Could not extract phase information")
        }
        break

      case "patternMatch":
        // Enhanced pattern and action extraction
        const patternMatches = [
          { pattern: /(?:starting with|begins with)\s+['"]([^'"]+)['"]/, field: "TaskID", prefix: true },
          { pattern: /(?:ending with|ends with)\s+['"]([^'"]+)['"]/, field: "TaskID", suffix: true },
          { pattern: /(?:containing|includes)\s+['"]([^'"]+)['"]/, field: "TaskName", contains: true },
          { pattern: /(?:matching|like)\s+['"]([^'"]+)['"]/, field: "TaskName", isPattern: true },
        ]

        for (const { pattern, field, prefix, suffix, contains } of patternMatches) {
          const match = input.match(pattern)
          if (match) {
            if (prefix) {
              parameters.pattern = `^${match[1]}.*`
            } else if (suffix) {
              parameters.pattern = `.*${match[1]}$`
            } else if (contains) {
              parameters.pattern = `.*${match[1]}.*`
            } else {
              parameters.pattern = match[1]
            }
            parameters.field = field
            confidence += 0.1
            break
          }
        }

        // Enhanced action detection
        const actionPatterns = [
          { pattern: /(?:prioritize|priority|urgent|important)/i, action: "prioritize" },
          { pattern: /(?:exclude|remove|skip|ignore)/i, action: "exclude" },
          { pattern: /(?:include|add|consider)/i, action: "include" },
          { pattern: /(?:flag|mark|highlight)/i, action: "flag" },
        ]

        for (const { pattern, action } of actionPatterns) {
          if (pattern.test(input)) {
            parameters.action = action
            confidence += 0.05
            break
          }
        }

        if (!parameters.action) {
          parameters.action = "include"
        }
        break

      case "precedenceOverride":
        // Enhanced override type detection
        const overridePatterns = [
          { pattern: /(?:global|all|every|universal)/i, type: "global" },
          { pattern: /(?:specific|particular|individual|certain)/i, type: "specific" },
          { pattern: /(?:high priority|critical|urgent)/i, type: "priority" },
          { pattern: /(?:client|customer)/i, type: "client" },
          { pattern: /(?:worker|resource|staff)/i, type: "worker" },
        ]

        for (const { pattern, type } of overridePatterns) {
          if (pattern.test(input)) {
            parameters.overrideType = type
            confidence += 0.05
            break
          }
        }

        if (!parameters.overrideType) {
          parameters.overrideType = "specific"
        }
        break
    }

    // Step 3: Enhanced context validation with data analysis
    setProcessingStep("Performing advanced context validation...")
    setProgress(80)
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Context-aware validation and suggestions
    if (ruleType === "coRun" && parameters.tasks?.length >= 2) {
      // Check if tasks have compatible phases
      const taskPhases = parameters.tasks.map((taskId: string) => {
        const task = dataSet.tasks.find((t) => t.TaskID === taskId)
        return task ? parseArrayField(task.PreferredPhases) : []
      })

      const commonPhases = taskPhases.reduce((common: any[], phases: string | any[]) => common.filter((phase: any) => phases.includes(phase)))

      if (commonPhases.length === 0) {
        warnings.push("Selected tasks have no overlapping preferred phases")
        suggestions.push("Consider adjusting task phase preferences for co-run feasibility")
      } else {
        suggestions.push(`Tasks can co-run in phases: ${commonPhases.join(", ")}`)
      }
    }

    // Step 4: Enhanced rule generation with smart naming
    setProcessingStep("Generating optimized rule configuration...")
    setProgress(100)
    await new Promise((resolve) => setTimeout(resolve, 300))

    const ruleName = generateEnhancedRuleName(ruleType, parameters, input)
    const description = input.trim()

    return {
      type: ruleType,
      name: ruleName,
      description,
      parameters,
      confidence: Math.max(0, Math.min(1, confidence)),
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      aiEnhanced: false,
    }
  }

  const generateEnhancedRuleName = (type: string, parameters: any, originalInput: string): string => {
    switch (type) {
      case "coRun":
        if (parameters.tasks?.length > 0) {
          return `Co-run ${parameters.tasks.slice(0, 3).join(" & ")}${parameters.tasks.length > 3 ? "..." : ""}`
        }
        return "Co-run Tasks"

      case "slotRestriction":
        const groupName = parameters.groupName || "Group"
        const limit = parameters.minCommonSlots || "X"
        return `${groupName} Slot Limit (${limit})`

      case "loadLimit":
        const workerGroup = parameters.workerGroup || "Workers"
        const maxLoad = parameters.maxSlotsPerPhase || "X"
        return `${workerGroup} Load Limit (${maxLoad})`

      case "phaseWindow":
        const taskId = parameters.taskId || "Task"
        const phases = parameters.allowedPhases || "X"
        return `${taskId} Phase Window (${phases})`

      case "patternMatch":
        const pattern = parameters.pattern || "Pattern"
        const action = parameters.action || "match"
        return `${action.charAt(0).toUpperCase() + action.slice(1)} Pattern: ${pattern}`

      case "precedenceOverride":
        const overrideType = parameters.overrideType || "specific"
        return `${overrideType.charAt(0).toUpperCase() + overrideType.slice(1)} Override Rule`

      default:
        return "Custom Rule"
    }
  }

  const parseArrayField = (field: any): any[] => {
    if (Array.isArray(field)) {
      return field
    }
    return field ? field.split(",").map((item: string) => item.trim()) : []
  }

  const handleProcessRule = async () => {
    if (!naturalLanguageInput.trim()) return

    setIsProcessing(true)
    setProgress(0)
    setParsedRule(null)

    try {
      let parsed: ParsedRule | null = null

      if (useGemini && geminiApiKey) {
        try {
          setProcessingStep("Connecting to Gemini AI...")
          setProgress(10)
          parsed = await callGeminiAPI(naturalLanguageInput)
        } catch (error) {
          console.error("Gemini API error:", error)
          // Fallback to local parsing
          parsed = await parseNaturalLanguageRule(naturalLanguageInput)
        }
      } else {
        parsed = await parseNaturalLanguageRule(naturalLanguageInput)
      }

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
          {geminiApiKey && (
            <Button
              variant={useGemini ? "default" : "outline"}
              size="sm"
              onClick={() => setUseGemini(!useGemini)}
              className="ml-auto"
            >
              <Zap className="w-3 h-3 mr-1" />
              {useGemini ? "Gemini ON" : "Gemini OFF"}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Describe your business rule in plain English, and AI will convert it to a structured configuration.{" "}
          {geminiApiKey && useGemini && "Enhanced with Gemini AI for better understanding."}
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
              {isProcessing ? (
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              ) : useGemini && geminiApiKey ? (
                <Zap className="w-4 h-4 mr-2" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? "Processing..." : useGemini && geminiApiKey ? "AI Convert" : "Convert to Rule"}
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
              {useGemini && geminiApiKey ? (
                <Zap className="w-4 h-4 animate-pulse text-purple-500" />
              ) : (
                <Sparkles className="w-4 h-4 animate-pulse" />
              )}
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
                {parsedRule.aiEnhanced && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Gemini Enhanced
                  </Badge>
                )}
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
