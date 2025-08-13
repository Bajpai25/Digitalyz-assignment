"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Search, Sparkles, X, Filter, Zap } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface SearchQuery {
  id: string
  query: string
  parsedConditions: ParsedCondition[]
  resultCount: number
  aiEnhanced?: boolean
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
  geminiApiKey?: string
  headerMappings?: {
    clients: { [originalField: string]: string }
    workers: { [originalField: string]: string }
    tasks: { [originalField: string]: string }
  }
}

export function NaturalLanguageSearch({
  dataSet,
  onSearchResults,
  activeDataType,
  geminiApiKey,
  headerMappings,
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchQuery[]>([])
  const [parsedQuery, setParsedQuery] = useState<ParsedCondition[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [useGemini, setUseGemini] = useState(false)

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

    const universalFieldMappings: { [key: string]: { [key: string]: string } } = {
      clients: {
        "priority level": "PriorityLevel",
        prioritylevel: "PriorityLevel",
        priority: "PriorityLevel",
        importance: "PriorityLevel",
        "client name": "ClientName",
        clientname: "ClientName",
        name: "ClientName",
        company: "ClientName",
        organization: "ClientName",
        "client id": "ClientID",
        clientid: "ClientID",
        id: "ClientID",
        group: "GroupTag",
        "group tag": "GroupTag",
        grouptag: "GroupTag",
        category: "GroupTag",
        team: "GroupTag",
        "requested tasks": "RequestedTaskIDs",
        requestedtasks: "RequestedTaskIDs",
        tasks: "RequestedTaskIDs",
        requirements: "RequestedTaskIDs",
        budget: "AttributesJSON.budget",
        cost: "AttributesJSON.budget",
        spending: "AttributesJSON.budget",
        price: "AttributesJSON.budget",
        location: "AttributesJSON.location",
        city: "AttributesJSON.location",
        region: "AttributesJSON.location",
        vip: "AttributesJSON.vip",
        premium: "AttributesJSON.vip",
        important: "AttributesJSON.vip",
        sla: "AttributesJSON.sla",
        "service level": "AttributesJSON.sla",
      },
      workers: {
        skills: "Skills",
        skill: "Skills",
        expertise: "Skills",
        capabilities: "Skills",
        competencies: "Skills",
        technologies: "Skills",
        "available slots": "AvailableSlots",
        availableslots: "AvailableSlots",
        slots: "AvailableSlots",
        availability: "AvailableSlots",
        phases: "AvailableSlots",
        "max load": "MaxLoadPerPhase",
        maxload: "MaxLoadPerPhase",
        load: "MaxLoadPerPhase",
        capacity: "MaxLoadPerPhase",
        workload: "MaxLoadPerPhase",
        "worker group": "WorkerGroup",
        workergroup: "WorkerGroup",
        group: "WorkerGroup",
        team: "WorkerGroup",
        department: "WorkerGroup",
        qualification: "QualificationLevel",
        level: "QualificationLevel",
        experience: "QualificationLevel",
        seniority: "QualificationLevel",
        rank: "QualificationLevel",
        "worker name": "WorkerName",
        workername: "WorkerName",
        name: "WorkerName",
        employee: "WorkerName",
        "worker id": "WorkerID",
        workerid: "WorkerID",
        id: "WorkerID",
        employeeid: "WorkerID",
      },
      tasks: {
        duration: "Duration",
        length: "Duration",
        time: "Duration",
        period: "Duration",
        timeframe: "Duration",
        "required skills": "RequiredSkills",
        requiredskills: "RequiredSkills",
        skills: "RequiredSkills",
        requirements: "RequiredSkills",
        needs: "RequiredSkills",
        technologies: "RequiredSkills",
        "preferred phases": "PreferredPhases",
        preferredphases: "PreferredPhases",
        phases: "PreferredPhases",
        timing: "PreferredPhases",
        schedule: "PreferredPhases",
        when: "PreferredPhases",
        "max concurrent": "MaxConcurrent",
        maxconcurrent: "MaxConcurrent",
        concurrent: "MaxConcurrent",
        parallel: "MaxConcurrent",
        simultaneous: "MaxConcurrent",
        category: "Category",
        type: "Category",
        kind: "Category",
        classification: "Category",
        "task name": "TaskName",
        taskname: "TaskName",
        name: "TaskName",
        title: "TaskName",
        description: "TaskName",
        "task id": "TaskID",
        taskid: "TaskID",
        id: "TaskID",
        priority: "Priority",
        importance: "Priority",
        urgency: "Priority",
        criticality: "Priority",
      },
    }

    const operatorMappings: { [key: string]: string } = {
      "greater than": ">",
      "more than": ">",
      "higher than": ">",
      above: ">",
      over: ">",
      exceeds: ">",
      beyond: ">",
      "less than": "<",
      "fewer than": "<",
      "lower than": "<",
      below: "<",
      under: "<",
      within: "<",
      "equal to": "=",
      equals: "=",
      is: "=",
      matches: "=",
      exactly: "=",
      "same as": "=",
      "greater than or equal": ">=",
      "at least": ">=",
      minimum: ">=",
      min: ">=",
      "less than or equal": "<=",
      "at most": "<=",
      maximum: "<=",
      max: "<=",
      contains: "contains",
      includes: "contains",
      has: "contains",
      with: "contains",
      featuring: "contains",
      having: "contains",
      in: "in",
      among: "in",
      inside: "in",
      not: "not",
      excluding: "not",
      without: "not",
      except: "not",
      "starts with": "startswith",
      "begins with": "startswith",
      starting: "startswith",
      "ends with": "endswith",
      ending: "endswith",
      concludes: "endswith",
    }

    console.log("Parsing universal query:", lowercaseQuery)

    const numericPatterns = [
      // Primary pattern: "priority level greater than 3"
      /(?:all\s+)?(?:\w+\s+)?(?:with\s+)?([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(greater than|more than|higher than|above|over|exceeds|beyond|less than|fewer than|lower than|below|under|within|equal to|equals|is|matches|exactly|same as|at least|minimum|min|at most|maximum|max|greater than or equal|less than or equal)\s+(\d+(?:\.\d+)?)/gi,
      // Secondary pattern: "duration of 2" or "priority 4"
      /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(?:of\s+)?(\d+(?:\.\d+)?)/gi,
      // Tertiary pattern: "level 3 clients" or "phase 2 tasks"
      /(?:level|phase|priority|duration)\s+(\d+(?:\.\d+)?)\s+(\w+)/gi,
    ]

    numericPatterns.forEach((pattern, patternIndex) => {
      let match
      while ((match = pattern.exec(lowercaseQuery)) !== null) {
        console.log(`Numeric Pattern ${patternIndex} matched:`, match)

        let fieldName, operator, value

        if (patternIndex === 0 && match.length >= 4) {
          fieldName = match[1].trim()
          operator = operatorMappings[match[2].trim()] || "="
          value = Number.parseFloat(match[3])
        } else if (patternIndex === 1 && match.length >= 3) {
          fieldName = match[1].trim()
          operator = "="
          value = Number.parseFloat(match[2])
        } else if (patternIndex === 2 && match.length >= 3) {
          fieldName = match[0].split(" ")[0] // "level", "phase", etc.
          operator = "="
          value = Number.parseFloat(match[1])
        } else {
          continue
        }

        console.log(`Extracted: fieldName="${fieldName}", operator="${operator}", value=${value}`)

        let mappedField =
          universalFieldMappings[activeDataType]?.[fieldName] ||
          universalFieldMappings[activeDataType]?.[fieldName.replace(/\s+/g, "")] ||
          universalFieldMappings[activeDataType]?.[fieldName.replace(/\s+/g, "").toLowerCase()]

        if (!mappedField) {
          // Universal fallback mappings
          const universalMappings: { [key: string]: string } = {
            priority: "PriorityLevel",
            level: "PriorityLevel",
            importance: "PriorityLevel",
            name:
              activeDataType === "clients" ? "ClientName" : activeDataType === "workers" ? "WorkerName" : "TaskName",
            id: activeDataType === "clients" ? "ClientID" : activeDataType === "workers" ? "WorkerID" : "TaskID",
            duration: "Duration",
            time: "Duration",
            length: "Duration",
            skills: activeDataType === "workers" ? "Skills" : "RequiredSkills",
            group: activeDataType === "clients" ? "GroupTag" : "WorkerGroup",
            phases: activeDataType === "workers" ? "AvailableSlots" : "PreferredPhases",
            load: "MaxLoadPerPhase",
            capacity: "MaxLoadPerPhase",
            concurrent: "MaxConcurrent",
            parallel: "MaxConcurrent",
            category: "Category",
            type: "Category",
            qualification: "QualificationLevel",
            experience: "QualificationLevel",
          }
          mappedField = universalMappings[fieldName] || universalMappings[fieldName.split(" ").pop() || ""]
        }

        console.log(`Mapped field: ${fieldName} -> ${mappedField}`)

        if (mappedField && !isNaN(value)) {
          conditions.push({
            field: mappedField,
            operator: operator ?? "=",
            value,
            type: "numeric",
          })
          console.log(`Added numeric condition:`, { field: mappedField, operator, value, type: "numeric" })
          break
        }
      }
    })

    const stringPatterns = [
      // "skills contains Python" or "name includes John"
      /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(contains|includes|has|with|featuring|having)\s+([^,\s]+(?:\s+[^,\s]+)*)/gi,
      // "workers requiring Python" or "tasks needing JavaScript"
      /(\w+)\s+(requiring|needing|requesting|demanding)\s+([^,\s]+(?:\s+[^,\s]+)*)/gi,
      // "Python skilled workers" or "JavaScript developers"
      /([^,\s]+(?:\s+[^,\s]+)*)\s+(skilled|experienced|capable)\s+(\w+)/gi,
      // "named John" or "called Project Alpha"
      /(?:named|called|titled)\s+([^,\s]+(?:\s+[^,\s]+)*)/gi,
      // "in GroupA" or "from TeamB"
      /(?:in|from|of)\s+(Group[A-Z]|Team[A-Z]|\w+Group|\w+Team)/gi,
    ]

    stringPatterns.forEach((pattern, patternIndex) => {
      let match
      while ((match = pattern.exec(lowercaseQuery)) !== null) {
        console.log(`String Pattern ${patternIndex} matched:`, match)

        let fieldName, operator, value

        if (patternIndex === 0) {
          fieldName = match[1].trim()
          operator = "contains"
          value = match[3].trim().replace(/['"]/g, "")
        } else if (patternIndex === 1) {
          fieldName = activeDataType === "workers" ? "Skills" : "RequiredSkills"
          operator = "contains"
          value = match[3].trim().replace(/['"]/g, "")
        } else if (patternIndex === 2) {
          fieldName = activeDataType === "workers" ? "Skills" : "RequiredSkills"
          operator = "contains"
          value = match[1].trim().replace(/['"]/g, "")
        } else if (patternIndex === 3) {
          fieldName =
            activeDataType === "clients" ? "ClientName" : activeDataType === "workers" ? "WorkerName" : "TaskName"
          operator = "contains"
          value = match[1].trim().replace(/['"]/g, "")
        } else if (patternIndex === 4) {
          fieldName = activeDataType === "clients" ? "GroupTag" : "WorkerGroup"
          operator = "contains"
          value = match[1].trim().replace(/['"]/g, "")
        }

        const mappedField =
          activeDataType && universalFieldMappings[activeDataType] && fieldName
            ? universalFieldMappings[activeDataType][fieldName]
            : fieldName
        if (mappedField && value) {
          conditions.push({
            field: mappedField,
            operator: operator ?? "=",
            value,
            type: "string",
          })
          console.log(`Added string condition:`, { field: mappedField, operator, value, type: "string" })
        }
      }
    })

    const arrayPatterns = [
      // "in phases 1, 2, 3" or "available in slots 1 and 2"
      /(?:in|during|within|available in)\s+(?:phases?|slots?)\s+([\d,\s]+(?:\s+(?:and|or)\s+\d+)*)/gi,
      // "phases 1, 2, 3" or "slots 1 and 2"
      /(?:phases?|slots?)\s+([\d,\s]+(?:\s+(?:and|or)\s+\d+)*)/gi,
      // "requesting tasks T1, T2, T3"
      /(?:requesting|needing|requiring)\s+(?:tasks?)\s+([T]\d+(?:,\s*[T]\d+)*)/gi,
      // "with skills Python, JavaScript, SQL"
      /(?:with|having)\s+(?:skills?)\s+([a-zA-Z]+(?:,\s*[a-zA-Z]+)*)/gi,
    ]

    arrayPatterns.forEach((pattern, patternIndex) => {
      let match
      while ((match = pattern.exec(lowercaseQuery)) !== null) {
        console.log(`Array Pattern ${patternIndex} matched:`, match)

        let fieldName, values

        if (patternIndex <= 1) {
          fieldName = activeDataType === "workers" ? "AvailableSlots" : "PreferredPhases"
          values = match[1]
            .replace(/(?:and|or)/g, ",")
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v && !isNaN(Number(v)))
            .map(Number)
        } else if (patternIndex === 2) {
          fieldName = "RequestedTaskIDs"
          values = match[1]
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v)
        } else if (patternIndex === 3) {
          fieldName = activeDataType === "workers" ? "Skills" : "RequiredSkills"
          values = match[1]
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v)
        }

        if (fieldName && values && values.length > 0) {
          conditions.push({
            field: fieldName,
            operator: "in",
            value: values,
            type: "array",
          })
          console.log(`Added array condition:`, { field: fieldName, operator: "in", value: values, type: "array" })
        }
      }
    })

    const booleanPatterns = [
      // "vip clients" or "premium users"
      /(vip|premium|important|critical|urgent|active|inactive)\s+(\w+)/gi,
      // "clients that are vip" or "workers who are senior"
      /(\w+)\s+(?:that are|who are|which are)\s+(vip|premium|senior|junior|active|inactive)/gi,
    ]

    booleanPatterns.forEach((pattern, patternIndex) => {
      let match
      while ((match = pattern.exec(lowercaseQuery)) !== null) {
        console.log(`Boolean Pattern ${patternIndex} matched:`, match)

        let fieldName, value

        if (patternIndex === 0) {
          fieldName =
            match[1] === "vip" || match[1] === "premium"
              ? "AttributesJSON.vip"
              : match[1] === "senior"
                ? "QualificationLevel"
                : match[1]
          value = match[1] === "senior" ? "Senior" : match[1] === "junior" ? "Junior" : true
        } else if (patternIndex === 1) {
          fieldName =
            match[2] === "vip" || match[2] === "premium"
              ? "AttributesJSON.vip"
              : match[2] === "senior"
                ? "QualificationLevel"
                : match[2]
          value = match[2] === "senior" ? "Senior" : match[2] === "junior" ? "Junior" : true
        }

        if (fieldName) {
          conditions.push({
            field: fieldName,
            operator: "=",
            value,
            type: typeof value === "boolean" ? "boolean" : "string",
          })
          console.log(`Added boolean condition:`, {
            field: fieldName,
            operator: "=",
            value,
            type: typeof value === "boolean" ? "boolean" : "string",
          })
        }
      }
    })

    console.log("Final universal parsed conditions:", conditions)
    return conditions
  }

  const callGeminiAPI = async (query: string, dataContext: any[]) => {
    if (!geminiApiKey) throw new Error("Gemini API key not configured")

    const dataSchema = dataContext.length > 0 ? Object.keys(dataContext[0]) : []
    const sampleData = dataContext.slice(0, 3)

    const prompt = `
You are an AI assistant helping users search through ${activeDataType} data. 

Data Schema: ${dataSchema.join(", ")}
Sample Data: ${JSON.stringify(sampleData, null, 2)}

User Query: "${query}"

Please analyze this query and return a JSON response with:
1. "conditions": Array of search conditions with fields: field, operator, value, type
2. "explanation": Brief explanation of what you understood
3. "suggestions": Array of alternative queries the user might want to try

Available operators: >, <, =, contains, in, not
Available types: numeric, string, array, boolean

Focus on understanding the user's intent and mapping it to the available data fields.
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
    return data.response
  }

  const executeSearch = (conditions: ParsedCondition[]) => {
    const currentData = dataSet[activeDataType] || []
    const currentMappings = headerMappings?.[activeDataType] || {}

    console.log(`Starting search on ${currentData.length} ${activeDataType} records`) // Debug logging
    console.log("Search conditions:", conditions) // Debug logging
    console.log("Available header mappings:", currentMappings) // Debug logging

    if (currentData.length > 0) {
      console.log("Sample data structure:", Object.keys(currentData[0])) // Debug logging
      console.log("Sample data values:", currentData[0]) // Debug logging
    }

    const reverseMappings: { [mappedField: string]: string } = {}
    Object.entries(currentMappings).forEach(([original, mapped]) => {
      reverseMappings[mapped] = original
    })
    console.log("Reverse mappings:", reverseMappings) // Debug logging

    const filteredResults = currentData.filter((item) => {
      const itemMatches = conditions.every((condition) => {
        let fieldValue = undefined
        let actualFieldName = condition.field

        // Check if this is a mapped field name that needs to be converted back to original
        if (reverseMappings[condition.field]) {
          actualFieldName = reverseMappings[condition.field]
          fieldValue = getNestedValue(item, actualFieldName)
          console.log(`Using reverse mapping: ${condition.field} -> ${actualFieldName} = ${fieldValue}`) // Debug logging
        }

        // If not found, try the field name as-is
        if (fieldValue === undefined) {
          fieldValue = getNestedValue(item, condition.field)
          if (fieldValue !== undefined) {
            console.log(`Found field value using direct field name: ${condition.field} = ${fieldValue}`) // Debug logging
          }
        }

        // If still not found, try alternative field names
        if (fieldValue === undefined) {
          const fieldMappings: { [key: string]: string[] } = {
            PriorityLevel: ["Priori", "Priority", "priority", "priorityLevel"],
            ClientName: ["Name", "name", "clientName"],
            WorkerName: ["Name", "name", "workerName"],
            TaskName: ["Name", "name", "taskName"],
            ClientID: ["ID", "id", "clientId"],
            WorkerID: ["ID", "id", "workerId"],
            TaskID: ["ID", "id", "taskId"],
            GroupTag: ["Group", "group", "groupTag"],
            WorkerGroup: ["Group", "group", "workerGroup"],
            Skills: ["skills", "skill"],
            RequiredSkills: ["RequiredSkill", "requiredSkill", "skills", "skill"],
            AvailableSlots: ["Slots", "slots", "availableSlots"],
            PreferredPhases: ["Phases", "phases", "preferredPhases"],
            RequestedTaskIDs: ["RequestedTasks", "requestedTasks", "tasks"],
            Duration: ["duration"],
            MaxConcurrent: ["maxConcurrent", "concurrent"],
            MaxLoadPerPhase: ["MaxLoad", "maxLoad", "load"],
            QualificationLevel: ["Qualification", "qualification", "level"],
            AttributesJSON: ["AttributesJSON"],
          }

          const possibleFields = fieldMappings[condition.field] || []
          console.log(`Field ${condition.field} not found, trying alternatives:`, possibleFields) // Debug logging

          for (const altField of possibleFields) {
            fieldValue = getNestedValue(item, altField)
            if (fieldValue !== undefined) {
              console.log(`Found field value using alternative field name: ${altField} = ${fieldValue}`) // Debug logging
              break
            }
          }

          // Final fallback - direct property access
          if (fieldValue === undefined) {
            fieldValue = item[condition.field]
            if (fieldValue !== undefined) {
              console.log(`Found field value using direct access: ${condition.field} = ${fieldValue}`) // Debug logging
            }
          }
        }

        console.log(
          `Checking condition: ${condition.field} ${condition.operator} ${condition.value}, actual value: ${fieldValue} (type: ${typeof fieldValue})`,
        ) // Debug logging

        // Return false if field not found
        if (fieldValue === undefined || fieldValue === null) {
          console.log(`Field ${condition.field} not found in item, returning false`) // Debug logging
          return false
        }

        // Handle different condition types
        switch (condition.type) {
          case "numeric":
            const numValue = Number(fieldValue)
            const conditionValue = Number(condition.value)

            console.log(`Numeric comparison: ${numValue} ${condition.operator} ${conditionValue}`) // Debug logging

            if (isNaN(numValue) || isNaN(conditionValue)) {
              console.log(`NaN detected: numValue=${numValue}, conditionValue=${conditionValue}`) // Debug logging
              return false
            }

            let result = false
            switch (condition.operator) {
              case ">":
                result = numValue > conditionValue
                break
              case "<":
                result = numValue < conditionValue
                break
              case "=":
              case "==":
              case "===":
                result = numValue === conditionValue
                break
              case ">=":
                result = numValue >= conditionValue
                break
              case "<=":
                result = numValue <= conditionValue
                break
              default:
                result = false
            }

            console.log(`${numValue} ${condition.operator} ${conditionValue} = ${result}`) // Debug logging
            return result

          case "string":
            const strValue = String(fieldValue || "").toLowerCase()
            const searchValue = String(condition.value).toLowerCase()
            switch (condition.operator) {
              case "contains":
                return strValue.includes(searchValue)
              case "=":
              case "==":
              case "===":
                return strValue === searchValue
              default:
                return strValue.includes(searchValue)
            }

          case "array":
            if (condition.operator === "in") {
              const arrayValue = parseArrayField(fieldValue)
              return condition.value.some(
                (val: any) => arrayValue.includes(Number(val)) || arrayValue.includes(String(val)),
              )
            }
            return false

          case "boolean":
            const boolValue = Boolean(fieldValue)
            const conditionBoolValue = Boolean(condition.value)
            return boolValue === conditionBoolValue

          default:
            return true
        }
      })

      if (conditions.length > 0) {
        console.log(`Item ${item.ClientID || item.WorkerID || item.TaskID || "unknown"} matches: ${itemMatches}`) // Debug logging
      }

      return itemMatches
    })

    console.log(`Filtered results: ${filteredResults.length} out of ${currentData.length}`) // Debug logging

    if (filteredResults.length > 0 && filteredResults.length < 50) {
      console.log(
        "Matching items:",
        filteredResults.map((item) => ({
          id: item.ClientID || item.WorkerID || item.TaskID || item.ID || item.id,
          priority: item.PriorityLevel || item.Priori || item.Priority || item.priority,
          name: item.ClientName || item.WorkerName || item.TaskName || item.Name || item.name,
        })),
      )
    }

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

    try {
      let conditions: ParsedCondition[] = []
      let aiEnhanced = false

      if (useGemini && geminiApiKey) {
        try {
          const geminiResponse = await callGeminiAPI(query, dataSet[activeDataType])

          let parsedResponse

          if (geminiResponse && typeof geminiResponse === "object") {
            const responseText = geminiResponse.text || geminiResponse.response || geminiResponse

            if (typeof responseText === "string") {
              const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                try {
                  parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
                } catch (parseError) {
                  console.error("JSON parsing error:", parseError)
                  parsedResponse = null
                }
              }
            } else if (typeof responseText === "object") {
              parsedResponse = responseText
            }
          } else if (typeof geminiResponse === "string") {
            const jsonMatch = geminiResponse.match(/```json\s*([\s\S]*?)\s*```/) || geminiResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              try {
                parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
              } catch (parseError) {
                console.error("JSON parsing error:", parseError)
                parsedResponse = null
              }
            }
          }

          if (parsedResponse && parsedResponse.conditions) {
            conditions = parsedResponse.conditions.map((condition: any) => ({
              field: condition.field,
              operator: condition.operator,
              value: condition.type === "numeric" ? Number(condition.value) : condition.value,
              type: condition.type as "numeric" | "string" | "array" | "boolean",
            }))
            aiEnhanced = true

            console.log("Parsed Gemini conditions:", conditions) // Debug logging

            if (parsedResponse.explanation) {
              console.log("Gemini explanation:", parsedResponse.explanation)
            }
            if (parsedResponse.suggestions) {
              console.log("Gemini suggestions:", parsedResponse.suggestions)
            }
          } else {
            console.log("Gemini response parsing failed, using local parsing") // Debug logging
            conditions = parseNaturalLanguage(query)
          }
        } catch (error) {
          console.error("Gemini API error:", error)
          conditions = parseNaturalLanguage(query)
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800))
        conditions = parseNaturalLanguage(query)
      }

      setParsedQuery(conditions)
      const results = executeSearch(conditions)

      const searchQuery: SearchQuery = {
        id: Date.now().toString(),
        query,
        parsedConditions: conditions,
        resultCount: results.length,
        aiEnhanced,
      }

      setSearchHistory((prev) => [searchQuery, ...prev.slice(0, 4)])
      onSearchResults(results, query, conditions)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsProcessing(false)
    }
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
          Search your data using plain English.{" "}
          {geminiApiKey && useGemini && "Enhanced with Gemini AI for better understanding."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
              {isProcessing ? (
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              ) : useGemini && geminiApiKey ? (
                <Zap className="w-4 h-4 mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? "Processing..." : useGemini && geminiApiKey ? "AI Search" : "Search"}
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs">
            <Filter className="w-3 h-3 mr-1" />
            {showAdvanced ? "Hide" : "Show"} Advanced
          </Button>
        </div>

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

        {parsedQuery.length > 0 && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium flex items-center gap-2">
                  {useGemini && geminiApiKey ? "Gemini AI" : "AI"} understood your query as:
                  {useGemini && geminiApiKey && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Enhanced
                    </Badge>
                  )}
                </p>
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
                  <span className="truncate flex-1 flex items-center gap-2">
                    {search.query}
                    {search.aiEnhanced && <Zap className="w-3 h-3 text-purple-500" />}
                  </span>
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
