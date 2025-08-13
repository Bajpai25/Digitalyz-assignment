"use client"

import { useState } from "react"
import { AIRuleConverter } from "./ai-rule-converter"

interface Rule {
  id: string
  type: "coRun" | "slotRestriction" | "loadLimit" | "phaseWindow" | "patternMatch" | "precedenceOverride"
  name: string
  description: string
  parameters: any
  priority: number
  enabled: boolean
  createdAt: Date
}

interface RuleBuilderProps {
  dataSet: {
    clients: any[]
    workers: any[]
    tasks: any[]
  }
   geminiApiKey: string
}

export function RuleBuilder({ dataSet }: RuleBuilderProps) {
  const [rules, setRules] = useState<Rule[]>([])
  const [activeRuleType, setActiveRuleType] = useState<Rule["type"]>("coRun")
  const [isCreatingRule, setIsCreatingRule] = useState(false)
  const [currentRule, setCurrentRule] = useState<Partial<Rule>>({})
  const [activeTab, setActiveTab] = useState("ai-converter")

  // Extract unique values for dropdowns
  const taskIds = dataSet.tasks.map((task) => task.TaskID).filter(Boolean)
  const clientGroups = [...new Set(dataSet.clients.map((client) => client.GroupTag).filter(Boolean))]
  const workerGroups = [...new Set(dataSet.workers.map((worker) => worker.WorkerGroup).filter(Boolean))]

  const ruleTypes = [
    {
      type: "coRun" as const,
      name: "Co-Run Tasks",
      description: "Ensure specific tasks run together in the same phase",
      icon: "🔗",
    },
    {
      type: "slotRestriction" as const,
      name: "Slot Restriction",
      description: "Limit shared slots between client or worker groups",
      icon: "🚫",
    },
    {
      type: "loadLimit" as const,
      name: "Load Limit",
      description: "Set maximum workload per phase for worker groups",
      icon: "⚖️",
    },
    {
      type: "phaseWindow" as const,
      name: "Phase Window",
      description: "Restrict tasks to specific phases or phase ranges",
      icon: "📅",
    },
    {
      type: "patternMatch" as const,
      name: "Pattern Match",
      description: "Apply rules based on regex patterns in data",
      icon: "🔍",
    },
    {
      type: "precedenceOverride" as const,
      name: "Precedence Override",
      description: "Define rule priority and override behavior",
      icon: "🏆",
    },
  ]

  const createRule = () => {
    if (!currentRule.name || !currentRule.type) return

    const newRule: Rule = {
      id: Date.now().toString(),
      type: currentRule.type,
      name: currentRule.name,
      description: currentRule.description || "",
      parameters: currentRule.parameters || {},
      priority: currentRule.priority || 1,
      enabled: true,
      createdAt: new Date(),
    }

    setRules((prev) => [...prev, newRule])
    setCurrentRule({})
    setIsCreatingRule(false)
  }

  const handleAIRuleCreated = (aiRule: any) => {
    const newRule: Rule = {
      id: Date.now().toString(),
      type: aiRule.type,
      name: aiRule.name,
      description: aiRule.description,
      parameters: aiRule.parameters,
      priority: 1,
      enabled: true,
      createdAt: new Date(),
    }

    setRules((prev) => [...prev, newRule])
  }

  const deleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId))
  }

  const toggleRule = (ruleId: string) => {
    setRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule)))
  }

  const generateRulesConfig = () => {
    const config = {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      rules: rules
        .filter((rule) => rule.enabled)
        .map((rule) => ({
          id: rule.id,
          type: rule.type,
          name: rule.name,
          description: rule.description,
          parameters: rule.parameters,
          priority: rule.priority,
        })),
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "rules-config.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderRuleForm = () => {
    switch (activeRuleType) {
      case "coRun":
        return <CoRunRuleForm dataSet={dataSet} currentRule={currentRule} setCurrentRule={setCurrentRule} />
      case "slotRestriction":
        return (
          <SlotRestrictionRuleForm
            dataSet={dataSet}
            currentRule={currentRule}
            setCurrentRule={setCurrentRule}
            clientGroups={clientGroups}
            workerGroups={workerGroups}
          />
        )
      case "loadLimit":
        return (
          <LoadLimitRuleForm
            dataSet={dataSet}
            currentRule={currentRule}
            setCurrentRule={setCurrentRule}
            workerGroups={workerGroups}
          />
        )
      case "phaseWindow":
        return <PhaseWindowRuleForm dataSet={dataSet} currentRule={currentRule} setCurrentRule={setCurrentRule} />
      case "patternMatch":
        return <PatternMatchRuleForm dataSet={dataSet} currentRule={currentRule} setCurrentRule={setCurrentRule} />
      case "precedenceOverride":
        return (
          <PrecedenceOverrideRuleForm dataSet={dataSet} currentRule={currentRule} setCurrentRule={setCurrentRule} />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("ai-converter")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "ai-converter" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🤖 AI Rule Converter
        </button>
        <button
          onClick={() => setActiveTab("manual-builder")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "manual-builder" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ⚙️ Manual Builder
        </button>
        <button
          onClick={() => setActiveTab("rule-list")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "rule-list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📋 Rule List ({rules.length})
        </button>
      </div>

      {/* AI Rule Converter Tab */}
      {activeTab === "ai-converter" && (
        <div className="bg-white rounded-lg border p-6">
          <AIRuleConverter dataSet={dataSet} onRuleCreated={handleAIRuleCreated} />
        </div>
      )}

      {/* Manual Builder Tab */}
      {activeTab === "manual-builder" && (
        <div className="space-y-6">
          {!isCreatingRule ? (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Create New Rule</h3>
                <button
                  onClick={() => setIsCreatingRule(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + New Rule
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ruleTypes.map((ruleType) => (
                  <div
                    key={ruleType.type}
                    className="p-4 border rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => {
                      setActiveRuleType(ruleType.type)
                      setIsCreatingRule(true)
                      setCurrentRule({ type: ruleType.type })
                    }}
                  >
                    <div className="text-2xl mb-2">{ruleType.icon}</div>
                    <h4 className="font-medium mb-1">{ruleType.name}</h4>
                    <p className="text-sm text-gray-600">{ruleType.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Create {ruleTypes.find((rt) => rt.type === activeRuleType)?.name}
                </h3>
                <button
                  onClick={() => {
                    setIsCreatingRule(false)
                    setCurrentRule({})
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {renderRuleForm()}

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setIsCreatingRule(false)
                    setCurrentRule({})
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createRule}
                  disabled={!currentRule.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Rule
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rule List Tab */}
      {activeTab === "rule-list" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Active Rules ({rules.filter((r) => r.enabled).length})</h3>
              <button
                onClick={generateRulesConfig}
                disabled={rules.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                📥 Export Rules JSON
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No rules created yet</p>
                <p className="text-sm">Use the AI converter or manual builder to create your first rule</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-4 border rounded-lg ${rule.enabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => toggleRule(rule.id)}
                          className="rounded"
                        />
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {ruleTypes.find((rt) => rt.type === rule.type)?.name}
                            </span>
                            <span className="text-xs text-gray-500">Priority: {rule.priority}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {rules.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Rule Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Rules:</span>
                  <span className="ml-2 font-medium">{rules.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Active:</span>
                  <span className="ml-2 font-medium">{rules.filter((r) => r.enabled).length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Most Common:</span>
                  <span className="ml-2 font-medium">
                    {rules.length > 0
                      ? ruleTypes.find(
                          (rt) =>
                            rt.type ===
                            Object.entries(
                              rules.reduce(
                                (acc: Record<string, number>, rule) => {
                                  acc[rule.type] = (acc[rule.type] || 0) + 1
                                  return acc
                                },
                                {} as Record<string, number>,
                              ),
                            ).reduce((a: [string, number], b: [string, number]) => (a[1] > b[1] ? a : b))[0],
                        )?.name || "N/A"
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Avg Priority:</span>
                  <span className="ml-2 font-medium">
                    {rules.length > 0
                      ? (rules.reduce((sum, r) => sum + r.priority, 0) / rules.length).toFixed(1)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Rule Form Components
function CoRunRuleForm({ dataSet, currentRule, setCurrentRule }: any) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>(currentRule.parameters?.tasks || [])

  const handleTaskToggle = (taskId: string) => {
    const newTasks = selectedTasks.includes(taskId)
      ? selectedTasks.filter((id) => id !== taskId)
      : [...selectedTasks, taskId]

    setSelectedTasks(newTasks)
    setCurrentRule((prev: any) => ({
      ...prev,
      parameters: { ...prev.parameters, tasks: newTasks },
    }))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rule Name</label>
        <input
          type="text"
          value={currentRule.name || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="e.g., Critical Tasks Co-Run"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <input
          type="text"
          value={currentRule.description || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="Brief description of this rule"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Select Tasks to Run Together</label>
        <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
          {dataSet.tasks.map((task: any) => (
            <label key={task.TaskID} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTasks.includes(task.TaskID)}
                onChange={() => handleTaskToggle(task.TaskID)}
                className="rounded"
              />
              <span className="text-sm">
                {task.TaskID} - {task.TaskName || "Unnamed Task"}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">Select 2 or more tasks that must run in the same phase</p>
      </div>
    </div>
  )
}

function SlotRestrictionRuleForm({ dataSet, currentRule, setCurrentRule, clientGroups, workerGroups }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rule Name</label>
        <input
          type="text"
          value={currentRule.name || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="e.g., VIP Client Slot Restriction"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <input
          type="text"
          value={currentRule.description || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="Brief description of this rule"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Group Type</label>
          <select
            value={currentRule.parameters?.groupType || "client"}
            onChange={(e) =>
              setCurrentRule((prev: any) => ({
                ...prev,
                parameters: { ...prev.parameters, groupType: e.target.value },
              }))
            }
            className="w-full p-2 border rounded-lg"
          >
            <option value="client">Client Group</option>
            <option value="worker">Worker Group</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Select Group</label>
          <select
            value={currentRule.parameters?.groupId || ""}
            onChange={(e) =>
              setCurrentRule((prev: any) => ({
                ...prev,
                parameters: { ...prev.parameters, groupId: e.target.value },
              }))
            }
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Select a group</option>
            {(currentRule.parameters?.groupType === "worker" ? workerGroups : clientGroups).map((group: string) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Minimum Common Slots</label>
        <input
          type="number"
          min="1"
          value={currentRule.parameters?.minCommonSlots || 1}
          onChange={(e) =>
            setCurrentRule((prev: any) => ({
              ...prev,
              parameters: { ...prev.parameters, minCommonSlots: Number.parseInt(e.target.value) },
            }))
          }
          className="w-full p-2 border rounded-lg"
        />
      </div>
    </div>
  )
}

function LoadLimitRuleForm({ dataSet, currentRule, setCurrentRule, workerGroups }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rule Name</label>
        <input
          type="text"
          value={currentRule.name || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="e.g., Senior Developer Load Limit"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <input
          type="text"
          value={currentRule.description || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="Brief description of this rule"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Worker Group</label>
        <select
          value={currentRule.parameters?.workerGroup || ""}
          onChange={(e) =>
            setCurrentRule((prev: any) => ({
              ...prev,
              parameters: { ...prev.parameters, workerGroup: e.target.value },
            }))
          }
          className="w-full p-2 border rounded-lg"
        >
          <option value="">Select worker group</option>
          {workerGroups.map((group: string) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Maximum Slots Per Phase</label>
        <input
          type="number"
          min="1"
          value={currentRule.parameters?.maxSlotsPerPhase || 1}
          onChange={(e) =>
            setCurrentRule((prev: any) => ({
              ...prev,
              parameters: { ...prev.parameters, maxSlotsPerPhase: Number.parseInt(e.target.value) },
            }))
          }
          className="w-full p-2 border rounded-lg"
        />
      </div>
    </div>
  )
}

function PhaseWindowRuleForm({ dataSet, currentRule, setCurrentRule }: any) {
  const [selectedPhases, setSelectedPhases] = useState<number[]>(currentRule.parameters?.allowedPhases || [])

  const handlePhaseToggle = (phase: number) => {
    const newPhases = selectedPhases.includes(phase)
      ? selectedPhases.filter((p) => p !== phase)
      : [...selectedPhases, phase].sort((a, b) => a - b)

    setSelectedPhases(newPhases)
    setCurrentRule((prev: any) => ({
      ...prev,
      parameters: { ...prev.parameters, allowedPhases: newPhases },
    }))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rule Name</label>
        <input
          type="text"
          value={currentRule.name || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="e.g., Critical Task Phase Window"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <input
          type="text"
          value={currentRule.description || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="Brief description of this rule"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Task ID</label>
        <select
          value={currentRule.parameters?.taskId || ""}
          onChange={(e) =>
            setCurrentRule((prev: any) => ({
              ...prev,
              parameters: { ...prev.parameters, taskId: e.target.value },
            }))
          }
          className="w-full p-2 border rounded-lg"
        >
          <option value="">Select task</option>
          {dataSet.tasks.map((task: any) => (
            <option key={task.TaskID} value={task.TaskID}>
              {task.TaskID} - {task.TaskName || "Unnamed Task"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Allowed Phases</label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((phase) => (
            <label key={phase} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedPhases.includes(phase)}
                onChange={() => handlePhaseToggle(phase)}
                className="rounded"
              />
              <span className="text-sm">Phase {phase}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function PatternMatchRuleForm({ dataSet, currentRule, setCurrentRule }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rule Name</label>
        <input
          type="text"
          value={currentRule.name || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="e.g., High Priority Pattern Match"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <input
          type="text"
          value={currentRule.description || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="Brief description of this rule"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Regex Pattern</label>
        <input
          type="text"
          value={currentRule.parameters?.pattern || ""}
          onChange={(e) =>
            setCurrentRule((prev: any) => ({
              ...prev,
              parameters: { ...prev.parameters, pattern: e.target.value },
            }))
          }
          className="w-full p-2 border rounded-lg font-mono"
          placeholder="e.g., ^URGENT_.*"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Target Field</label>
        <select
          value={currentRule.parameters?.targetField || ""}
          onChange={(e) =>
            setCurrentRule((prev: any) => ({
              ...prev,
              parameters: { ...prev.parameters, targetField: e.target.value },
            }))
          }
          className="w-full p-2 border rounded-lg"
        >
          <option value="">Select field to match</option>
          <option value="TaskID">Task ID</option>
          <option value="TaskName">Task Name</option>
          <option value="ClientID">Client ID</option>
          <option value="WorkerID">Worker ID</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Action Template</label>
        <select
          value={currentRule.parameters?.actionTemplate || ""}
          onChange={(e) =>
            setCurrentRule((prev: any) => ({
              ...prev,
              parameters: { ...prev.parameters, actionTemplate: e.target.value },
            }))
          }
          className="w-full p-2 border rounded-lg"
        >
          <option value="">Select action</option>
          <option value="setPriority">Set Priority Level</option>
          <option value="assignPhase">Assign to Specific Phase</option>
          <option value="requireSkill">Require Specific Skill</option>
        </select>
      </div>
    </div>
  )
}

function PrecedenceOverrideRuleForm({ dataSet, currentRule, setCurrentRule }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rule Name</label>
        <input
          type="text"
          value={currentRule.name || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="e.g., Executive Override Rule"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <input
          type="text"
          value={currentRule.description || ""}
          onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border rounded-lg"
          placeholder="Brief description of this rule"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Override Type</label>
          <select
            value={currentRule.parameters?.overrideType || "global"}
            onChange={(e) =>
              setCurrentRule((prev: any) => ({
                ...prev,
                parameters: { ...prev.parameters, overrideType: e.target.value },
              }))
            }
            className="w-full p-2 border rounded-lg"
          >
            <option value="global">Global Override</option>
            <option value="specific">Specific Override</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Priority Level</label>
          <input
            type="number"
            min="1"
            max="10"
            value={currentRule.priority || 1}
            onChange={(e) => setCurrentRule((prev: any) => ({ ...prev, priority: Number.parseInt(e.target.value) }))}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Override Conditions</label>
        <textarea
          value={currentRule.parameters?.conditions || ""}
          onChange={(e) =>
            setCurrentRule((prev: any) => ({
              ...prev,
              parameters: { ...prev.parameters, conditions: e.target.value },
            }))
          }
          className="w-full p-2 border rounded-lg h-24"
          placeholder="Describe when this override should apply..."
        />
      </div>
    </div>
  )
}
