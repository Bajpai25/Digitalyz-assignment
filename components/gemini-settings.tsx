"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Key, Sparkles, CheckCircle, XCircle } from "lucide-react"

interface GeminiSettingsProps {
  onApiKeyChange?: (apiKey: string) => void
}

export function GeminiSettings({ onApiKeyChange }: GeminiSettingsProps) {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle")

  useEffect(() => {
    // Load API key from localStorage
    const savedApiKey = localStorage.getItem("gemini_api_key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
      onApiKeyChange?.(savedApiKey)
    }
  }, [onApiKeyChange])

  const validateApiKey = async () => {
    if (!apiKey.trim()) return

    setIsValidating(true)
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Hello, this is a test message.",
          apiKey: apiKey.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setValidationStatus("valid")
        localStorage.setItem("gemini_api_key", apiKey.trim())
        onApiKeyChange?.(apiKey.trim())
      } else {
        setValidationStatus("invalid")
        console.error("API Key validation failed:", data.error, data.details)
      }
    } catch (error) {
      setValidationStatus("invalid")
      console.error("Network error during validation:", error)
    } finally {
      setIsValidating(false)
    }
  }

  const clearApiKey = () => {
    setApiKey("")
    setValidationStatus("idle")
    localStorage.removeItem("gemini_api_key")
    onApiKeyChange?.("")
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Gemini AI Configuration
        </CardTitle>
        <CardDescription>
          Configure your Google Gemini API key to unlock advanced AI features including enhanced natural language
          processing, intelligent rule recommendations, and smart data analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gemini-api-key" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Gemini API Key
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="gemini-api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your Gemini API key..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setValidationStatus("idle")
                }}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={validateApiKey} disabled={!apiKey.trim() || isValidating} className="shrink-0">
              {isValidating ? "Validating..." : "Validate"}
            </Button>
          </div>
        </div>

        {validationStatus !== "idle" && (
          <div className="flex items-center gap-2">
            {validationStatus === "valid" ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  API Key Valid
                </Badge>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                  Invalid API Key - Check console for details
                </Badge>
              </>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Enhanced AI Features with Gemini:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Advanced natural language query processing</li>
            <li>• Intelligent business rule generation from descriptions</li>
            <li>• Smart data validation with contextual suggestions</li>
            <li>• Automated error correction and data cleaning</li>
            <li>• Sophisticated pattern analysis and insights</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Troubleshooting API Key Issues:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Ensure your API key starts with "AIza" and is from Google AI Studio</li>
            <li>• Verify the API key has Gemini API access enabled</li>
            <li>• Check that you haven't exceeded your API quota limits</li>
            <li>• Make sure there are no extra spaces when pasting the key</li>
          </ul>
        </div>

        {apiKey && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={clearApiKey}>
              Clear API Key
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
