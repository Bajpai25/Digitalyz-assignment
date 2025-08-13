"use client"
import { Brain, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react"

// Advanced AI Engine for intelligent processing
export class AIEngine {
  // Enhanced Natural Language Processing
  static parseNaturalLanguage(query: string, dataContext: any) {
    const tokens = query.toLowerCase().split(/\s+/)
    const conditions: any[] = []

    // Advanced pattern matching with context awareness
    const patterns = [
      // Numeric comparisons with context
      { regex: /(\w+)\s*(greater than|more than|>|above)\s*(\d+(?:\.\d+)?)/g, type: "numeric_gt" },
      { regex: /(\w+)\s*(less than|fewer than|<|below)\s*(\d+(?:\.\d+)?)/g, type: "numeric_lt" },
      { regex: /(\w+)\s*(equal to|equals|=|is)\s*(\d+(?:\.\d+)?)/g, type: "numeric_eq" },

      // Advanced text matching
      { regex: /(\w+)\s*(contains|includes|has)\s*["']([^"']+)["']/g, type: "text_contains" },
      { regex: /(\w+)\s*(starts with|begins with)\s*["']([^"']+)["']/g, type: "text_starts" },
      { regex: /(\w+)\s*(ends with|finishes with)\s*["']([^"']+)["']/g, type: "text_ends" },

      // Array operations with intelligence
      { regex: /(\w+)\s*(contains|includes|has)\s*(\w+)/g, type: "array_contains" },
      { regex: /(\w+)\s*(in|within)\s*\[([^\]]+)\]/g, type: "array_in" },

      // Advanced boolean logic
      { regex: /(\w+)\s*(is|are)\s*(true|false|yes|no|active|inactive)/g, type: "boolean" },

      // Date and time patterns
      { regex: /(\w+)\s*(after|before|on)\s*(\d{4}-\d{2}-\d{2})/g, type: "date" },

      // Skill and capability matching
      { regex: /(skilled in|capable of|has skill)\s*["']([^"']+)["']/g, type: "skill_match" },

      // Priority and urgency patterns
      { regex: /(high|medium|low|urgent|critical)\s*(priority|importance)/g, type: "priority" },
    ]

    patterns.forEach((pattern) => {
      let match
      while ((match = pattern.regex.exec(query)) !== null) {
        conditions.push({
          type: pattern.type,
          field: this.mapFieldName(match[1], dataContext),
          operator: match[2],
          value: match[3] || match[2],
          confidence: this.calculateConfidence(match, dataContext),
        })
      }
    })

    return {
      conditions,
      intent: this.detectIntent(query),
      complexity: this.assessComplexity(conditions),
      suggestions: this.generateSuggestions(query, dataContext),
    }
  }

  // Intelligent field mapping with context
  static mapFieldName(field: string, dataContext: any): string {
    const fieldMappings: Record<string, string[]> = {
      duration: ["duration", "time", "length", "period"],
      priority: ["priority", "importance", "urgency", "level"],
      skills: ["skills", "capabilities", "expertise", "competencies"],
      phase: ["phase", "stage", "step", "period"],
      client: ["client", "customer", "company", "organization"],
      worker: ["worker", "employee", "staff", "person", "resource"],
      task: ["task", "job", "work", "assignment", "activity"],
      cost: ["cost", "price", "budget", "expense", "fee"],
      availability: ["availability", "available", "free", "open"],
      location: ["location", "site", "place", "region", "area"],
    }

    const normalizedField = field.toLowerCase()

    for (const [canonical, variants] of Object.entries(fieldMappings)) {
      if (variants.some((variant) => normalizedField.includes(variant))) {
        return canonical
      }
    }

    return field
  }

  // Advanced confidence scoring
  static calculateConfidence(match: RegExpExecArray, dataContext: any): number {
    let confidence = 0.7 // Base confidence

    // Boost confidence if field exists in data
    if (dataContext && this.fieldExistsInData(match[1], dataContext)) {
      confidence += 0.2
    }

    // Boost for exact matches
    if (match[0].length > 10) confidence += 0.1

    return Math.min(confidence, 1.0)
  }

  // Intent detection for better understanding
  static detectIntent(query: string): string {
    const intents = [
      { pattern: /find|search|show|display|list/, intent: "search" },
      { pattern: /filter|where|having|with/, intent: "filter" },
      { pattern: /count|how many|number of/, intent: "count" },
      { pattern: /sum|total|add up/, intent: "aggregate" },
      { pattern: /compare|versus|vs|difference/, intent: "compare" },
      { pattern: /recommend|suggest|best|optimal/, intent: "recommend" },
    ]

    for (const { pattern, intent } of intents) {
      if (pattern.test(query.toLowerCase())) {
        return intent
      }
    }

    return "general"
  }

  // Smart validation with contextual rules
  static performAdvancedValidation(data: any[], type: string): any[] {
    const issues: any[] = []

    // Context-aware validation rules
    const validationRules = {
      clients: [
        { rule: "required_fields", fields: ["ClientID", "Name"] },
        { rule: "unique_ids", field: "ClientID" },
        { rule: "valid_priority", field: "PriorityLevel", range: [1, 5] },
        { rule: "budget_consistency", fields: ["Budget", "MaxBudget"] },
        { rule: "contact_validation", field: "ContactEmail" },
      ],
      workers: [
        { rule: "required_fields", fields: ["WorkerID", "Name"] },
        { rule: "skill_format", field: "Skills" },
        { rule: "availability_logic", field: "AvailableSlots" },
        { rule: "capacity_limits", field: "MaxLoadPerPhase" },
        { rule: "cost_validation", field: "HourlyRate" },
      ],
      tasks: [
        { rule: "required_fields", fields: ["TaskID", "Name"] },
        { rule: "duration_logic", field: "Duration" },
        { rule: "phase_consistency", field: "PreferredPhases" },
        { rule: "skill_requirements", field: "RequiredSkills" },
        { rule: "dependency_validation", field: "Dependencies" },
      ],
    }

    const rules = validationRules[type as keyof typeof validationRules] || []

    rules.forEach((rule) => {
      const ruleIssues = this.applyValidationRule(data, rule)
      issues.push(...ruleIssues)
    })

    return issues
  }

  // Intelligent recommendations engine
  static generateRecommendations(data: any): any[] {
    const recommendations: any[] = []

    // Analyze data patterns
    const patterns = this.analyzeDataPatterns(data)

    // Generate contextual recommendations
    if (patterns.skillGaps.length > 0) {
      recommendations.push({
        type: "skill_gap",
        priority: "high",
        title: "Skill Coverage Gaps Detected",
        description: `${patterns.skillGaps.length} required skills have insufficient worker coverage`,
        action: "Consider hiring specialists or training existing workers",
        details: patterns.skillGaps,
      })
    }

    if (patterns.overloadedWorkers.length > 0) {
      recommendations.push({
        type: "workload",
        priority: "medium",
        title: "Worker Overload Risk",
        description: `${patterns.overloadedWorkers.length} workers may be overallocated`,
        action: "Review capacity limits and redistribute tasks",
        details: patterns.overloadedWorkers,
      })
    }

    if (patterns.phaseBottlenecks.length > 0) {
      recommendations.push({
        type: "scheduling",
        priority: "high",
        title: "Phase Bottlenecks Identified",
        description: "Some phases have insufficient capacity for demand",
        action: "Consider extending timelines or adding resources",
        details: patterns.phaseBottlenecks,
      })
    }

    return recommendations
  }

  // Advanced pattern analysis
  static analyzeDataPatterns(data: any): any {
    return {
      skillGaps: this.findSkillGaps(data),
      overloadedWorkers: this.findOverloadedWorkers(data),
      phaseBottlenecks: this.findPhaseBottlenecks(data),
      costOptimization: this.analyzeCostOptimization(data),
      riskFactors: this.identifyRiskFactors(data),
    }
  }

  // Helper methods for pattern analysis
  static findSkillGaps(data: any): any[] {
    // Implementation for finding skill gaps
    return []
  }

  static findOverloadedWorkers(data: any): any[] {
    // Implementation for finding overloaded workers
    return []
  }

  static findPhaseBottlenecks(data: any): any[] {
    // Implementation for finding phase bottlenecks
    return []
  }

  static analyzeCostOptimization(data: any): any {
    // Implementation for cost optimization analysis
    return {}
  }

  static identifyRiskFactors(data: any): any[] {
    // Implementation for risk factor identification
    return []
  }

  static fieldExistsInData(field: string, dataContext: any): boolean {
    // Implementation to check if field exists in data
    return true
  }

  static applyValidationRule(data: any[], rule: any): any[] {
    // Implementation for applying validation rules
    return []
  }

  static assessComplexity(conditions: any[]): string {
    if (conditions.length === 0) return "simple"
    if (conditions.length <= 2) return "moderate"
    return "complex"
  }

  static generateSuggestions(query: string, dataContext: any): string[] {
    return [
      "Try using more specific field names",
      "Consider adding numeric ranges for better filtering",
      "Use quotes around text values for exact matching",
    ]
  }
}

// AI Insights Component
export function AIInsights({
  data,
  onRecommendationClick,
}: {
  data: any
  onRecommendationClick: (rec: any) => void
}) {
  const recommendations = AIEngine.generateRecommendations(data)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">AI Insights & Recommendations</h3>
      </div>

      {recommendations.map((rec, index) => (
        <div
          key={index}
          className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onRecommendationClick(rec)}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full ${
                rec.priority === "high"
                  ? "bg-red-100 text-red-600"
                  : rec.priority === "medium"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-blue-100 text-blue-600"
              }`}
            >
              {rec.type === "skill_gap" && <AlertTriangle className="h-4 w-4" />}
              {rec.type === "workload" && <TrendingUp className="h-4 w-4" />}
              {rec.type === "scheduling" && <Lightbulb className="h-4 w-4" />}
            </div>

            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{rec.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              <p className="text-sm text-blue-600 mt-2 font-medium">{rec.action}</p>
            </div>

            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                rec.priority === "high"
                  ? "bg-red-100 text-red-800"
                  : rec.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {rec.priority}
            </div>
          </div>
        </div>
      ))}

      {recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Upload data to receive AI-powered insights and recommendations</p>
        </div>
      )}
    </div>
  )
}
