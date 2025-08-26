# Prompt Formatter Frontend

A modern React application for creating, customizing, and exporting AI prompt templates with Notion integration.

## Features

### ✅ Completed Features

- **Authentication System**: Supabase-based auth with protected routes
- **Template Catalog**: Browse, search, and filter templates by category
- **Template Detail**: Dynamic form generation based on template variables with live preview
- **Favorites System**: Save and manage favorite templates
- **Notion Integration**: Connect Notion workspace and export templates directly
- **Admin Panel**: Create, edit, and delete templates (CRUD operations)
- **Global Variables**: Set default values for commonly used variables
- **Responsive Design**: Mobile-friendly interface with Material-UI components
- **Toast Notifications**: User feedback for all actions
- **Dark/Light Theme**: Theme toggle with persistent preferences

### 🚧 In Progress

- Command palette (kbar) for quick template search
- Advanced keyboard shortcuts
- Analytics event hooks
- Team workspaces and shared libraries

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Authentication**: Supabase Auth
- **Styling**: Emotion (CSS-in-JS)
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # App layout and navigation
│   └── ProtectedRoute  # Route protection component
├── contexts/           # React contexts
│   ├── auth/          # Authentication context
│   └── ToastContext   # Toast notifications
├── hooks/              # Custom React hooks
│   ├── useAuth        # Authentication hook
│   └── useDebounce    # Debounced input hook
├── pages/              # Page components
│   ├── Home           # Dashboard overview
│   ├── Templates      # Template catalog
│   ├── TemplateDetail # Template editor with variables
│   ├── Favorites      # User's favorite templates
│   ├── Settings       # App settings and integrations
│   └── AdminTemplates # Admin CRUD operations
├── services/           # API service layer
│   └── api.ts         # HTTP client and API methods
├── types/              # TypeScript type definitions
├── theme/              # Theme configuration
└── utils/              # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project with authentication enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_backend_api_url
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### For Users

1. **Browse Templates**: Visit `/templates` to explore available prompt templates
2. **Customize Templates**: Click on a template to fill in variables and see live preview
3. **Export to Notion**: Connect your Notion workspace and export templates directly
4. **Manage Favorites**: Save frequently used templates for quick access
5. **Global Variables**: Set default values in settings to speed up template usage

### For Admins

1. **Access Admin Panel**: Navigate to `/admin/templates`
2. **Create Templates**: Add new templates with JSON content and variables
3. **Edit Templates**: Modify existing templates and preview variable extraction
4. **Delete Templates**: Remove outdated or unused templates

## API Integration

The frontend integrates with a backend API that provides:

- Template CRUD operations
- User authentication and management
- Favorites system
- Notion OAuth and export functionality

### Key API Endpoints

- `GET /api/templates` - List templates with search/filter
- `GET /api/templates/:id` - Get template details
- `POST /api/templates` - Create new template
- `PATCH /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/favorites/toggle` - Toggle favorite status
- `POST /api/templates/:id/export` - Export to Notion

## Template Format

Templates use a JSON structure with placeholders for variables:

```json
{
  "format": "rich_text_blocks",
  "title": "SEO Blog Writer",
  "blocks": [
    {
      "type": "heading_2",
      "text": "SEO Blog Prompt"
    },
    {
      "type": "paragraph",
      "text": "Write a {length}-word blog post about {topic} for {audience} in a {tone} tone."
    }
  ]
}
```

Variables are automatically extracted and form fields are generated dynamically.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team
