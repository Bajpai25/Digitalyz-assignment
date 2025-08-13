"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Brain,
  Zap,
  Users,
  Briefcase,
  ClipboardList,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Papa from "papaparse"
import * as XLSX from "xlsx"

interface UploadedFile {
  name: string
  type: "clients" | "workers" | "tasks"
  status: "uploading" | "processing" | "mapping" | "completed" | "error"
  progress: number
  rowCount?: number
  errors?: string[]
  aiMappings?: { [key: string]: string }
  data?: any[]
}

interface DataUploadProps {
  onDataUploaded: (type: "clients" | "workers" | "tasks", data: any[]) => void
  geminiApiKey?: string // Added geminiApiKey prop for AI-powered header mapping
}

export function DataUpload({ onDataUploaded, geminiApiKey }: DataUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Expected column mappings for AI-powered parsing
  const expectedColumns = {
    clients: ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"],
    workers: [
      "WorkerID",
      "WorkerName",
      "Skills",
      "AvailableSlots",
      "MaxLoadPerPhase",
      "WorkerGroup",
      "QualificationLevel",
    ],
    tasks: ["TaskID", "TaskName", "Category", "Duration", "RequiredSkills", "PreferredPhases", "MaxConcurrent"],
  }

  const fileTypeInfo = {
    clients: {
      icon: Users,
      title: "Clients Data",
      description: "Client information, priorities, and requested tasks",
      sampleColumns: "ClientID, ClientName, PriorityLevel, RequestedTaskIDs...",
    },
    workers: {
      icon: Briefcase,
      title: "Workers Data",
      description: "Worker skills, availability, and capacity information",
      sampleColumns: "WorkerID, WorkerName, Skills, AvailableSlots...",
    },
    tasks: {
      icon: ClipboardList,
      title: "Tasks Data",
      description: "Task requirements, duration, and constraints",
      sampleColumns: "TaskID, TaskName, Duration, RequiredSkills...",
    },
  }

  const detectFileType = (fileName: string): "clients" | "workers" | "tasks" => {
    const name = fileName.toLowerCase()
    if (name.includes("worker") || name.includes("employee") || name.includes("staff")) return "workers"
    if (name.includes("task") || name.includes("job") || name.includes("work")) return "tasks"
    return "clients"
  }

  const aiColumnMapping = async (
    headers: string[],
    expectedCols: string[],
    fileType: string,
  ): Promise<{ [key: string]: string }> => {
    const mappings: { [key: string]: string } = {}

    // Try Gemini AI first if API key is available
    if (geminiApiKey) {
      try {
        const geminiMappings = await getGeminiHeaderMappings(headers, expectedCols, fileType)
        if (geminiMappings && Object.keys(geminiMappings).length > 0) {
          return geminiMappings
        }
      } catch (error) {
        console.log("Gemini mapping failed, falling back to local algorithm:", error)
      }
    }

    // Enhanced local algorithm with better pattern matching
    headers.forEach((header) => {
      const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "")

      expectedCols.forEach((expected) => {
        const cleanExpected = expected.toLowerCase().replace(/[^a-z0-9]/g, "")

        // Direct match
        if (cleanHeader === cleanExpected) {
          mappings[header] = expected
          return
        }

        // Enhanced pattern matching with regex and similarity scoring
        const patterns: { [key: string]: RegExp[] } = {
          clientid: [/^(client|customer|cust)_?id$/i, /^id$/i, /^c_?id$/i],
          clientname: [/^(client|customer|cust)_?name$/i, /^name$/i, /^c_?name$/i],
          prioritylevel: [/^priority$/i, /^pref$/i, /^importance$/i, /^level$/i, /^priority_?level$/i],
          requestedtaskids: [/^(requested|req)_?task/i, /^task_?ids?$/i, /^tasks$/i],
          grouptag: [/^group$/i, /^tag$/i, /^category$/i, /^type$/i],
          attributesjson: [/^attributes$/i, /^json$/i, /^metadata$/i, /^extra$/i],

          workerid: [/^(worker|employee|emp|staff)_?id$/i, /^id$/i, /^w_?id$/i],
          workername: [/^(worker|employee|emp|staff)_?name$/i, /^name$/i, /^w_?name$/i],
          skills: [/^skills?$/i, /^capabilities$/i, /^expertise$/i, /^abilities$/i],
          availableslots: [/^(available|avail)_?slots?$/i, /^slots?$/i, /^availability$/i, /^schedule$/i],
          maxloadperphase: [/^max_?load$/i, /^capacity$/i, /^limit$/i, /^max_?per_?phase$/i],
          workergroup: [/^(worker_?)?group$/i, /^team$/i, /^department$/i, /^unit$/i],
          qualificationlevel: [/^(qualification|qual)_?level$/i, /^level$/i, /^grade$/i, /^rank$/i],

          taskid: [/^(task|job|work)_?id$/i, /^id$/i, /^t_?id$/i],
          taskname: [/^(task|job|work)_?name$/i, /^name$/i, /^title$/i, /^t_?name$/i],
          category: [/^category$/i, /^type$/i, /^kind$/i, /^class$/i],
          duration: [/^duration$/i, /^time$/i, /^length$/i, /^hours?$/i, /^days?$/i],
          requiredskills: [/^(required|req)_?skills?$/i, /^skills?$/i, /^needs$/i, /^requirements$/i],
          preferredphases: [/^(preferred|pref)_?phases?$/i, /^phases?$/i, /^schedule$/i, /^timing$/i],
          maxconcurrent: [/^max_?concurrent$/i, /^concurrent$/i, /^parallel$/i, /^simultaneous$/i],
        }

        const expectedPatterns = patterns[cleanExpected] || []
        const originalHeader = header.trim()

        for (const pattern of expectedPatterns) {
          if (pattern.test(originalHeader)) {
            mappings[header] = expected
            return
          }
        }

        // Fuzzy matching for partial similarities
        if (
          cleanHeader.includes(cleanExpected.substring(0, 4)) ||
          cleanExpected.includes(cleanHeader.substring(0, 4))
        ) {
          mappings[header] = expected
        }
      })
    })

    return mappings
  }

  const getGeminiHeaderMappings = async (
    headers: string[],
    expectedCols: string[],
    fileType: string,
  ): Promise<{ [key: string]: string }> => {
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: geminiApiKey,
          prompt: `You are an expert data analyst. Map the following CSV headers to the correct standardized column names.

File Type: ${fileType}
Current Headers: ${headers.join(", ")}
Expected Standard Headers: ${expectedCols.join(", ")}

Rules:
- Map each current header to the most appropriate standard header
- If a header doesn't match any standard header, don't include it in the mapping
- Consider common abbreviations and variations (e.g., "pref" → "PriorityLevel", "id" → appropriate ID field)
- Be case-sensitive in your output for standard headers

Return ONLY a JSON object with the mappings:
{"current_header": "StandardHeader", ...}

Example: {"pref": "PriorityLevel", "name": "ClientName", "id": "ClientID"}`,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.text) {
        // Extract JSON from Gemini response
        let responseText = result.text
        if (typeof responseText === "object" && responseText.text) {
          responseText = responseText.text
        }

        // Remove markdown code blocks if present
        responseText = responseText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim()

        try {
          const mappings = JSON.parse(responseText)
          console.log("Gemini header mappings:", mappings)
          return mappings
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", parseError)
          return {}
        }
      }

      return {}
    } catch (error) {
      console.error("Gemini header mapping error:", error)
      return {}
    }
  }

  const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split(".").pop()?.toLowerCase()

      if (fileExtension === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data as any[])
          },
          error: (error) => {
            reject(error)
          },
        })
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: "array" })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)
            resolve(jsonData)
          } catch (error) {
            reject(error)
          }
        }
        reader.readAsArrayBuffer(file)
      } else {
        reject(new Error("Unsupported file format"))
      }
    })
  }

  const processFile = async (file: File, fileName: string, forceType?: "clients" | "workers" | "tasks") => {
    try {
      // Update status to processing
      setUploadedFiles((prev) =>
        prev.map((f) => (f.name === fileName ? { ...f, status: "processing", progress: 25 } : f)),
      )

      // Parse the file
      const rawData = await parseFile(file)

      // Update status to mapping
      setUploadedFiles((prev) => prev.map((f) => (f.name === fileName ? { ...f, status: "mapping", progress: 50 } : f)))

      const fileType = forceType || detectFileType(fileName)
      const headers = Object.keys(rawData[0] || {})
      const expectedCols = expectedColumns[fileType]
      const aiMappings = await aiColumnMapping(headers, expectedCols, fileType)

      // Apply mappings to data and fix headers
      const mappedData = rawData.map((row) => {
        const mappedRow: any = {}
        Object.entries(row).forEach(([key, value]) => {
          const mappedKey = aiMappings[key] || key
          mappedRow[mappedKey] = value
        })
        return mappedRow
      })

      // Update status to completed
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.name === fileName
            ? {
                ...f,
                status: "completed",
                progress: 100,
                rowCount: mappedData.length,
                aiMappings,
                data: mappedData,
              }
            : f,
        ),
      )

      // Notify parent component
      onDataUploaded(fileType, mappedData)
    } catch (error) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.name === fileName
            ? {
                ...f,
                status: "error",
                errors: [error instanceof Error ? error.message : "Unknown error"],
              }
            : f,
        ),
      )
    }
  }

  const onDrop = (acceptedFiles: File[]) => {
    setIsProcessing(true)

    acceptedFiles.forEach((file) => {
      const fileType = detectFileType(file.name)

      const newFile: UploadedFile = {
        name: file.name,
        type: fileType,
        status: "uploading",
        progress: 0,
      }

      setUploadedFiles((prev) => [...prev, newFile])
      processFile(file, file.name)
    })

    setIsProcessing(false)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: true,
  })

  const uploadedTypes = uploadedFiles.filter((f) => f.status === "completed").map((f) => f.type)
  const missingTypes = (["clients", "workers", "tasks"] as const).filter((type) => !uploadedTypes.includes(type))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Required Data Files
          </CardTitle>
          <CardDescription>
            Upload all 3 file types for complete functionality. The system will use context from all files together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(
              Object.entries(fileTypeInfo) as [
                keyof typeof fileTypeInfo,
                (typeof fileTypeInfo)[keyof typeof fileTypeInfo],
              ][]
            ).map(([type, info]) => {
              const Icon = info.icon
              const isUploaded = uploadedTypes.includes(type)

              return (
                <div
                  key={type}
                  className={`p-4 border rounded-lg ${isUploaded ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${isUploaded ? "text-green-600" : "text-gray-500"}`} />
                    <span className={`font-medium ${isUploaded ? "text-green-800" : "text-gray-700"}`}>
                      {info.title}
                    </span>
                    {isUploaded && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{info.description}</p>
                  <p className="text-xs text-gray-500">{info.sampleColumns}</p>
                </div>
              )
            })}
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Smart Header Examples</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">"pref"</span>
                <span className="text-gray-400">→</span>
                <span className="text-blue-600">PriorityLevel</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">"id"</span>
                <span className="text-gray-400">→</span>
                <span className="text-blue-600">ClientID</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">"name"</span>
                <span className="text-gray-400">→</span>
                <span className="text-blue-600">ClientName</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">"skills"</span>
                <span className="text-gray-400">→</span>
                <span className="text-blue-600">RequiredSkills</span>
              </div>
            </div>
          </div>

          {missingTypes.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Still need: {missingTypes.map((type) => fileTypeInfo[type].title).join(", ")}. Headers will be
                automatically mapped for all file types.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Smart Data Upload
          </CardTitle>
          <CardDescription>
            Upload your CSV or XLSX files. Our AI automatically detects file types and maps columns, even with incorrect
            headers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                <Brain className="w-6 h-6 text-blue-600 absolute -top-1 -right-1 bg-white rounded-full p-1" />
              </div>
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2 font-medium">Drag & drop your files here, or click to select</p>
                  <p className="text-sm text-gray-500 mb-3">
                    Supports: CSV, XLSX files for clients, workers, and tasks
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                    <Zap className="w-3 h-3" />
                    <span>AI-powered column mapping & context sharing</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Processing Status */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Header Mapping Status {/* Updated title */}
            </CardTitle>
            <CardDescription>
              {geminiApiKey
                ? "Gemini AI is analyzing headers and mapping them to standard format."
                : "Local AI is analyzing headers and mapping them to standard format."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="secondary" className="capitalize">
                      {file.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === "completed" && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">{file.rowCount} rows</span>
                      </>
                    )}
                    {file.status === "error" && <AlertCircle className="w-4 h-4 text-red-600" />}
                  </div>
                </div>

                <Progress value={file.progress} className="h-2" />

                <div className="text-sm text-gray-600">
                  {file.status === "uploading" && "Uploading file..."}
                  {file.status === "processing" && "Parsing file structure..."}
                  {file.status === "mapping" && "AI mapping columns to expected format..."}
                  {file.status === "completed" && "Processing complete! Context available for all features."}
                  {file.status === "error" && "Error processing file"}
                </div>

                {/* Enhanced AI Mappings Display */}
                {file.aiMappings && Object.keys(file.aiMappings).length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {geminiApiKey ? "Gemini AI" : "Local AI"} Header Mappings
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {Object.keys(file.aiMappings).length} mapped
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(file.aiMappings).map(([original, mapped]) => (
                        <div key={original} className="flex items-center gap-2 p-2 bg-white rounded border">
                          <span className="text-gray-600 font-mono">{original}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-blue-600 font-medium">{mapped}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {file.errors && file.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{file.errors.join(", ")}</AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {uploadedFiles.some((f) => f.status === "completed") && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Files processed successfully! AI has mapped {uploadedFiles.filter((f) => f.status === "completed").length}{" "}
            file(s) and context is shared across all features.
            {missingTypes.length === 0
              ? " All functionality is now available!"
              : ` Upload ${missingTypes.length} more file type(s) for complete functionality.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
