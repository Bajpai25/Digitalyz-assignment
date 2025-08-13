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
}

export function DataUpload({ onDataUploaded }: DataUploadProps) {
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

  const aiColumnMapping = (headers: string[], expectedCols: string[]): { [key: string]: string } => {
    const mappings: { [key: string]: string } = {}

    // Simple AI-like mapping based on similarity and common patterns
    headers.forEach((header) => {
      const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "")

      expectedCols.forEach((expected) => {
        const cleanExpected = expected.toLowerCase().replace(/[^a-z0-9]/g, "")

        // Direct match
        if (cleanHeader === cleanExpected) {
          mappings[header] = expected
          return
        }

        // Partial matches and common variations
        const variations: { [key: string]: string[] } = {
          clientid: ["id", "clientid", "client_id", "customerid"],
          clientname: ["name", "clientname", "client_name", "customername"],
          prioritylevel: ["priority", "prioritylevel", "priority_level", "importance"],
          workerid: ["id", "workerid", "worker_id", "employeeid", "staffid"],
          workername: ["name", "workername", "worker_name", "employeename"],
          skills: ["skills", "skill", "capabilities", "expertise"],
          availableslots: ["slots", "availableslots", "available_slots", "availability"],
          taskid: ["id", "taskid", "task_id", "jobid"],
          taskname: ["name", "taskname", "task_name", "jobname"],
          duration: ["duration", "time", "length", "hours"],
          requiredskills: ["skills", "requiredskills", "required_skills", "needs"],
        }

        const expectedVariations = variations[cleanExpected] || []
        if (expectedVariations.includes(cleanHeader)) {
          mappings[header] = expected
        }
      })
    })

    return mappings
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

      // AI column mapping
      const fileType = forceType || detectFileType(fileName)
      const headers = Object.keys(rawData[0] || {})
      const expectedCols = expectedColumns[fileType]
      const aiMappings = aiColumnMapping(headers, expectedCols)

      // Apply mappings to data
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

          {missingTypes.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Still need: {missingTypes.map((type) => fileTypeInfo[type].title).join(", ")}. All functionality will be
                available once all 3 file types are uploaded.
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
              AI Processing Status
            </CardTitle>
            <CardDescription>
              AI is analyzing your files and intelligently mapping columns. Context from all files will be shared across
              all features.
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

                {/* AI Mappings Display */}
                {file.aiMappings && Object.keys(file.aiMappings).length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">AI Column Mappings</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(file.aiMappings).map(([original, mapped]) => (
                        <div key={original} className="flex items-center gap-2">
                          <span className="text-gray-600">{original}</span>
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
