"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Search, Loader2 } from "lucide-react"

interface GeminiEnhancedSearchProps {
  data: any[]
  onSearch: (results: any[]) => void
  apiKey?: string
}

export function GeminiEnhancedSearch({ data, onSearch, apiKey }: GeminiEnhancedSearchProps) {
  const [query, setQuery] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastQuery, setLastQuery] = useState("")

  const processGeminiSearch = async () => {
    if (!query.trim() || !apiKey) return

    setIsProcessing(true)
    try {
      const prompt = `
You are a data analysis expert. Analyze the following query and return a JSON response with search criteria.

Query: "${query}"

Available data fields: ${Object.keys(data[0] || {}).join(", ")}

Sample data: ${JSON.stringify(data.slice(0, 2), null, 2)}

Return a JSON object with:
{
  "searchCriteria": [
    {
      "field": "fieldName",
      "operator": "equals|contains|greater|less|in",
      "value": "searchValue",
      "explanation": "why this criteria matches the query"
    }
  ],
  "explanation": "Natural language explanation of the search",
  "confidence": 0.95
}

Focus on understanding the intent and mapping to appropriate fields and operators.
      `

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, apiKey }),
      })

      if (response.ok) {
        const result = await response.json()
        try {
          const searchConfig = JSON.parse(result.text)

          // Apply search criteria to data
          const filteredData = data.filter((item) => {
            return searchConfig.searchCriteria.every((criteria: any) => {
              const fieldValue = item[criteria.field]

              switch (criteria.operator) {
                case "equals":
                  return fieldValue?.toString().toLowerCase() === criteria.value.toLowerCase()
                case "contains":
                  return fieldValue?.toString().toLowerCase().includes(criteria.value.toLowerCase())
                case "greater":
                  return Number.parseFloat(fieldValue) > Number.parseFloat(criteria.value)
                case "less":
                  return Number.parseFloat(fieldValue) < Number.parseFloat(criteria.value)
                case "in":
                  return (
                    Array.isArray(fieldValue) &&
                    fieldValue.some((v) => v.toString().toLowerCase().includes(criteria.value.toLowerCase()))
                  )
                default:
                  return false
              }
            })
          })

          onSearch(filteredData)
          setLastQuery(query)
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", parseError)
          // Fallback to basic search
          fallbackSearch()
        }
      } else {
        fallbackSearch()
      }
    } catch (error) {
      console.error("Gemini search error:", error)
      fallbackSearch()
    } finally {
      setIsProcessing(false)
    }
  }

  const fallbackSearch = () => {
    // Basic fallback search
    const filtered = data.filter((item) =>
      Object.values(item).some((value) => value?.toString().toLowerCase().includes(query.toLowerCase())),
    )
    onSearch(filtered)
    setLastQuery(query)
  }

  if (!apiKey) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Configure your Gemini API key to unlock enhanced AI search capabilities
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Gemini-Enhanced Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Describe what you're looking for in natural language..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={processGeminiSearch}
              disabled={!query.trim() || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isProcessing ? "Processing..." : "Search with AI"}
            </Button>
          </div>
        </div>

        {lastQuery && (
          <div className="pt-2 border-t">
            <Badge variant="secondary" className="mb-2">
              Last Search: {lastQuery}
            </Badge>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>
            Examples: "Find all high-priority tasks assigned to senior developers" or "Show clients with more than 5
            active projects"
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
