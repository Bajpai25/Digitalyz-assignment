# AI-Enabled Resource Allocation Configurator

A sophisticated web application that transforms complex resource allocation configuration into an accessible, AI-enhanced user experience. Upload your data files, create business rules through natural language, and export clean configurations for downstream processing systems.

## 🚀 Features

### Data Ingestion & Processing
- **Smart File Upload**: Drag-and-drop CSV/XLSX files with automatic format detection
- **AI-Powered Column Mapping**: Automatically maps incorrectly named headers to correct fields
- **Multi-File Support**: Upload clients, workers, and tasks files separately with shared context
- **Real-Time Preview**: Instant data preview with inline editing capabilities

### Advanced Validation Engine
- **12 Core Validation Rules**: Comprehensive data validation including:
  - Missing required columns and duplicate IDs
  - Malformed data formats and out-of-range values
  - Broken JSON validation and unknown references
  - Circular co-run groups and conflicting rules
  - Worker overload analysis and phase-slot saturation
  - Skill-coverage matrix and max-concurrency feasibility
- **AI-Powered Insights**: Intelligent recommendations for data quality improvements
- **Severity-Based Filtering**: Focus on critical, warning, or info-level issues

### Natural Language Search
- **Plain English Queries**: Search data using natural language like "All tasks with duration more than 1 phase"
- **Smart Field Mapping**: Automatically recognizes and maps natural language terms to database fields
- **Complex Conditions**: Support for numeric comparisons, text matching, and array operations
- **Visual Highlighting**: Matching cells highlighted in data grid with search indicators

### Business Rules Engine
- **6 Rule Types**: Create comprehensive business rules including:
  - Co-run task groupings
  - Slot restrictions and load limits
  - Phase window constraints
  - Pattern matching with regex
  - Precedence overrides
- **AI Rule Converter**: Write rules in plain English and convert to structured format
- **Rule Management**: Enable/disable rules, set priorities, and export configurations

### Prioritization Controls
- **Factor Weights**: Adjust importance of client priority, skill matching, task urgency, etc.
- **Strategy Presets**: Pre-configured settings for different business scenarios
- **Specific Priorities**: Set high-value clients, critical skills, and preferred workers
- **Visual Feedback**: Real-time weight indicators and allocation summaries

### Export & Integration
- **Multiple Export Formats**: CSV, XLSX, and JSON exports
- **Complete Configuration**: Export rules, priorities, and validation reports
- **Project Packages**: Download complete project configurations
- **Integration Ready**: Clean data and structured configs for downstream systems

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 with App Router
- **UI Components**: shadcn/ui with Tailwind CSS
- **Styling**: Tailwind CSS v4 with custom design system
- **Icons**: Lucide React
- **File Processing**: CSV/XLSX parsing with AI-powered column mapping
- **TypeScript**: Full type safety throughout the application

## 📦 Installation

1. **Clone the repository**:
   \`\`\`bash
   git clone https://github.com/Bajpai25/Digitalyz-assignment.git
   cd ai-resource-configurator
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   \`\`\`

3. **Start the development server**:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   \`\`\`

4. **Open your browser** and navigate to:
   \`\`\`
   http://localhost:3000
   \`\`\`

## 🎯 Usage Guide

### Getting Started
1. **Landing Page**: Review the application overview and features
2. **Dashboard Access**: Click "Get Started" to access the main dashboard

### Data Upload Process
1. **Upload Tab**: Upload your CSV/XLSX files for clients, workers, and tasks
2. **AI Column Mapping**: Review and confirm automatic column mappings
3. **Data Preview**: Verify uploaded data with inline editing capabilities

### Data Management
1. **Data Tab**: View all uploaded data in interactive grids
2. **Natural Language Search**: Use plain English to find specific data
3. **Validation Panel**: Review and resolve data quality issues

### Rule Configuration
1. **Rules Tab**: Create business rules using two methods:
   - **AI Converter**: Write rules in natural language
   - **Manual Builder**: Use structured forms for each rule type
2. **Rule Management**: Enable/disable rules and set priorities

### Export & Download
1. **Export Tab**: Download processed data and configurations
2. **Multiple Formats**: Choose from CSV, XLSX, or JSON exports
3. **Complete Packages**: Download full project configurations

## 📁 Project Structure

\`\`\`
├── app/
│   ├── dashboard/          # Main dashboard page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── ai-rule-converter.tsx
│   ├── data-grid.tsx
│   ├── data-upload.tsx
│   ├── export-interface.tsx
│   ├── natural-language-search.tsx
│   ├── prioritization-controls.tsx
│   ├── rule-builder.tsx
│   └── validation-panel.tsx
├── samples/               # Sample CSV files for testing
│   ├── clients.csv
│   ├── workers.csv
│   └── tasks.csv
└── README.md
\`\`\`

## 🧪 Sample Data

The project includes sample CSV files in the `/samples` directory:
- **clients.csv**: Sample client data with priorities and requirements
- **workers.csv**: Sample worker data with skills and availability
- **tasks.csv**: Sample task data with durations and constraints

Use these files to explore the application's functionality before uploading your own data.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing [Issues] https://github.com/Bajpai25/Digitalyz-assignment
2. Create a new issue with detailed information
3. Include sample data and steps to reproduce any problems

## 🎉 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [shadcn/ui](https://ui.shadcn.com/)
- Designed with accessibility and user experience in mind
- AI-powered features for enhanced productivity

---

**Ready to transform your resource allocation process?** Upload your data files and experience the power of AI-enhanced configuration management.
