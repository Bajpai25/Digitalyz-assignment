"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Edit, Save, X, Brain } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NaturalLanguageSearch } from "./natural-language-search"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DataGridProps {
  dataSet: {
    clients: any[]
    workers: any[]
    tasks: any[]
  }
  onDataChange: (dataSet: any) => void
  geminiApiKey: string
}

interface ParsedCondition {
  field: string
  operator: string
  value: any
  type: "numeric" | "string" | "array" | "boolean"
}

export function DataGrid({ dataSet, onDataChange, geminiApiKey }: DataGridProps) {
  const [activeDataType, setActiveDataType] = useState<"clients" | "workers" | "tasks">("clients")
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isNaturalLanguageActive, setIsNaturalLanguageActive] = useState(false)
  const [activeSearchQuery, setActiveSearchQuery] = useState("")
  const [searchConditions, setSearchConditions] = useState<ParsedCondition[]>([])

  const currentData = dataSet[activeDataType] || []
  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : []

  // Use filtered data if natural language search is active, otherwise use regular search
  const displayData = isNaturalLanguageActive
    ? filteredData
    : currentData.filter((row) =>
        Object.values(row).some((value) => String(value).toLowerCase().includes(searchQuery.toLowerCase())),
      )

  const handleCellEdit = (rowIndex: number, column: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, col: column })
    setEditValue(String(currentValue))
  }

  const handleSaveEdit = () => {
    if (!editingCell) return

    const newData = [...currentData]
    const actualRowIndex = currentData.findIndex((row) => row === displayData[editingCell.row])

    if (actualRowIndex !== -1) {
      newData[actualRowIndex][editingCell.col] = editValue

      onDataChange({
        ...dataSet,
        [activeDataType]: newData,
      })
    }

    setEditingCell(null)
    setEditValue("")
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleNaturalLanguageResults = (results: any[], query: string, conditions: ParsedCondition[]) => {
    setFilteredData(results)
    setActiveSearchQuery(query)
    setSearchConditions(conditions)
    setIsNaturalLanguageActive(query.length > 0)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setActiveSearchQuery("")
    setSearchConditions([])
    setFilteredData([])
    setIsNaturalLanguageActive(false)
  }

  const getDataTypeInfo = (type: string) => {
    const info = {
      clients: { count: dataSet.clients.length, color: "bg-blue-100 text-blue-800" },
      workers: { count: dataSet.workers.length, color: "bg-green-100 text-green-800" },
      tasks: { count: dataSet.tasks.length, color: "bg-purple-100 text-purple-800" },
    }
    return info[type as keyof typeof info] || { count: 0, color: "bg-gray-100 text-gray-800" }
  }

  const highlightMatchingCell = (value: any, column: string): boolean => {
    if (!isNaturalLanguageActive || searchConditions.length === 0) return false

    return searchConditions.some((condition) => {
      if (condition.field === column || condition.field.endsWith(column)) {
        switch (condition.type) {
          case "numeric":
            const numValue = Number(value)
            switch (condition.operator) {
              case ">":
                return numValue > condition.value
              case "<":
                return numValue < condition.value
              case "=":
                return numValue === condition.value
            }
            break
          case "string":
            return String(value || "")
              .toLowerCase()
              .includes(String(condition.value).toLowerCase())
          case "array":
            if (condition.operator === "in") {
              const arrayValue = parseArrayField(value)
              return condition.value.some((val: any) => arrayValue.includes(val))
            }
            break
        }
      }
      return false
    })
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

  if (currentData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Grid</CardTitle>
          <CardDescription>No data uploaded yet. Please upload your CSV/XLSX files first.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Natural Language Search */}
      <NaturalLanguageSearch
        dataSet={dataSet}
        onSearchResults={handleNaturalLanguageResults}
        activeDataType={activeDataType}
        geminiApiKey={geminiApiKey}
      />

      {/* Data Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Data Grid
            <Badge variant="secondary">{displayData.length} rows</Badge>
            {isNaturalLanguageActive && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                AI Filtered
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isNaturalLanguageActive
              ? `Showing results for: "${activeSearchQuery}"`
              : "View and edit your data with inline editing capabilities"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeDataType}
            onValueChange={(value) => {
              setActiveDataType(value as any)
              clearAllFilters() // Clear filters when switching tabs
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                {(["clients", "workers", "tasks"] as const).map((type) => {
                  const info = getDataTypeInfo(type)
                  return (
                    <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                      <span className="capitalize">{type}</span>
                      <Badge className={`text-xs ${info.color}`}>{info.count}</Badge>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <div className="flex items-center gap-2">
                {/* Traditional Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Quick search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-48"
                    disabled={isNaturalLanguageActive}
                  />
                </div>

                {(isNaturalLanguageActive || searchQuery) && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Active Search Alert */}
            {isNaturalLanguageActive && (
              <Alert className="mb-4">
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Natural Language Search Active</p>
                      <p className="text-sm">Showing {displayData.length} results matching your query</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {searchConditions.map((condition, index) => (
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

            {(["clients", "workers", "tasks"] as const).map((type) => (
              <TabsContent key={type} value={type}>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((column) => (
                            <TableHead key={column} className="font-semibold">
                              {column}
                            </TableHead>
                          ))}
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {columns.map((column) => {
                              const isHighlighted = highlightMatchingCell(row[column], column)
                              return (
                                <TableCell
                                  key={column}
                                  className={`relative ${isHighlighted ? "bg-yellow-100 border-yellow-300" : ""}`}
                                >
                                  {editingCell?.row === rowIndex && editingCell?.col === column ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-8"
                                        autoFocus
                                      />
                                      <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                                        <Save className="w-3 h-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div
                                      className="cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[24px] relative"
                                      onClick={() => handleCellEdit(rowIndex, column, row[column])}
                                    >
                                      {String(row[column] || "")}
                                      {isHighlighted && (
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full"></div>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              )
                            })}
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCellEdit(rowIndex, columns[0], row[columns[0]])}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {displayData.length === 0 && (isNaturalLanguageActive || searchQuery) && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No results found</p>
                    <p className="text-sm">Try adjusting your search query or clear filters</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
