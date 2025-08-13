"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Search, Sparkles, X, Filter } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface SearchQuery {
  id: string
  query: string
  parsedConditions: ParsedCondition[]
  resultCount: number
}

interface ParsedCondition {
  field: string
  operator: string
  value: any
  type: "numeric" | "string" | "array" | "boolean"
}

interface NaturalLanguageSearchProps {
  dataSet: {
    clients: any[]
    workers: any[]
    tasks: any[]
  }
  onSearchResults: (results: any[], query: string, conditions: ParsedCondition[]) => void
  activeDataType: "clients" | "workers" | "tasks"
}

export function NaturalLanguageSearch({ dataSet, onSearchResults, activeDataType }: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchQuery[]>([])
  const [parsedQuery, setParsedQuery] = useState<ParsedCondition[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Sample queries for different data types
  const sampleQueries = {
    clients: [
      "All clients with priority level greater than 3",
      "Clients requesting task T001 or T002",
      "Enterprise clients with budget over 50000",
      "High priority clients in the Enterprise group",
    ],
    workers: [
      "Workers with Python and SQL skills",
      "Workers available in phases 1, 2, and 3",
      "Senior level workers with more than 2 max load per phase",
      "Data team workers with machine learning skills",
    ],
    tasks: [
      "Tasks with duration more than 2 phases",
      "Development tasks requiring JavaScript",
      "Tasks preferred in phase 2 with max concurrent less than 3",
      "Infrastructure tasks with duration of 1 phase",
    ],
  }

  const parseNaturalLanguage = (query: string): ParsedCondition[] => {
    const conditions: ParsedCondition[] = []
    const lowercaseQuery = query.toLowerCase()

    // Field mappings for natural language
    const fieldMappings: { [key: string]: { [key: string]: string } } = {
      clients: {
        "priority level": "PriorityLevel",
        priority: "PriorityLevel",
        "client name": "ClientName",
        name: "ClientName",
        group: "GroupTag",
        "group tag": "GroupTag",
        "requested tasks": "RequestedTaskIDs",
        tasks: "RequestedTaskIDs",
        budget: "AttributesJSON.budget",
      },
      workers: {
        skills: "Skills",
        skill: "Skills",
        "available slots": "AvailableSlots",
        slots: "AvailableSlots",
        phases: "AvailableSlots",
        "max load": "MaxLoadPerPhase",
        load: "MaxLoadPerPhase",
        "worker group": "WorkerGroup",
        group: "WorkerGroup",
        qualification: "QualificationLevel",
        level: "QualificationLevel",
        name: "WorkerName",
      },
      tasks: {
        duration: "Duration",
        "required skills": "RequiredSkills",
        skills: "RequiredSkills",
        "preferred phases": "PreferredPhases",
        phases: "PreferredPhases",
        "max concurrent": "MaxConcurrent",
        concurrent: "MaxConcurrent",
        category: "Category",
        name: "TaskName",
      },
    }

    // Operator mappings
    const operatorMappings: { [key: string]: string } = {
      "greater than": ">",
      "more than": ">",
      above: ">",
      over: ">",
      "less than": "<",
      below: "<",
      under: "<",
      "equal to": "=",
      equals: "=",
      is: "=",
      contains: "contains",
      includes: "contains",
      has: "contains",
      with: "contains",
      in: "in",
      not: "not",
    }

    // Parse numeric conditions
    const numericPatterns = [
      /(\w+(?:\s+\w+)*)\s+(greater than|more than|above|over)\s+(\d+)/g,
      /(\w+(?:\s+\w+)*)\s+(less than|below|under)\s+(\d+)/g,
      /(\w+(?:\s+\w+)*)\s+(equal to|equals|is)\s+(\d+)/g,
      /(\w+(?:\s+\w+)*)\s+(\d+)/g, // Simple numeric match
    ]

    numericPatterns.forEach((pattern) => {
      let match
      while ((match = pattern.exec(lowercaseQuery)) !== null) {
        const fieldName = match[1].trim()
        const operator = match[2] ? operatorMappings[match[2]] || "=" : "="
        const value = Number.parseInt(match[3] || match[2])

        const mappedField = fieldMappings[activeDataType]?.[fieldName]
        if (mappedField) {
          conditions.push({
            field: mappedField,
            operator,
            value,
            type: "numeric",
          })
        }
      }
    })

    // Parse string/array conditions
    const stringPatterns = [
      /(\w+(?:\s+\w+)*)\s+(contains|includes|has|with)\s+([^,\s]+(?:\s+[^,\s]+)*)/g,
      /(\w+(?:\s+\w+)*)\s+(requesting|requiring)\s+([^,\s]+(?:\s+[^,\s]+)*)/g,
    ]

    stringPatterns.forEach((pattern) => {
      let match
      while ((match = pattern.exec(lowercaseQuery)) !== null) {
        const fieldName = match[1].trim()
        const operator = "contains"
        const value = match[3].trim()

        const mappedField = fieldMappings[activeDataType]?.[fieldName]
        if (mappedField) {
          conditions.push({
            field: mappedField,
            operator,
            value,
            type: "string",
          })
        }
      }
    })

    // Parse list/array conditions (e.g., "in phases 1, 2, and 3")
    const arrayPatterns = [/in\s+(\w+(?:\s+\w+)*)\s+([\d,\s]+)/g, /(\w+(?:\s+\w+)*)\s+([\d,\s]+(?:\s+and\s+\d+)?)/g]

    arrayPatterns.forEach((pattern) => {
      let match
      while ((match = pattern.exec(lowercaseQuery)) !== null) {
        const fieldName = match[1]?.trim()
        const valueString = match[2].trim()
        const values = valueString
          .replace(/and/g, ",")
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v && !isNaN(Number(v)))
          .map(Number)

        if (fieldName && values.length > 0) {
          const mappedField = fieldMappings[activeDataType]?.[fieldName]
          if (mappedField) {
            conditions.push({
              field: mappedField,
              operator: "in",
              value: values,
              type: "array",
            })
          }
        }
      }
    })

    return conditions
  }

  const executeSearch = (conditions: ParsedCondition[]) => {
    const currentData = dataSet[activeDataType] || []

    const filteredResults = currentData.filter((item) => {
      return conditions.every((condition) => {
        const fieldValue = getNestedValue(item, condition.field)

        switch (condition.type) {
          case "numeric":
            const numValue = Number(fieldValue)
            switch (condition.operator) {
              case ">":
                return numValue > condition.value
              case "<":
                return numValue < condition.value
              case "=":
                return numValue === condition.value
              default:
                return false
            }

          case "string":
            const strValue = String(fieldValue || "").toLowerCase()
            const searchValue = String(condition.value).toLowerCase()
            switch (condition.operator) {
              case "contains":
                return strValue.includes(searchValue)
              default:
                return strValue === searchValue
            }

          case "array":
            if (condition.operator === "in") {
              const arrayValue = parseArrayField(fieldValue)
              return condition.value.some((val: any) => arrayValue.includes(val))
            }
            return false

          default:
            return true
        }
      })
    })

    return filteredResults
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => {
      if (current && typeof current === "object") {
        if (key.includes("JSON") && typeof current[key] === "string") {
          try {
            const parsed = JSON.parse(current[key])
            return parsed
          } catch {
            return current[key]
          }
        }
        return current[key]
      }
      return undefined
    }, obj)
  }

  const parseArrayField = (field: any): any[] => {
    if (!field) return []
    if (Array.isArray(field)) return field
    if (typeof field === "string") {
      try {
        if (field.startsWith("[") && field.endsWith("]")) {
          return JSON.parse(field)
        }
        return field.split(",").map((item) => item.trim())
      } catch {
        return []
      }
    }
    return []
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsProcessing(true)

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const conditions = parseNaturalLanguage(query)
    setParsedQuery(conditions)

    const results = executeSearch(conditions)

    // Add to search history
    const searchQuery: SearchQuery = {
      id: Date.now().toString(),
      query,
      parsedConditions: conditions,
      resultCount: results.length,
    }

    setSearchHistory((prev) => [searchQuery, ...prev.slice(0, 4)])
    onSearchResults(results, query, conditions)
    setIsProcessing(false)
  }

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery)
  }

  const clearSearch = () => {
    setQuery("")
    setParsedQuery([])
    onSearchResults(dataSet[activeDataType] || [], "", [])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Natural Language Search
        </CardTitle>
        <CardDescription>
          Search your data using plain English. Try queries like "workers with Python skills" or "tasks with duration
          more than 2"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Search Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                placeholder={`Ask about your ${activeDataType}... (e.g., "${sampleQueries[activeDataType][0]}")`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[60px] pr-12"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
              />
              {query && (
                <Button variant="ghost" size="sm" className="absolute right-2 top-2" onClick={clearSearch}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button onClick={handleSearch} disabled={!query.trim() || isProcessing} className="self-end">
              {isProcessing ? <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> : <Search className="w-4 h-4 mr-2" />}
              {isProcessing ? "Processing..." : "Search"}
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs">
            <Filter className="w-3 h-3 mr-1" />
            {showAdvanced ? "Hide" : "Show"} Advanced
          </Button>
        </div>

        {/* Sample Queries */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQueries[activeDataType].map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1 px-2 bg-transparent"
                onClick={() => handleSampleQuery(sample)}
              >
                {sample}
              </Button>
            ))}
          </div>
        </div>

        {/* Parsed Query Display */}
        {parsedQuery.length > 0 && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">AI understood your query as:</p>
                <div className="flex flex-wrap gap-2">
                  {parsedQuery.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {condition.field} {condition.operator}{" "}
                      {Array.isArray(condition.value) ? condition.value.join(", ") : condition.value}
                    </Badge>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Advanced Search Options */}
        {showAdvanced && (
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Advanced Search Syntax</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="font-medium mb-1">Numeric Comparisons:</p>
                <p className="text-gray-600">"priority greater than 3", "duration less than 2", "load equal to 5"</p>
              </div>
              <div>
                <p className="font-medium mb-1">Text/Skill Matching:</p>
                <p className="text-gray-600">
                  "skills contains Python", "workers with JavaScript", "name includes John"
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Array/List Operations:</p>
                <p className="text-gray-600">"available in phases 1, 2, 3", "preferred phases 2 and 4"</p>
              </div>
              <div>
                <p className="font-medium mb-1">Complex Queries:</p>
                <p className="text-gray-600">"Senior workers with Python skills available in phase 1"</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Recent Searches:</p>
            <div className="space-y-1">
              {searchHistory.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs cursor-pointer hover:bg-gray-100"
                  onClick={() => setQuery(search.query)}
                >
                  <span className="truncate flex-1">{search.query}</span>
                  <Badge variant="outline" className="ml-2">
                    {search.resultCount} results
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
