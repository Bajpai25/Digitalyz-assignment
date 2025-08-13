"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Database, Settings, Target, CheckCircle, AlertCircle, Package } from "lucide-react"

interface ExportInterfaceProps {
  dataSet: {
    clients: any[]
    workers: any[]
    tasks: any[]
  }
  validationResults: any[]
}

interface ExportOptions {
  cleanedData: boolean
  rulesConfig: boolean
  prioritizationConfig: boolean
  validationReport: boolean
  projectSummary: boolean
  sampleTemplates: boolean
}

export function ExportInterface({ dataSet, validationResults }: ExportInterfaceProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    cleanedData: true,
    rulesConfig: true,
    prioritizationConfig: true,
    validationReport: true,
    projectSummary: true,
    sampleTemplates: false,
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)

  const toggleOption = (option: keyof ExportOptions) => {
    setExportOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }))
  }

  const exportCleanedData = () => {
    // Export cleaned CSV files
    Object.entries(dataSet).forEach(([type, data]) => {
      if (data.length > 0) {
        const headers = Object.keys(data[0])
        const csvContent = [
          headers.join(","),
          ...data.map((row: any) =>
            headers
              .map((header) => {
                const value = row[header]
                // Handle arrays and objects
                if (Array.isArray(value)) return `"${value.join(";")}"`
                if (typeof value === "object" && value !== null) return `"${JSON.stringify(value)}"`
                // Escape quotes and wrap in quotes if contains comma
                const stringValue = String(value || "")
                return stringValue.includes(",") || stringValue.includes('"')
                  ? `"${stringValue.replace(/"/g, '""')}"`
                  : stringValue
              })
              .join(","),
          ),
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `cleaned_${type}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  const exportRulesConfig = () => {
    // This would normally come from the RuleBuilder component
    // For now, create a sample rules configuration
    const rulesConfig = {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      rules: [
        {
          id: "sample-rule-1",
          type: "coRun",
          name: "Critical Tasks Co-Run",
          description: "Ensure critical tasks run together",
          parameters: { tasks: ["TASK_001", "TASK_002"] },
          priority: 1,
          enabled: true,
        },
      ],
      metadata: {
        totalRules: 1,
        activeRules: 1,
        dataSource: "Data Alchemist v1.0",
      },
    }

    const blob = new Blob([JSON.stringify(rulesConfig, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "rules-config.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPrioritizationConfig = () => {
    const prioritizationConfig = {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      preset: "balanced",
      weights: {
        clientImportance: 75,
        workerSkillMatch: 85,
        taskUrgency: 90,
        resourceAvailability: 70,
        costEfficiency: 60,
        workloadBalance: 80,
      },
      priorities: {
        highPriorityClients: [],
        criticalSkills: [],
        urgentTasks: [],
        preferredWorkers: [],
      },
      metadata: {
        totalClients: dataSet.clients.length,
        totalWorkers: dataSet.workers.length,
        totalTasks: dataSet.tasks.length,
      },
    }

    const blob = new Blob([JSON.stringify(prioritizationConfig, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "prioritization-config.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportValidationReport = () => {
    const report = {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      summary: {
        totalIssues: validationResults.length,
        criticalIssues: validationResults.filter((r) => r.severity === "critical").length,
        warningIssues: validationResults.filter((r) => r.severity === "warning").length,
        infoIssues: validationResults.filter((r) => r.severity === "info").length,
      },
      dataQuality: {
        clientsProcessed: dataSet.clients.length,
        workersProcessed: dataSet.workers.length,
        tasksProcessed: dataSet.tasks.length,
        validationsPassed: Math.max(0, 12 - validationResults.length),
      },
      issues: validationResults,
      recommendations: [
        "Review all critical issues before proceeding with allocation",
        "Ensure all required fields are properly filled",
        "Verify skill-coverage matrix for optimal matching",
        "Check workload balance across all worker groups",
      ],
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "validation-report.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportProjectSummary = () => {
    const summary = {
      project: {
        name: "Resource Allocation Configuration",
        version: "1.0",
        generatedAt: new Date().toISOString(),
        generatedBy: "Data Alchemist AI Configurator",
      },
      dataOverview: {
        clients: {
          total: dataSet.clients.length,
          groups: [...new Set(dataSet.clients.map((c) => c.GroupTag).filter(Boolean))].length,
          avgPriority:
            dataSet.clients.length > 0
              ? (dataSet.clients.reduce((sum, c) => sum + (c.PriorityLevel || 3), 0) / dataSet.clients.length).toFixed(
                  1,
                )
              : "N/A",
        },
        workers: {
          total: dataSet.workers.length,
          groups: [...new Set(dataSet.workers.map((w) => w.WorkerGroup).filter(Boolean))].length,
          totalSkills: [
            ...new Set(
              dataSet.workers
                .flatMap((w) => w.Skills?.split(",") || [])
                .map((s) => s.trim())
                .filter(Boolean),
            ),
          ].length,
        },
        tasks: {
          total: dataSet.tasks.length,
          types: [...new Set(dataSet.tasks.map((t) => t.TaskType).filter(Boolean))].length,
          avgDuration:
            dataSet.tasks.length > 0
              ? (dataSet.tasks.reduce((sum, t) => sum + (t.Duration || 1), 0) / dataSet.tasks.length).toFixed(1)
              : "N/A",
        },
      },
      qualityMetrics: {
        validationScore: Math.max(0, 100 - validationResults.length * 8),
        dataCompleteness: Math.round(
          (((dataSet.clients.length > 0 ? 1 : 0) +
            (dataSet.workers.length > 0 ? 1 : 0) +
            (dataSet.tasks.length > 0 ? 1 : 0)) /
            3) *
            100,
        ),
        readinessLevel:
          validationResults.filter((r) => r.severity === "critical").length === 0 ? "Ready" : "Needs Review",
      },
      nextSteps: [
        "Import configurations into your allocation system",
        "Run test allocations with sample data",
        "Monitor allocation performance and adjust weights",
        "Iterate on rules based on real-world results",
      ],
    }

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "project-summary.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportSampleTemplates = () => {
    const templates = {
      clientTemplate: {
        ClientID: "CLIENT_001",
        ClientName: "Example Client Corp",
        GroupTag: "Enterprise",
        PriorityLevel: 4,
        PreferredPhases: [1, 2],
        RequestedTaskIDs: ["TASK_001", "TASK_002"],
        AttributesJSON: '{"industry": "technology", "size": "large"}',
      },
      workerTemplate: {
        WorkerID: "WORKER_001",
        WorkerName: "John Doe",
        WorkerGroup: "Senior",
        Skills: "JavaScript, React, Node.js",
        AvailableSlots: [1, 2, 3],
        MaxLoadPerPhase: 3,
        AttributesJSON: '{"experience": 5, "location": "remote"}',
      },
      taskTemplate: {
        TaskID: "TASK_001",
        TaskName: "Frontend Development",
        TaskType: "Development",
        Duration: 2,
        RequiredSkills: "React, JavaScript",
        PriorityLevel: 3,
        PreferredPhases: [1, 2],
        MaxConcurrent: 2,
        AttributesJSON: '{"complexity": "medium", "client_facing": true}',
      },
    }

    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "data-templates.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAll = async () => {
    setIsExporting(true)

    try {
      // Simulate export process with delays
      if (exportOptions.cleanedData) {
        exportCleanedData()
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      if (exportOptions.rulesConfig) {
        exportRulesConfig()
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      if (exportOptions.prioritizationConfig) {
        exportPrioritizationConfig()
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      if (exportOptions.validationReport) {
        exportValidationReport()
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      if (exportOptions.projectSummary) {
        exportProjectSummary()
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      if (exportOptions.sampleTemplates) {
        exportSampleTemplates()
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      setExportComplete(true)
      setTimeout(() => setExportComplete(false), 3000)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const selectedCount = Object.values(exportOptions).filter(Boolean).length
  const hasData = dataSet.clients.length > 0 || dataSet.workers.length > 0 || dataSet.tasks.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Export Configuration</h2>
          <p className="text-slate-600">Download your processed data and configuration files</p>
        </div>
        <div className="flex items-center gap-2">
          {exportComplete && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Export Complete
            </Badge>
          )}
          <Button
            onClick={handleExportAll}
            disabled={!hasData || selectedCount === 0 || isExporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : `Export Selected (${selectedCount})`}
          </Button>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cleaned Data */}
        <Card className={exportOptions.cleanedData ? "ring-2 ring-blue-200 bg-blue-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Cleaned Data</CardTitle>
              </div>
              <Checkbox checked={exportOptions.cleanedData} onCheckedChange={() => toggleOption("cleanedData")} />
            </div>
            <CardDescription>Processed and validated CSV files for clients, workers, and tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Clients:</span>
                <span className="font-medium">{dataSet.clients.length} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Workers:</span>
                <span className="font-medium">{dataSet.workers.length} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tasks:</span>
                <span className="font-medium">{dataSet.tasks.length} records</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules Configuration */}
        <Card className={exportOptions.rulesConfig ? "ring-2 ring-blue-200 bg-blue-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">Rules Config</CardTitle>
              </div>
              <Checkbox checked={exportOptions.rulesConfig} onCheckedChange={() => toggleOption("rulesConfig")} />
            </div>
            <CardDescription>Business rules and allocation constraints in JSON format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium">JSON</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File:</span>
                <span className="font-medium">rules-config.json</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compatible:</span>
                <span className="font-medium">All systems</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prioritization Config */}
        <Card className={exportOptions.prioritizationConfig ? "ring-2 ring-blue-200 bg-blue-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg">Priority Weights</CardTitle>
              </div>
              <Checkbox
                checked={exportOptions.prioritizationConfig}
                onCheckedChange={() => toggleOption("prioritizationConfig")}
              />
            </div>
            <CardDescription>Factor weights and priority settings for allocation algorithm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Factors:</span>
                <span className="font-medium">6 weights</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Priorities:</span>
                <span className="font-medium">4 categories</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File:</span>
                <span className="font-medium">prioritization-config.json</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Report */}
        <Card className={exportOptions.validationReport ? "ring-2 ring-blue-200 bg-blue-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-lg">Validation Report</CardTitle>
              </div>
              <Checkbox
                checked={exportOptions.validationReport}
                onCheckedChange={() => toggleOption("validationReport")}
              />
            </div>
            <CardDescription>Comprehensive data quality and validation analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Issues Found:</span>
                <span className="font-medium">{validationResults.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quality Score:</span>
                <span className="font-medium">{Math.max(0, 100 - validationResults.length * 8)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File:</span>
                <span className="font-medium">validation-report.json</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Summary */}
        <Card className={exportOptions.projectSummary ? "ring-2 ring-blue-200 bg-blue-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Project Summary</CardTitle>
              </div>
              <Checkbox checked={exportOptions.projectSummary} onCheckedChange={() => toggleOption("projectSummary")} />
            </div>
            <CardDescription>Executive summary with metrics and next steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Overview:</span>
                <span className="font-medium">Complete</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Metrics:</span>
                <span className="font-medium">Quality & Readiness</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File:</span>
                <span className="font-medium">project-summary.json</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Templates */}
        <Card className={exportOptions.sampleTemplates ? "ring-2 ring-blue-200 bg-blue-50" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                <CardTitle className="text-lg">Sample Templates</CardTitle>
              </div>
              <Checkbox
                checked={exportOptions.sampleTemplates}
                onCheckedChange={() => toggleOption("sampleTemplates")}
              />
            </div>
            <CardDescription>Template files for future data imports and reference</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Templates:</span>
                <span className="font-medium">3 types</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium">JSON</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File:</span>
                <span className="font-medium">data-templates.json</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Export Summary</CardTitle>
          <CardDescription>Overview of your configuration and next steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Data Overview</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Records:</span>
                  <span className="font-medium">
                    {dataSet.clients.length + dataSet.workers.length + dataSet.tasks.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Quality:</span>
                  <span className="font-medium">{Math.max(0, 100 - validationResults.length * 8)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Readiness:</span>
                  <span
                    className={`font-medium ${validationResults.filter((r) => r.severity === "critical").length === 0 ? "text-green-600" : "text-orange-600"}`}
                  >
                    {validationResults.filter((r) => r.severity === "critical").length === 0 ? "Ready" : "Needs Review"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Configuration</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rules Created:</span>
                  <span className="font-medium">Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priorities Set:</span>
                  <span className="font-medium">Configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Export Format:</span>
                  <span className="font-medium">JSON + CSV</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Next Steps</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Import configs into allocation system</li>
                <li>• Run test allocations</li>
                <li>• Monitor performance metrics</li>
                <li>• Iterate based on results</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasData && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-900">No Data Available</h4>
                <p className="text-sm text-orange-700">
                  Upload and process your data first before exporting configurations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
