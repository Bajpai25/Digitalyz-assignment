"use client"

import { useState } from "react"
import { Brain, Upload, Database, Settings, Download, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataUpload } from "@/components/data-upload"
import { DataGrid } from "@/components/data-grid"
import { ValidationPanel } from "@/components/validation-panel"
import { RuleBuilder } from "@/components/rule-builder"
import { PrioritizationControls } from "@/components/prioritization-controls"
import { ExportInterface } from "@/components/export-interface"

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
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="export" className="flex items-center gap-2" disabled={!hasData}>
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <DataUpload onDataUploaded={handleDataUploaded} />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DataGrid dataSet={dataSet} onDataChange={setDataSet} />
              </div>
              <div>
                <ValidationPanel
                  dataSet={dataSet}
                  validationResults={validationResults}
                  onValidationChange={setValidationResults}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <RuleBuilder dataSet={dataSet} />
          </TabsContent>

          <TabsContent value="priorities" className="space-y-6">
            <PrioritizationControls dataSet={dataSet} />
          </TabsContent>

          {/* Added comprehensive export interface */}
          <TabsContent value="export" className="space-y-6">
            <ExportInterface dataSet={dataSet} validationResults={validationResults} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
