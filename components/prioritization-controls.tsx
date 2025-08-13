"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Target, Users, Clock, Star, Zap } from "lucide-react"

interface PrioritizationControlsProps {
  dataSet: {
    clients: any[]
    workers: any[]
    tasks: any[]
  }
   geminiApiKey: string
}

interface PriorityWeights {
  clientImportance: number
  workerSkillMatch: number
  taskUrgency: number
  resourceAvailability: number
  costEfficiency: number
  workloadBalance: number
}

interface AllocationPriorities {
  highPriorityClients: string[]
  criticalSkills: string[]
  urgentTasks: string[]
  preferredWorkers: string[]
}

export function PrioritizationControls({ dataSet }: PrioritizationControlsProps) {
  const [weights, setWeights] = useState<PriorityWeights>({
    clientImportance: 75,
    workerSkillMatch: 85,
    taskUrgency: 90,
    resourceAvailability: 70,
    costEfficiency: 60,
    workloadBalance: 80,
  })

  const [priorities, setPriorities] = useState<AllocationPriorities>({
    highPriorityClients: [],
    criticalSkills: [],
    urgentTasks: [],
    preferredWorkers: [],
  })

  const [activePreset, setActivePreset] = useState<string>("balanced")

  // Extract unique values from data
  const clientGroups = [...new Set(dataSet.clients.map((c) => c.GroupTag).filter(Boolean))]
  const workerSkills = [
    ...new Set(
      dataSet.workers
        .flatMap((w) => w.Skills?.split(",") || [])
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ]
  const taskTypes = [...new Set(dataSet.tasks.map((t) => t.TaskType).filter(Boolean))]
  const workerGroups = [...new Set(dataSet.workers.map((w) => w.WorkerGroup).filter(Boolean))]

  const presets = {
    balanced: {
      name: "Balanced Allocation",
      description: "Equal consideration for all factors",
      weights: {
        clientImportance: 75,
        workerSkillMatch: 75,
        taskUrgency: 75,
        resourceAvailability: 75,
        costEfficiency: 75,
        workloadBalance: 75,
      },
    },
    clientFocused: {
      name: "Client-Focused",
      description: "Prioritize client satisfaction and importance",
      weights: {
        clientImportance: 95,
        workerSkillMatch: 70,
        taskUrgency: 85,
        resourceAvailability: 60,
        costEfficiency: 50,
        workloadBalance: 65,
      },
    },
    skillOptimized: {
      name: "Skill-Optimized",
      description: "Match workers to tasks based on expertise",
      weights: {
        clientImportance: 60,
        workerSkillMatch: 95,
        taskUrgency: 80,
        resourceAvailability: 85,
        costEfficiency: 70,
        workloadBalance: 75,
      },
    },
    urgencyDriven: {
      name: "Urgency-Driven",
      description: "Focus on completing urgent tasks first",
      weights: {
        clientImportance: 70,
        workerSkillMatch: 75,
        taskUrgency: 95,
        resourceAvailability: 80,
        costEfficiency: 55,
        workloadBalance: 70,
      },
    },
    costEfficient: {
      name: "Cost-Efficient",
      description: "Optimize for cost and resource efficiency",
      weights: {
        clientImportance: 65,
        workerSkillMatch: 70,
        taskUrgency: 70,
        resourceAvailability: 90,
        costEfficiency: 95,
        workloadBalance: 85,
      },
    },
  }

  const applyPreset = (presetKey: string) => {
    const preset = presets[presetKey as keyof typeof presets]
    if (preset) {
      setWeights(preset.weights)
      setActivePreset(presetKey)
    }
  }

  const updateWeight = (key: keyof PriorityWeights, value: number[]) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value[0],
    }))
    setActivePreset("custom")
  }

  const togglePriority = (category: keyof AllocationPriorities, item: string) => {
    setPriorities((prev) => ({
      ...prev,
      [category]: prev[category].includes(item) ? prev[category].filter((i) => i !== item) : [...prev[category], item],
    }))
  }

  const exportPrioritizationConfig = () => {
    const config = {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      preset: activePreset,
      weights,
      priorities,
      metadata: {
        totalClients: dataSet.clients.length,
        totalWorkers: dataSet.workers.length,
        totalTasks: dataSet.tasks.length,
      },
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "prioritization-config.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const getWeightColor = (weight: number) => {
    if (weight >= 85) return "bg-red-500"
    if (weight >= 70) return "bg-orange-500"
    if (weight >= 55) return "bg-yellow-500"
    return "bg-gray-400"
  }

  const getWeightLabel = (weight: number) => {
    if (weight >= 85) return "Critical"
    if (weight >= 70) return "High"
    if (weight >= 55) return "Medium"
    return "Low"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Prioritization & Weights</h2>
          <p className="text-slate-600">Configure allocation priorities and factor weights</p>
        </div>
        <Button onClick={exportPrioritizationConfig} className="bg-green-600 hover:bg-green-700">
          <BarChart3 className="w-4 h-4 mr-2" />
          Export Config
        </Button>
      </div>

      <Tabs defaultValue="weights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weights">Factor Weights</TabsTrigger>
          <TabsTrigger value="priorities">Specific Priorities</TabsTrigger>
          <TabsTrigger value="presets">Presets & Templates</TabsTrigger>
        </TabsList>

        {/* Factor Weights Tab */}
        <TabsContent value="weights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Allocation Factor Weights
              </CardTitle>
              <CardDescription>
                Adjust the importance of different factors in the allocation algorithm. Higher weights mean greater
                influence on allocation decisions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weight Controls */}
              <div className="grid gap-6">
                {Object.entries(weights).map(([key, value]) => {
                  const labels = {
                    clientImportance: {
                      name: "Client Importance",
                      icon: Star,
                      desc: "Priority based on client tier and relationship value",
                    },
                    workerSkillMatch: {
                      name: "Worker Skill Match",
                      icon: Target,
                      desc: "How well worker skills align with task requirements",
                    },
                    taskUrgency: {
                      name: "Task Urgency",
                      icon: Clock,
                      desc: "Priority level and deadline constraints of tasks",
                    },
                    resourceAvailability: {
                      name: "Resource Availability",
                      icon: Users,
                      desc: "Worker availability and capacity constraints",
                    },
                    costEfficiency: {
                      name: "Cost Efficiency",
                      icon: BarChart3,
                      desc: "Optimize for cost-effective resource utilization",
                    },
                    workloadBalance: {
                      name: "Workload Balance",
                      icon: Zap,
                      desc: "Distribute work evenly across available resources",
                    },
                  }

                  const label = labels[key as keyof typeof labels]
                  const Icon = label.icon

                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">{label.name}</h4>
                            <p className="text-sm text-gray-600">{label.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${getWeightColor(value)} text-white border-0`}>
                            {getWeightLabel(value)}
                          </Badge>
                          <span className="text-lg font-semibold w-12 text-right">{value}%</span>
                        </div>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={(newValue) => updateWeight(key as keyof PriorityWeights, newValue)}
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )
                })}
              </div>

              {/* Weight Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Weight Distribution Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Average Weight:</span>
                    <span className="ml-2 font-medium">
                      {Math.round(
                        Object.values(weights).reduce((sum, w) => sum + w, 0) / Object.values(weights).length,
                      )}
                      %
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Highest Priority:</span>
                    <span className="ml-2 font-medium">
                      {Object.entries(weights)
                        .reduce((max, [key, value]) => (value > max.value ? { key, value } : max), {
                          key: "",
                          value: 0,
                        })
                        .key.replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Active Preset:</span>
                    <span className="ml-2 font-medium capitalize">{activePreset}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Specific Priorities Tab */}
        <TabsContent value="priorities" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* High Priority Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">High Priority Clients</CardTitle>
                <CardDescription>Select client groups that should receive preferential allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clientGroups.length > 0 ? (
                    clientGroups.map((group) => (
                      <label key={group} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priorities.highPriorityClients.includes(group)}
                          onChange={() => togglePriority("highPriorityClients", group)}
                          className="rounded"
                        />
                        <span className="text-sm">{group}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No client groups found in data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Critical Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Critical Skills</CardTitle>
                <CardDescription>Mark skills as critical for priority matching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {workerSkills.length > 0 ? (
                    workerSkills.map((skill) => (
                      <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priorities.criticalSkills.includes(skill)}
                          onChange={() => togglePriority("criticalSkills", skill)}
                          className="rounded"
                        />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills found in worker data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Urgent Task Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Urgent Task Types</CardTitle>
                <CardDescription>Identify task types that require immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {taskTypes.length > 0 ? (
                    taskTypes.map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priorities.urgentTasks.includes(type)}
                          onChange={() => togglePriority("urgentTasks", type)}
                          className="rounded"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No task types found in data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preferred Workers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preferred Worker Groups</CardTitle>
                <CardDescription>Select worker groups for preferential assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workerGroups.length > 0 ? (
                    workerGroups.map((group) => (
                      <label key={group} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priorities.preferredWorkers.includes(group)}
                          onChange={() => togglePriority("preferredWorkers", group)}
                          className="rounded"
                        />
                        <span className="text-sm">{group}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No worker groups found in data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Selection Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-700">Priority Clients:</span>
                  <span className="ml-2 font-medium">{priorities.highPriorityClients.length}</span>
                </div>
                <div>
                  <span className="text-gray-700">Critical Skills:</span>
                  <span className="ml-2 font-medium">{priorities.criticalSkills.length}</span>
                </div>
                <div>
                  <span className="text-gray-700">Urgent Tasks:</span>
                  <span className="ml-2 font-medium">{priorities.urgentTasks.length}</span>
                </div>
                <div>
                  <span className="text-gray-700">Preferred Workers:</span>
                  <span className="ml-2 font-medium">{priorities.preferredWorkers.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Allocation Strategy Presets</CardTitle>
              <CardDescription>Choose from pre-configured allocation strategies or create your own</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(presets).map(([key, preset]) => (
                  <div
                    key={key}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      activePreset === key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => applyPreset(key)}
                  >
                    <h4 className="font-medium mb-2">{preset.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                    <div className="space-y-1">
                      {Object.entries(preset.weights).map(([weightKey, value]) => (
                        <div key={weightKey} className="flex justify-between text-xs">
                          <span className="text-gray-500">
                            {weightKey.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                          </span>
                          <span className="font-medium">{value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {activePreset === "custom" && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Custom Configuration</h4>
                  <p className="text-sm text-yellow-800">
                    You've created a custom weight configuration. You can save this as a new preset or continue with
                    manual adjustments.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
