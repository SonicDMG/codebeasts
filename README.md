# CodeBeasts AI Generator

<div align="center">
  <img src="public/images/logo.png" alt="CodeBeasts Logo" width="300px" />
</div>

Turn your GitHub profile into a unique AI-generated creature! This project analyzes your GitHub activity and programming languages to create a personalized pixel art mascot using AI image generation.

## Technical Overview

CodeBeasts is a full-stack application built with modern technologies:

### Application Framework
- **[Next.js](https://nextjs.org/)**: React framework using the App Router for server-side rendering, API routes, and static generation.
- **[React](https://reactjs.org/)**: Frontend library for building user interfaces.
- **[TypeScript](https://www.typescriptlang.org/)**: For type-safe development.

### Styling & UI
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework for responsive styling.
- **[Shadcn UI](https://ui.shadcn.com/)**: Accessible and customizable UI components built on Radix UI and Tailwind CSS.

### Data Fetching & State
- **[Tanstack Query (React Query)](https://tanstack.com/query/latest)**: For efficient client-side data fetching and caching (used in the gallery).
- **Standard `fetch`**: Used within Next.js Server Components and API routes.

### AI & Backend
- **[Langflow](https://langflow.new)**: Orchestration layer for the AI agent, connecting GitHub analysis, prompt generation, and image generation. Hosted via DataStax Cloud.
- **[EverArt](https://everart.ai)**: AI image generation service accessed via Langflow.
- **[Astra DB](https://astra.datastax.com/)**: Cloud-native NoSQL database (based on Apache Cassandra®) used to store generated images and user data.
- **Next.js API Routes**: Backend logic for interacting with Langflow and Astra DB is handled within the Next.js application at `app/api/`.

## Live Demo

Visit <a href="https://codebeasts.onrender.com/" target="_blank">CodeBeasts</a> to try it out!

## Langflow Workflow

This project utilizes a workflow built and hosted with [Langflow](https://langflow.new), orchestrated via DataStax Cloud. The core logic involves:

1.  Receiving a GitHub username.
2.  Analyzing the user's profile and repository languages (via custom tools/logic within the flow).
3.  Generating a descriptive prompt for an AI image model based on the analysis.
4.  Calling the EverArt image generation tool with the prompt.
5.  Returning the generated image URL.

You can view the specific flow structure used for this project here:
[https://langflow.new/ui/f/codebeasts](https://langflow.new/ui/f/codebeasts)

*(Note: The public link shows the structure; the production version runs on a hosted instance.)*

## Features

- Agentic AI orchestration using Langflow.
- GitHub profile analysis.
- AI-powered image generation using EverArt.
- Persistent storage of generated images using Astra DB.
- Gallery view for browsing generated beasts.
- Dynamic Open Graph and Twitter Card image generation for link previews.
- Downloadable and shareable mascot images.
- Built with Next.js App Router for optimal performance.
- Styled with Tailwind CSS and Shadcn UI components.

## Project Structure

```
codebeasts/
├── app/                # Next.js App Router directory
│   ├── api/            # API route handlers
│   ├── components/     # React components (UI, specific features)
│   ├── gallery/        # Gallery page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Shared utilities and data fetching logic
│   ├── types/          # TypeScript type definitions
│   └── page.tsx        # Main index page component
│   └── layout.tsx      # Root layout component
├── public/             # Static assets (images, fonts)
├── .env.local          # Local environment variables (GITIGNORED!)
├── .env.example        # Example environment variables
├── next.config.js      # Next.js configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project dependencies and scripts
├── render.yaml         # Render deployment configuration
└── README.md           # This file
```

## Getting Started & Setup Instructions

Follow these steps to set up and run the project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/codebeasts.git # Replace with actual repo URL
    cd codebeasts
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env.local
        ```
    *   Edit the `.env.local` file and add your required API keys and endpoints. See the Environment Variables section below.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Environment Variables

Create a `.env.local` file in the project root (copy from `.env.example`) and configure the following variables:

```dotenv
# Langflow Configuration (Replace with your actual Langflow instance details)
LANGFLOW_BASE_URL=https://your-langflow-instance.onrender.com
LANGFLOW_FLOW_ID=your_langflow_flow_id_or_endpoint

# EverArt API Key (Store securely, especially in production)
EVERART_API_KEY=your_everart_api_key_here

# Astra DB Credentials (Store securely, especially in production)
ASTRA_DB_ENDPOINT=your_astra_db_api_endpoint_here
ASTRA_DB_APPLICATION_TOKEN=your_astra_db_application_token_here

# --- Client-side variables (must match server-side) ---
# These are exposed to the browser via Next.js
NEXT_PUBLIC_LANGFLOW_BASE_URL=${LANGFLOW_BASE_URL}
NEXT_PUBLIC_LANGFLOW_FLOW_ID=${LANGFLOW_FLOW_ID}

# --- Optional for Deployment ---
# Set this to your public deployment URL if needed for absolute URL generation
# NEXT_PUBLIC_APP_URL=https://your-deployed-app-url.com
```

**Important:**
- Obtain API keys and endpoints from [EverArt](https://everart.ai), [Astra DB](https://astra.datastax.com/), and your [Langflow](https://langflow.new) instance.
- **Never commit your `.env.local` file to Git.** Use Render Environment Groups or Secret Files for production secrets.

## Image Generation Model

This application uses [EverArt](https://everart.ai) for AI image generation, orchestrated via a [Langflow](https://langflow.new) workflow. The specific model used within EverArt might vary depending on the Langflow configuration and EverArt's offerings.

## Deployment

This application is configured for deployment on [Render](https://render.com/) using the included `render.yaml` file. Ensure your environment variables (especially secrets like API keys and database tokens) are configured securely within Render's environment settings.

## Contributing

Contributions are welcome! Please feel free to submit Issues and Pull Requests.
