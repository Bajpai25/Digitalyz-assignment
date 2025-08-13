"use client"

import { useState } from "react"
import { Brain, Upload, Database, Settings, Download, Target, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataUpload } from "@/components/data-upload"
import { DataGrid } from "@/components/data-grid"
import { ValidationPanel } from "@/components/validation-panel"
import { RuleBuilder } from "@/components/rule-builder"
import { PrioritizationControls } from "@/components/prioritization-controls"
import { ExportInterface } from "@/components/export-interface"
import { GeminiSettings } from "@/components/gemini-settings"
import { GeminiEnhancedSearch } from "@/components/gemini-enhanced-search"

interface DataSet {
  clients: any[]
  workers: any[]
  tasks: any[]
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [dataSet, setDataSet] = useState<DataSet>({
    clients: [],
    workers: [],
    tasks: [],
  })
  const [validationResults, setValidationResults] = useState<any[]>([])
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])

  const handleDataUploaded = (type: keyof DataSet, data: any[]) => {
    setDataSet((prev) => ({
      ...prev,
      [type]: data,
    }))
    // Auto-switch to data view after upload
    if (data.length > 0) {
      setActiveTab("data")
    }
  }

  const hasData = dataSet.clients.length > 0 || dataSet.workers.length > 0 || dataSet.tasks.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Data Alchemist</h1>
                <p className="text-sm text-slate-600">AI-Powered Resource Allocation Configurator</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {geminiApiKey && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                  <Sparkles className="w-3 h-3" />
                  Gemini AI Active
                </div>
              )}
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" disabled={!hasData} onClick={() => setActiveTab("export")}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2" disabled={!hasData}>
              <Database className="w-4 h-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2" disabled={!hasData}>
              <Settings className="w-4 h-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="priorities" className="flex items-center gap-2" disabled={!hasData}>
              <Target className="w-4 h-4" />
              Priorities
            </TabsTrigger>
            <TabsTrigger value="gemini" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Gemini AI
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2" disabled={!hasData}>
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <DataUpload onDataUploaded={handleDataUploaded} geminiApiKey={geminiApiKey} />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DataGrid dataSet={dataSet} onDataChange={setDataSet} geminiApiKey={geminiApiKey} />
              </div>
              <div>
                <ValidationPanel
                  dataSet={dataSet}
                  validationResults={validationResults}
                  onValidationChange={setValidationResults}
                  geminiApiKey={geminiApiKey}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <RuleBuilder dataSet={dataSet} geminiApiKey={geminiApiKey} />
          </TabsContent>

          <TabsContent value="priorities" className="space-y-6">
            <PrioritizationControls dataSet={dataSet} geminiApiKey={geminiApiKey} />
          </TabsContent>

          <TabsContent value="gemini" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <GeminiSettings onApiKeyChange={setGeminiApiKey} />
              </div>
              <div>
                {hasData && (
                  <GeminiEnhancedSearch
                    data={[...dataSet.clients, ...dataSet.workers, ...dataSet.tasks]}
                    onSearch={setSearchResults}
                    apiKey={geminiApiKey}
                  />
                )}
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Search Results ({searchResults.length} items)</h3>
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(searchResults[0] || {}).map((key) => (
                            <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.slice(0, 10).map((item, index) => (
                          <tr key={index} className="border-t">
                            {Object.values(item).map((value: any, valueIndex) => (
                              <td key={valueIndex} className="px-4 py-2 text-sm text-gray-600">
                                {Array.isArray(value) ? value.join(", ") : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportInterface dataSet={dataSet} validationResults={validationResults} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
