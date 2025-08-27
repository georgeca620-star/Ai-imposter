# Overview

This is a real-time multiplayer social deduction game called "AI Imposter" where human players chat and try to identify which player is an AI. The application features a React frontend with a Node.js/Express backend, real-time WebSocket communication, and PostgreSQL database storage with Drizzle ORM. Players join game rooms, participate in discussion phases, vote on who they think is the AI, and see results showing whether humans or AI won.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript** - Modern component-based UI using functional components and hooks
- **Vite** - Fast development server and build tool with hot module replacement
- **Wouter** - Lightweight client-side routing for navigation between lobby and game pages
- **TanStack Query** - Server state management for API calls and caching
- **Tailwind CSS + shadcn/ui** - Utility-first styling with pre-built component library
- **WebSocket Integration** - Custom hook for real-time game communication

## Backend Architecture
- **Express.js** - RESTful API server handling HTTP requests and WebSocket connections
- **WebSocket Server** - Real-time bidirectional communication for game events, chat messages, and state synchronization
- **Memory Storage with Database Schema** - Currently uses in-memory storage with interfaces designed for easy PostgreSQL migration
- **AI Service Integration** - OpenAI API integration for generating AI player responses with configurable personalities
- **Modular Route System** - Clean separation of concerns with dedicated route handlers

## Database Design
- **Games Table** - Stores game sessions with room codes, status, AI personality settings, and timing information
- **Players Table** - Tracks player information, connection status, AI flags, and voting data
- **Messages Table** - Chat message history with timestamps and player associations
- **Drizzle ORM** - Type-safe database operations with automatic schema validation

## Real-time Communication
- **Game State Synchronization** - WebSocket broadcasts ensure all players see consistent game state
- **Chat System** - Real-time message delivery with player identification and timestamps
- **Event-driven Updates** - Phase transitions, voting, and AI responses triggered by game events
- **Connection Management** - Automatic reconnection and player presence tracking

## AI Integration
- **Multiple Personalities** - Configurable AI behavior patterns (casual, funny, serious, shy)
- **Context-aware Responses** - AI analyzes game history and player interactions to generate appropriate responses
- **Delayed Response System** - Simulates human-like typing delays for more realistic gameplay
- **OpenAI API** - Uses GPT models for natural language generation with game-specific prompts

# External Dependencies

## Core Framework Dependencies
- **React 18** - Frontend framework with modern hooks and concurrent features
- **Express.js** - Node.js web framework for API and WebSocket server
- **TypeScript** - Type safety across frontend and backend code

## Database and ORM
- **Drizzle ORM** - Type-safe PostgreSQL ORM with automatic migrations
- **@neondatabase/serverless** - PostgreSQL database connection (configured for Neon but adaptable)
- **Drizzle-kit** - Schema management and migration tools

## UI and Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI primitives for complex components
- **shadcn/ui** - Pre-built component library built on Radix UI and Tailwind
- **Lucide React** - Modern icon library

## Real-time Communication
- **ws (WebSockets)** - WebSocket server implementation for real-time communication
- **Native WebSocket API** - Client-side WebSocket connection management

## AI and External APIs
- **OpenAI API** - GPT model integration for AI player responses
- **Custom AI personality system** - Configurable AI behavior patterns

## Development and Build Tools
- **Vite** - Fast development server and production build tool
- **esbuild** - Fast JavaScript/TypeScript bundler for backend
- **PostCSS + Autoprefixer** - CSS processing and vendor prefixing

## State Management and Data Fetching
- **TanStack Query** - Server state management, caching, and synchronization
- **Zustand/React Context** - Local state management (implied from component patterns)

## Utilities and Validation
- **Zod** - Runtime type validation and schema parsing
- **clsx + tailwind-merge** - Conditional CSS class name utilities
- **date-fns** - Date manipulation and formatting utilities