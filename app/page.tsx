import { Upload, Brain, Settings, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Data Alchemist</h1>
              <p className="text-sm text-slate-600">AI-Powered Resource Allocation Configurator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Transform Spreadsheet Chaos into
            <span className="text-blue-600"> Intelligent Allocation</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Upload your messy CSV files, let AI clean and validate your data, create business rules in plain English,
            and export production-ready configurations.
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">1. Upload Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Drop your CSV/XLSX files for clients, workers, and tasks. AI automatically maps columns even with wrong
                headers.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">2. AI Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Smart validation engine checks for errors, suggests fixes, and lets you search data with natural
                language.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">3. Create Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Define business rules in plain English. AI converts them to proper configurations and suggests
                optimizations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">4. Export Clean</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download validated data and rules.json ready for your allocation system. No more spreadsheet nightmares.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Start?</CardTitle>
              <CardDescription className="text-lg">
                Upload your first dataset and experience the magic of AI-powered data processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
                <a href="/dashboard">
                  <Upload className="w-5 h-5 mr-2" />
                  Start Data Upload
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
