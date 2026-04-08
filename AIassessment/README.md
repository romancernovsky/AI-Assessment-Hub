# AI Assessment Hub

This repository contains the AI Assessment Hub project, including the core application and supporting documentation.

## Project Structure

- **[ai-hub-assessment/](ai-hub-assessment/)**: The main Next.js web application for the assessment system.
- **[AI_Hub_Assessment_v2_Product_Specification.md](AI_Hub_Assessment_v2_Product_Specification.md)**: Detailed product specification for v2.
- **[AI_Hub_Assessment_v2_Question_Bank.xlsx](AI_Hub_Assessment_v2_Question_Bank.xlsx)**: Excel file containing the assessment question bank.
- **[VISUAL_STYLE_SPEC.md](VISUAL_STYLE_SPEC.md)**: Technical specification for maintaining visual consistency across projects.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Prisma (for database management)

### Installation

1. **Extract and Navigate**:
   Navigate to the `ai-hub-assessment/` directory (where `package.json` is located):
   ```bash
   cd ai-hub-assessment
   ```

2. **Environment Setup**:
   The `.env` file is NOT included in the repository/ZIP for security. You **MUST** create one:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` to provide your actual `DATABASE_URL` and `NEXTAUTH_SECRET`.

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Documentation

- [Product Specification](AI_Hub_Assessment_v2_Product_Specification.md)
- [Visual Style Specification](VISUAL_STYLE_SPEC.md)
