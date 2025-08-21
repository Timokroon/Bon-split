# Group Order Splitter

## Overview

A full-stack web application for managing group orders and splitting restaurant bills. Users can input orders through natural language, upload receipt images for automatic processing via OCR and AI, and get intelligent cost splitting between group members. The application features a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Uploads**: Multer middleware for handling multipart form data
- **Development**: Hot reload with Vite middleware integration in development mode

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle migrations with schema definitions in shared directory
- **Fallback Storage**: In-memory storage implementation for development/testing
- **Session Storage**: PostgreSQL sessions using connect-pg-simple

### Core Data Models
- **Users**: Basic user information with color-coded avatars
- **Orders**: Individual order items linked to users with quantity and pricing
- **Receipts**: Uploaded receipt metadata with OCR text and parsing results

### Authentication and Authorization
- Session-based authentication using PostgreSQL session store
- File upload validation with type and size restrictions
- CORS and security headers for API protection

## External Dependencies

### AI and Machine Learning Services
- **OpenAI GPT-4o**: Natural language processing for order text parsing and receipt analysis
- **Tesseract.js**: Client-side OCR for extracting text from receipt images

### Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development environment with integrated hosting

### Frontend Libraries
- **Radix UI**: Unstyled, accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **date-fns**: Date manipulation and formatting utilities
- **class-variance-authority**: Type-safe CSS class variants

### Development Tools
- **Vite**: Build tool and development server
- **ESBuild**: Fast JavaScript/TypeScript bundler for production
- **Drizzle Kit**: Database migration and introspection tools
- **Replit Plugins**: Development enhancement tools for Replit environment